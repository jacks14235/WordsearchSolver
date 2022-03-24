type Solution = { word: string, start: [number, number], end: [number, number] }

export class WordSearch {
  private letters: string[];
  private words: string[];
  constructor(
    letters: string[],
    public width: number,
    public height: number,
    words: string[],
    private confidences: number[],
    private boxes: number[][]) {
    this.letters = letters.map((l) => l.toUpperCase())
    this.words = words.map(m => m.toUpperCase()) || [];
    if (this.letters.length !== this.boxes.length) {
      throw new Error('Length mismatch between boxes and letters.');
    }
  }

  getLetter(x: number, y: number) {
    return this.letters[this.width * y + x];
  }

  setWords(words: string[]) {
    this.words = words.map(w => w.toUpperCase());
  }

  changeLetter(i: number, l: string) {
    this.letters[i] = l.toUpperCase();
  }

  getBoxCenter(x: number, y: number): [number, number] {
    const b = this.boxes[this.width * y + x]
    return [b[0] + (b[1] - b[0]) / 2, b[2] + (b[3] - b[2]) / 2];
  }

  getConfidence(i: number) {
    return this.confidences[i] || 0;
  }

  // tells whether the given coordinate is inside a box,
  // returns the index of the box and the letter 
  // undefined if the coordinate is not in a box
  inBox(x: number, y: number): {index: number, letter: string, box: number[]} | undefined {
    let r: {index: number, letter: string, box: number[]} | undefined = undefined;
    this.boxes.forEach((box, i) => {
      if ((box[0] < x) && (x < box[1]) && (box[2] < y) && (y < box[3])) {
        r = {index: i, letter: this.letters[i], box};
      }
    });
    return r;
  }

  getBoxes() {
    return this.boxes;
  }

  getLetters() {
    return this.letters;
  }

  getWords() {
    return this.words;
  }

  toString() {
    let sb = '';
    this.letters.forEach((l, i) => {
      if (i !== 0 && i % this.width == 0) {
        sb += '\n'
      }
      sb += l + ' '
    })
    return sb;
  }

  solve() {
    const solutions: Solution[] = [];
    let s;
    let x, y;
    this.letters.forEach((l, i) => {
      this.words.forEach(w => {
        x = i % this.width;
        y = Math.floor(i / this.width)
        s = this.checkWord(w, l, x, y)
        if (s) {
          solutions.push({
            word: w,
            start: this.getBoxCenter(x, y),
            end: this.getBoxCenter(s[0], s[1])
          })
        }

      })
    })
    return solutions;
  }

  checkWord(word: string, letter1: string, x: number, y: number): [number, number] | null {
    if (letter1 != word[0])
      return null
    let ret: [number, number] | null = null;
    ret = ret || this.checkLetter(word, 1, x, y, [-1, -1]);
    ret = ret || this.checkLetter(word, 1, x, y, [-1, 0]);
    ret = ret || this.checkLetter(word, 1, x, y, [-1, 1]);
    ret = ret || this.checkLetter(word, 1, x, y, [0, -1]);
    ret = ret || this.checkLetter(word, 1, x, y, [0, 1]);
    ret = ret || this.checkLetter(word, 1, x, y, [1, -1]);
    ret = ret || this.checkLetter(word, 1, x, y, [1, 0]);
    ret = ret || this.checkLetter(word, 1, x, y, [1, 1]);
    return ret;
  }


  checkLetter(word: string, index: number, x: number, y: number, vector: [number, number]): [number, number] | null {
    const nx = x + vector[0];
    const ny = y + vector[1];
    if (index >= word.length) {

      return [x, y];
    }
    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
      return null;
    }
    if (this.getLetter(nx, ny) == word[index]) {
      return this.checkLetter(word, index + 1, nx, ny, vector);
    }
    else {
      return null;
    }
  }
}