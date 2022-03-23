import { useCallback, useEffect, useRef, useState } from "react";
import { ImageReader } from "../logic/image-reader";
import { analyzeImage } from "../logic/read-and-solve";
import englishwords from "../logic/usa2.json";
import '../App.css';
import { WordSearch } from "../logic/solver";
import { resolve } from "dns";

export type Contexts = {
  img: CanvasRenderingContext2D,
  box: CanvasRenderingContext2D,
  letter: CanvasRenderingContext2D,
  line: CanvasRenderingContext2D
}

export type ImageLetter = {
  l: number, r: number, t: number, b: number,
  letter: string,

}

export function WordsearchSolver() {
  const imgCanvas = useRef<HTMLCanvasElement>(null);
  const boxCanvas = useRef<HTMLCanvasElement>(null);
  const letterCanvas = useRef<HTMLCanvasElement>(null);
  const lineCanvas = useRef<HTMLCanvasElement>(null);
  const [puzzle, setPuzzle] = useState<WordSearch>();
  const [wordString, setWordString] = useState<string>('');
  const [imgVisible, setImgVisible] = useState<boolean>(true);
  const [boxesVisible, setBoxesVisible] = useState<boolean>(false);
  const [linesVisible, setLinesVisible] = useState<boolean>(true);
  const [lettersVisible, setLettersVisible] = useState<boolean>(false);
  const [rescaleVal, setRescaleVal] = useState<number>(1);
  const [letterOffset, setLetterOffset] = useState<number>(0);
  const [letterStyle, setLetterStyle] = useState<any>();
  const [changeLetterModal, setChangeLetterModal] = useState<{
    ctx: CanvasRenderingContext2D,
    index: number,
    letter: string,
    box: number[],
    puzzleWidth: number
  } | undefined>();

  useEffect(() => {
    window.addEventListener('resize', rescale);
    return (() => window.removeEventListener('resize', rescale))
  }, [])

  useEffect(() => {
    drawPuzzle();
  }, [puzzle])

  function test() {
    return `scale(${rescaleVal}) translateX(${letterOffset}px)`
  }

  useEffect(() => {
    const newLetterStyle = {
      display: toDisp(lettersVisible),
      transform: test()
    };
    setLetterStyle(newLetterStyle)
  }, [lettersVisible, rescaleVal, letterOffset])

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const img = imgCanvas.current?.getContext('2d');
    const box = boxCanvas.current?.getContext('2d');
    const letter = letterCanvas.current?.getContext('2d');
    const line = lineCanvas.current?.getContext('2d');
    if (!(img && box && letter && line)) return;
    const contexts: Contexts = { img, box, letter, line };
    if (e.target.files?.length && e.target.files.length > 0) {
      const f: File = e.target.files[0];
      const image = new Image();
      const url = window.URL || window.webkitURL,
        src = url.createObjectURL(f);
      image.src = src;
      image.onload = () => {
        const screenWidth = window.outerWidth;
        const w = Math.min(screenWidth, 400);
        const h = (w / image.width) * image.height;
        img.canvas.width = image.width;
        img.canvas.height = image.height;
        rescale();

        img.drawImage(image, 0, 0, image.width, image.height)
        console.log("Image size: ", image.width, 'x', image.height)
        const idt = img.getImageData(0, 0, image.width, image.height)
        console.log(idt)
        const imgRead = new ImageReader(image.width, image.height, idt)
        // set loading true
        analyzeImage(imgRead, getWords(), contexts)
          .then((ws) => {
            setPuzzle(ws);
          });
      }
    }
  }

  function getWords() {
    const words = wordString.split(/[^a-zA-Z0-9]+/);
    if (words[0] == '') words.splice(0, 1);
    if (words[words.length - 1] == '') words.pop();
    if (words.length > 0) {
      console.log(words);
      return words;
    }
    return englishwords.filter(w => w.length > 3);
  }

  function drawPuzzle() {
    if (!puzzle) return;
    const solutions = puzzle.solve();
    console.log(solutions);
    console.log("Found", solutions.length, "words out of", puzzle.getWords().length)
    console.log(puzzle.toString())

    const imgCtx = imgCanvas.current?.getContext('2d');
    if (!imgCtx) return;

    const lineCtx = lineCanvas.current?.getContext('2d');
    if (lineCtx) {
      lineCtx.canvas.width = imgCtx.canvas.width;
      lineCtx.canvas.height = imgCtx.canvas.height;
      lineCtx.lineWidth = 5;
      lineCtx.strokeStyle = '#5555FFFF';
      solutions.forEach(s => {
        lineCtx.beginPath();
        lineCtx.moveTo(s.start[0], s.start[1])
        lineCtx.lineTo(s.end[0], s.end[1])
        lineCtx.stroke();
      })
    }

    const letterCtx = letterCanvas.current?.getContext('2d');
    if (letterCtx) {
      const fontSize = Math.floor(.5 * imgCtx.canvas.width / puzzle.width);
      letterCtx.canvas.width = imgCtx.canvas.width;
      letterCtx.canvas.height = imgCtx.canvas.height;
      letterCtx.font = `bold ${fontSize}px Arial`;
      letterCtx.fillStyle = '#FF0077FF';
      const letters = puzzle.getLetters();
      puzzle.getBoxes().forEach((s, i) => {
        letterCtx.fillText(letters[i][0], s[0], s[3]);
      });
    }
  }

  function reSolve() {
    const words = getWords();
    puzzle?.setWords(words);
    const solutions = puzzle?.solve();
    console.log(solutions);
    const lineCtx = lineCanvas.current?.getContext('2d');
    if (!solutions) return;
    lineCtx?.clearRect(0, 0, lineCtx.canvas.width, lineCtx.canvas.height);
    if (lineCtx) {
      lineCtx.lineWidth = 5;
      lineCtx.strokeStyle = '#5555FFFF';
      solutions.forEach(s => {
        lineCtx.beginPath();
        lineCtx.moveTo(s.start[0], s.start[1])
        lineCtx.lineTo(s.end[0], s.end[1])
        lineCtx.stroke();
      })
    }
  }

  function rescale() {
    // rescale canvases
    const ctx = imgCanvas.current?.getContext('2d');
    if (!ctx) return;
    let xProp = ctx.canvas.width / window.outerWidth;
    const yProp = ctx.canvas.height / window.outerHeight;
    if (window.outerWidth > 768) {
      xProp *= .8;
    }
    const big = Math.max(xProp, yProp);
    setRescaleVal(.9 / big);
  }

  function canvasClick(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const canvas = letterCanvas.current;
    if (!canvas || !puzzle) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - (rect?.left || 0)) / rescaleVal;
    const y = (e.clientY - (rect?.top || 0)) / rescaleVal;
    console.log(x, y)
    const clicked = puzzle?.inBox(x, y);
    console.log(clicked);
    if (clicked) {
      setChangeLetterModal({
        ctx,
        index: clicked.index,
        letter: clicked.letter,
        box: clicked.box,
        puzzleWidth: puzzle.width
      })
    }
  }

  function onChangeSumbit(newLetter: string | undefined) {
    if (!changeLetterModal) return;
    if (newLetter) {
      puzzle?.changeLetter(changeLetterModal.index, newLetter);
      reSolve();
    }
    setChangeLetterModal(undefined);
  }

  const toDisp = (b: boolean) => b ? 'block' : 'none';
  const toColor = (b: boolean) => b ? 'orangered' : 'white';

  useEffect(() => console.log(letterOffset), [letterOffset])

  return (
    <div className='flex flex-col md:flex-row'>
      <div className='w-screen max-w-screen grid grid-flow-row justify-center md:justify-start p-4 md:w-1/5 md:flex flex-col items-start md:pl-4'>
        <input type='file' onChange={(e) => onFileInput(e)} />
        <div className='w-2/3 mt-4 w-full max-w-xs flex'>
          <textarea className='border-none p-1 bg-blue-50 rounded-xl flex-grow' rows={3} value={wordString} onChange={(e) => setWordString(e.target.value)} />
          <button className='w-8 h-8 bg-blue-600 rounded-lg ml-3 self-end' onClick={reSolve}>✓</button>
        </div>
        {changeLetterModal && <ChangeLetterModal ctx={changeLetterModal.ctx}
          index={changeLetterModal.index}
          letter={changeLetterModal.letter}
          box={changeLetterModal.box}
          puzzleWidth={changeLetterModal.puzzleWidth}
          close={(newLetter) => onChangeSumbit(newLetter)}
        />}
        <button className={`py-1 rounded-xl px-2 my-2 md:my-4 max-w-xs bg-${imgVisible ? 'blue-600' : 'white'} hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setImgVisible(!imgVisible)} >Toggle Image</button>
        <button className={`py-1 rounded-xl px-2 my-2 md:my-4 max-w-xs bg-${boxesVisible ? 'blue-600' : 'white'} hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setBoxesVisible(!boxesVisible)} >Toggle Boxes</button>
        <button className={`py-1 rounded-xl px-2 my-2 md:my-4 max-w-xs bg-${linesVisible ? 'blue-600' : 'white'} hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setLinesVisible(!linesVisible)} >Toggle Solutions</button>
        <button className={`py-1 rounded-xl px-2 my-2 md:my-4 max-w-xs bg-${lettersVisible ? 'blue-600' : 'white'} hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setLettersVisible(!lettersVisible)} >Toggle Letters</button>
        <div className='flex flex-row justify-center'>
          <button className={`py-1 rounded-l-xl m-r-1 px-2 my-2 md:my-4 max-w-xs bg-blue-600 hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setLetterOffset(letterOffset - 5)} >{'<'}</button>
          <button className={`py-1 rounded-r-xl m-l-1 px-2 my-2 md:my-4 max-w-xs bg-blue-600 hover:bg-blue-400 transform transition transition-color duration-300`} onClick={() => setLetterOffset(letterOffset + 5)} >{'>'}</button>
        </div>
        {/* </div> */}
      </div>
      <div className='flex flex-grow relative justify-center' style={{}}>
        <canvas className='absolute origin-top-center md:origin-top-left md:left-0' ref={imgCanvas} style={{ display: toDisp(imgVisible), transform: `scale(${rescaleVal})` }}></canvas>
        <canvas className='absolute origin-top-center md:origin-top-left md:left-0' ref={boxCanvas} style={{ display: toDisp(boxesVisible), transform: `scale(${rescaleVal})` }}></canvas>
        <canvas className='absolute origin-top-center md:origin-top-left md:left-0' ref={lineCanvas} style={{ display: toDisp(linesVisible), transform: `scale(${rescaleVal})` }}></canvas>
        <canvas className='absolute origin-top-center md:origin-top-left md:left-0' ref={letterCanvas} onClick={e => canvasClick(e)} style={letterStyle}></canvas>
      </div>
    </div>
  )
}

function ChangeLetterModal(props: {
  ctx: CanvasRenderingContext2D,
  index: number,
  letter: string,
  box: number[],
  puzzleWidth: number,
  close: (newLetter?: string) => void
}) {
  const [newLetter, setNewLetter] = useState<string>('');
  function onSubmit() {
    console.log(props.box)
    props.ctx.beginPath();
    props.ctx.clearRect(props.box[0], props.box[2],
      props.box[1] - props.box[0],
      props.box[3] - props.box[2]);
    props.ctx.stroke();
    const fontSize = Math.floor(.5 * props.ctx.canvas.width / props.puzzleWidth);
    props.ctx.font = `bold ${fontSize}px Arial`;
    props.ctx.fillStyle = '#FF0077FF';
    props.ctx.fillText(newLetter, props.box[0], props.box[2] + (props.box[3] - props.box[2]));
    props.close(newLetter);
  }
  return (
    <div className='change-letter-modal'>
      <div>
        <p>Change "{props.letter}" to:</p>
        <form onSubmit={onSubmit}>
          <input autoFocus type='text' value={newLetter} onChange={e => setNewLetter(e.target.value[0]?.toUpperCase())}></input>
          <div>
            <button onClick={() => props.close()}>Cancel</button>
            <button onClick={onSubmit} type='submit'>Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}