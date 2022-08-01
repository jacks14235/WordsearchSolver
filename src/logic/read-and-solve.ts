import { BWImage } from "./bw-image-reader";
import { ImageReader } from "./image-reader";
import * as tf from '@tensorflow/tfjs';
import { WordSearch } from "./solver";
import { Gradient } from "./gradient";
import { Contexts } from "../components/read-and-solve";

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
type Inference = [string, number][];

export function analyzeImage(img: ImageReader, words: string[], contexts: Contexts, modelPath?: string) {
  console.log('analyzeImage');
  return new Promise<WordSearch>(async (resolve, reject) => {
    const bw = BWImage.fromColor(img);
    const toFill = bw.copy();
    const hiContrast = BWImage.newBlank(bw.width, bw.height);

    const nPixels = bw.width * bw.height;
    const threshhold = toFill.getAverageColor() - 25;
    const corners = { l: toFill.width, r: 0, t: toFill.height, b: 0 }
    const boxes = [];
    let c = 0;
    for (let i = 0; i < nPixels; i++) {
      if (toFill.getPixeli(i) < threshhold) {
        corners.l = toFill.width;
        corners.r = 0;
        corners.t = toFill.height;
        corners.b = 0;
        toFill.fillFromi(i, threshhold, corners, hiContrast)
        boxes.push([corners.l, corners.r, corners.t, corners.b])
        c ++;
      }
    }
    const maxHeight = boxes.reduce((max, i) => Math.max(max, i[3] - i[2]), 0);
    const filteredBoxes = boxes.filter((b) => b[3] - b[2] > maxHeight * 0.5);

    filteredBoxes.sort((a, b) => a[2] - b[2] > maxHeight ? 1 : a[0] - b[0])
    const ws = await analyzeBoxes(hiContrast, filteredBoxes, words, contexts, modelPath);
    resolve(ws);
  })
}

async function analyzeBoxes(hiContrast: BWImage, boxes: number[][], words: string[], contexts: Contexts, modelPath?: string) {
  console.log('analyzeBoxes')
  const cropBoxes = new Float32Array(boxes.length * 4);
  const EXTRA_PAD = 5;
  const w = hiContrast.width - 1;
  const h = hiContrast.height - 1;
  boxes.forEach((b, i) => {
    const dx = b[1] - b[0]
    const dy = b[3] - b[2]
    const max = Math.max(dx, dy);
    const padX = Math.ceil((max - dx) / 2) + EXTRA_PAD;
    const padY = Math.ceil((max - dy) / 2) + EXTRA_PAD;
    const x1 = b[0] - padX;
    const y1 = b[2] - padY;
    const x2 = b[1] + padX;
    const y2 = b[3] + padY;
    cropBoxes[i * 4] = y1 / h;
    cropBoxes[i * 4 + 1] = x1 / w;
    cropBoxes[i * 4 + 2] = y2 / h;
    cropBoxes[i * 4 + 3] = x2 / w;
  })

  const boxIndices = new Int32Array(boxes.length).fill(0);

  const allImageData = hiContrast.getData();

  // move arrays into tensors to crop the image into letters 
  const imageTensor: tf.Tensor<tf.Rank.R4> = tf.tensor(allImageData, [1, hiContrast.height, hiContrast.width, 1]);
  const boxTensor: tf.Tensor<tf.Rank.R2> = tf.tensor(cropBoxes, [boxes.length, 4]);
  const boxIndicesTensor: tf.Tensor<tf.Rank.R1> = tf.tensor(boxIndices, [boxes.length]);
  const CROP_SIZE: [number, number] = [28, 28]
  
  console.log(1, hiContrast.height, hiContrast.width, 1);
  console.log(boxes.length, 4);
  console.log(boxes.length);

  // separate images of each letter and send them to tf model
  const resizedTensor = tf.image.cropAndResize(imageTensor, boxTensor, boxIndicesTensor, CROP_SIZE);
  console.log(resizedTensor.shape);
  const letters = await infer(resizedTensor, modelPath);

  // put boxes on box canvas
  contexts.box.canvas.width = contexts.img.canvas.width;
  contexts.box.canvas.height = contexts.img.canvas.height;
  const g = Gradient.stoplight();
  contexts.box.lineWidth = 5;
  boxes.forEach((b, i) => {
    contexts.box.strokeStyle = `rgb(${g.eval(letters[i][1]).join(',')})`;
    contexts.box.beginPath();
    contexts.box.rect(b[0] - 3, b[2] - 3, b[1] - b[0] + 3, b[3] - b[2] + 3)
    contexts.box.stroke();
  });

  // find width and height of puzzle
  let width = 0;
  while (boxes[width][0] < boxes[width + 1][0]) width++;
  width++;
  const height = boxes.length / width;
  const confidences = letters.map(l => l[1]);
  console.log(width, height);

  return new WordSearch(letters.map(l => l[0]), width, height, words, confidences, boxes);

  // contexts.line.canvas.width = contexts.img.canvas.width;
  // contexts.line.canvas.height = contexts.img.canvas.height;
  // contexts.line.lineWidth = 5;
  // contexts.line.strokeStyle = '#5555FFFF';
  // solutions.forEach(s => {
  //   const start = boxes[s.start[0] + s.start[1] * width];
  //   const end = boxes[s.end[0] + s.end[1] * width];
  //   contexts.line.beginPath();
  //   contexts.line.moveTo(start[0] + (start[1] - start[0]) / 2, start[2] + (start[3] - start[2]) / 2)
  //   contexts.line.lineTo(end[0] + (end[1] - end[0]) / 2, end[2] + (end[3] - end[2]) / 2)
  //   contexts.line.stroke();
  // })

  // contexts.letter.canvas.width = contexts.img.canvas.width;
  // contexts.letter.canvas.height = contexts.img.canvas.height;
  // contexts.letter.font = "bold 30px Arial";
  // contexts.letter.fillStyle = '#FF0077FF';
  // boxes.forEach((s, i) => {
  //   contexts.letter.fillText(letters[i][0], s[0], s[3]);
  // })
}

function infer(t: tf.Tensor<tf.Rank.R4>, modelPath?: string) {
  console.log('Inferring with ', modelPath)
  return new Promise<Inference>(async (resolve, reject) => {
    const model = await tf.loadGraphModel('./models/bw_no_rotate/model.json');
    const out = model.predict(t) as tf.Tensor<tf.Rank>;
    console.log(out.shape);
    const ds = out.dataSync();
    const maxes = Array.from(tf.argMax(out, 1).dataSync());
    // scale output values linearly between 0 and 1
    const normalized = normalize(ds, 0, 1);
    resolve (maxes.map((o, i) => [alphabet[o], arrayMax(normalized.slice(26 * i, 26 * (i + 1)))]))
  })
}



// function showFromTensor(tensor, imageNumber, canvasNum) {
//   const shape = tensor.shape;
//   const data = tensor.dataSync();
//   const imSize = shape[1] * shape[2] * shape[3];
//   const canvasSize = shape[1] * shape[2] * 4;
//   const pixels = new Uint8Array(canvasSize)
//   let c = 0;
//   for (let i = 0; i < imSize; i++) {
//     pixels[c++] = data[i + imageNumber * imSize];
//     pixels[c++] = data[i + imageNumber * imSize];
//     pixels[c++] = data[i + imageNumber * imSize];
//     pixels[c++] = 255;
//   }
//   const canvas2 = document.getElementById('canvas' + canvasNum);
//   const ctx = canvas2.getContext('2d');
//   canvas2.width = shape[2];
//   canvas2.height = shape[1];

//   const idata = ctx.createImageData(shape[2], shape[1]);
//   idata.data.set(pixels);

//   ctx.putImageData(idata, 0, 0);
// }

function normalize(data: Float32Array | Int32Array | Uint8Array | number[], a: number, b: number) {
  console.log(data)
  const max = arrayMax(data)
  const min = arrayMin(data)
  console.log(max, min)
  return data.map(d => ((d - min) / (max - min)) * (b - a) + a)
}


function arrayMax(a: Float32Array | Int32Array | Uint8Array | number[]) {
  let m = a[0];
  for (let i = 1; i < a.length; i++) {
    if (a[i] > m)
      m = a[i]
  }
  return m;
}

function arrayMin(a: Float32Array | Int32Array | Uint8Array | number[]) {
  let m = a[0];
  for (let i = 1; i < a.length; i++) {
    if (a[i] < m)
      m = a[i]
  }
  return m;
}