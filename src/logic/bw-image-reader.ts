import { ImageReader } from "./image-reader";

type Corners = {l: number, r: number, t: number, b: number}

export class BWImage {
  // mostly for internal use, usually using fromColor() or copy()
  constructor(private data: Uint8Array, 
              public width: number, 
              public height: number, 
              private averageColor: number) {}

  static fromColor(colorImage: ImageReader) {
    const nPixels = colorImage.width * colorImage.height;
    const bwData = new Uint8Array(nPixels);
    let sum = 0;
    let avg = 0;
    const colorData: Uint8ClampedArray = colorImage.getData().data;
    for (let i = 0; i < nPixels; i++) {
      if (i == 14235) console.log((colorData[4 * i] + colorData[4 * i + 1] + colorData[4 * i + 2]))
      avg = Math.floor((colorData[4 * i] + colorData[4 * i + 1] + colorData[4 * i + 2]) / 3);
      sum += avg;
      bwData[i] = avg;
    }
    console.log(sum, nPixels)
    return new BWImage(bwData, colorImage.width, colorImage.height, Math.floor(sum / nPixels))
  }

  static newBlank(w: number, h: number) {
    return new BWImage(new Uint8Array(w * h).fill(255), w, h, 255);
  }

  getData() {
    return this.data;
  }

  getAverageColor() {
    return this.averageColor;
  }

  getPixeli(i: number) {
    return this.data[i]
  }

  getPixel(x: number, y: number) {
    return this.data[x + this.width * y]
  }

  setPixel(x: number, y: number, v: number) {
    this.data[x + this.width * y] = v;
  }

  toCanvas() {
    const buff = new Uint8ClampedArray(this.width * this.height * 4);
    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        buff[4 * (y * this.width + x)] = this.getPixel(x, y)
        buff[1 + 4 * (y * this.width + x)] = this.getPixel(x, y)
        buff[2 + 4 * (y * this.width + x)] = this.getPixel(x, y)
        buff[3 + 4 * (y * this.width + x)] = 255
      }
    }
    return buff;
  }

  copy() {
    const newArray = new Uint8Array(this.width * this.height);
    newArray.set(this.data);
    return new BWImage(
      newArray,
      this.width,
      this.height,
      this.averageColor)
  }

  fillFromi(i: number, threshhold: number, corners: Corners, hiContrast: BWImage) {
    const x = Math.floor(i % this.width);
    const y = Math.floor(i / this.width);
    const t = hiContrast;
    this.fill(x, y, threshhold, corners, t)
  }

  fill(x: number, y: number, threshhold: number, corners: Corners, hiContrast: BWImage) {
    if (this.getPixel(x, y) < threshhold) {
      this.setPixel(x, y, 255);
      hiContrast.setPixel(x, y, 0);
      if (x < corners.l) corners.l = x;
      if (x > corners.r) corners.r = x;
      if (y < corners.t) corners.t = y;
      if (y > corners.b) corners.b = y;

      const xPlus = (x > 0)
      const xMinus = (x < this.width - 1)
      const yPlus = (y > 0)
      const yMinus = (y < this.height - 1)

      // Can definitely optimize checks
      if (xMinus) this.fill(x - 1, y, threshhold, corners, hiContrast);
      if (xPlus) this.fill(x + 1, y, threshhold, corners, hiContrast);
      if (yMinus) this.fill(x, y - 1, threshhold, corners, hiContrast);
      if (yPlus) this.fill(x, y + 1, threshhold, corners, hiContrast);

      if (xMinus && yMinus) this.fill(x - 1, y - 1, threshhold, corners, hiContrast);
      if (xMinus && yPlus) this.fill(x - 1, y + 1, threshhold, corners, hiContrast);
      if (xPlus && yMinus) this.fill(x + 1, y - 1, threshhold, corners, hiContrast);
      if (xPlus && yPlus) this.fill(x + 1, y + 1, threshhold, corners, hiContrast);
    }
  }

}