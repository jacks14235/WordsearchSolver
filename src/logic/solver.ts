type Solution = { word: string, start: [number, number], end: [number, number] }

export class WordSearch {
  private letters: string[];
  private tst: TST;
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
    this.tst = new TST();
    this.initTST();
    if (this.letters.length !== this.boxes.length) {
      throw new Error('Length mismatch between boxes and letters.');
    }
  }
  
  initTST() {
    this.tst = new TST();
    // horizontal
    for (let y = 0; y < this.height; y++) {
      const line = Array.from(this.yieldLine(0, y, [1, 0])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: i, y: y, dx: 1, dy: 0}, i);
      }
      const reverse = Array.from(
        this.yieldLine(this.width - 1, y, [-1, 0])
      ).join("");
      for (let i = 0; i < reverse.length; i++) {
        this.tst.add(reverse, {x: this.width - i - 1, y: y, dx: -1, dy: 0}, i);
      }
    }
    // vertical
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [0, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: i, dx: 0, dy: 1}, i);
      }
      const reverse = Array.from(
        this.yieldLine(x, this.height - 1, [0, -1])
      ).join("");
      for (let i = 0; i < reverse.length; i++) {
        this.tst.add(reverse, {x: x, y: this.height - i - 1, dx: 0, dy: -1}, i);
      }
    }
    // diagonal down right
    for (let y = this.height - 1; y >= 0; y--) {
      const line = Array.from(this.yieldLine(0, y, [1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: 0, y: y, dx: 1, dy: 1}, i);
      }
    }
    for (let x = 1; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: 0, dx: 1, dy: 1}, i);
      }
    }
		// diagonal up left
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, this.height - 1, [-1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: this.height - 1, dx: -1, dy: -1}, i);
      }
    }
		for (let y = this.height - 1; y >= 0; y--) {
      const line = Array.from(this.yieldLine(this.width - 1, y, [-1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: this.width - 1, y: y, dx: -1, dy: -1}, i);
      }
    }
		// diagonal down left
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [-1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: 0, dx: -1, dy: 1}, i);
      }
    }
		for (let y = 1; y < this.height; y++) {
      const line = Array.from(this.yieldLine(this.width - 1, y, [-1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: this.width - 1, y: y, dx: -1, dy: 1}, i);
      }
    }
		// diagonal up right
    for (let x = this.width - 1; x >= 0; x--) {
      const line = Array.from(this.yieldLine(x, this.height - 1, [1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: this.height - 1, dx: 1, dy: -1}, i);
      }
    }
		for (let y = this.height - 2; y >= 0; y--) {
      const line = Array.from(this.yieldLine(0, y, [1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: 0, y: y, dx: 1, dy: -1}, i);
      }
    }
  }

  public solve(): Solution[] {
    // const answerMap = new Map<string, PositionInfo[]>();
    console.log(this.letters)
    const solutions: {word: string, start: [number, number], end: [number, number], dir: [number, number]}[] = [];
    for (let word of this.words) {
      // answerMap.set(word, this.tst.get(word));
      const pos = this.tst.get(word);
      pos.forEach(p => {
        solutions.push({
          word: word,
          start: [p.x, p.y],
          end: [p.x + word.length * p.dx, p.y + word.length * p.dy],
          dir: [p.dx, p.dy]
        })
      })
    }
    console.log(solutions);
    const withBoxes: Solution[] = solutions.map(a => ({...a, start: this.getBoxCenter(...a.start), end: this.getBoxCenter(...a.end)}))
    return withBoxes;
  }

  private *yieldLine(startX: number, startY: number, dirs: [number, number]) {
    let x = startX,
      y = startY;
    while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      yield this.letters[x + this.width * y];
      x += dirs[0];
      y += dirs[1];
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
    this.initTST();
  }

  getBoxCenter(x: number, y: number): [number, number] {
    const b = this.boxes[this.width * y + x]
    console.log(x,y)
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
      if (i !== 0 && i % this.width === 0) {
        sb += '\n'
      }
      sb += l + ' '
    })
    return sb;
  }

  // solve() {
  //   const solutions: Solution[] = [];
  //   let s;
  //   let x, y;
  //   this.letters.forEach((l, i) => {
  //     this.words.forEach(w => {
  //       x = i % this.width;
  //       y = Math.floor(i / this.width)
  //       s = this.checkWord(w, l, x, y)
  //       if (s) {
  //         solutions.push({
  //           word: w,
  //           start: this.getBoxCenter(x, y),
  //           end: this.getBoxCenter(s[0], s[1])
  //         })
  //       }

  //     })
  //   })
  //   return solutions;
  // }

  // checkWord(word: string, letter1: string, x: number, y: number): [number, number] | null {
  //   if (letter1 != word[0])
  //     return null
  //   let ret: [number, number] | null = null;
  //   ret = ret || this.checkLetter(word, 1, x, y, [-1, -1]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [-1, 0]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [-1, 1]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [0, -1]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [0, 1]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [1, -1]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [1, 0]);
  //   ret = ret || this.checkLetter(word, 1, x, y, [1, 1]);
  //   return ret;
  // }


  // checkLetter(word: string, index: number, x: number, y: number, vector: [number, number]): [number, number] | null {
  //   const nx = x + vector[0];
  //   const ny = y + vector[1];
  //   if (index >= word.length) {

  //     return [x, y];
  //   }
  //   if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
  //     return null;
  //   }
  //   if (this.getLetter(nx, ny) == word[index]) {
  //     return this.checkLetter(word, index + 1, nx, ny, vector);
  //   }
  //   else {
  //     return null;
  //   }
  // }
}

type PositionInfo = {
  x: number,
  y: number,
  dx: number,
  dy: number,
}

class TSTNode {
  public childL: TSTNode | null = null;
  public childR: TSTNode | null = null;
  public childM: TSTNode | null = null;
  public endings: PositionInfo[] = [];
  constructor(public letter: string) {}

  public addEnding(info: PositionInfo) {
    this.endings.push(info);
  }

  public static createToBottom(
    s: string,
    index: number,
    info: PositionInfo
  ) {
    const newNode = new TSTNode(s[index]);
    if (index === s.length - 1) {
      newNode.addEnding(info);
      return newNode;
    }
    newNode.childM = this.createToBottom(s, index + 1, info);
    newNode.addEnding(info);
    return newNode;
  }
}

export class TST {
  private root: TSTNode | null = null;

  public get(s: string): PositionInfo[] {
    if (!this.root) return [];
    return this.getRecurse(s, 0, this.root);
  }

  private getRecurse(
    s: string,
    index: number,
    curr: TSTNode
  ): PositionInfo[] {
    if (curr.letter === s[index]) {
      if (index === s.length - 1) return curr.endings;
      if (curr.childM) return this.getRecurse(s, index + 1, curr.childM);
      else return [];
    } else if (s[index] > curr.letter) {
      if (curr.childR) return this.getRecurse(s, index, curr.childR);
      else return [];
    } else {
      if (curr.childL) return this.getRecurse(s, index, curr.childL);
      else return [];
    }
  }

  public add(s: string, info: PositionInfo, startIndex?: number) {
    if (!this.root)
      this.root = TSTNode.createToBottom(s, startIndex || 0, info);
    this.addRecurse(this.root, s, startIndex || 0, info);
  }

  private addRecurse(
    node: TSTNode,
    s: string,
    index: number,
    info: PositionInfo
  ) {
    if (s[index] === node.letter) {
      node.addEnding(info);
      if (index === s.length - 1) {
        return;
      }
      this.addRecurse(
        node.childM ||
          (node.childM = TSTNode.createToBottom(s, index + 1, info)),
        s,
        index + 1,
        info
      );
    } else if (s[index] > node.letter) {
      if (node.childR) {
        this.addRecurse(node.childR, s, index, info);
      } else {
        node.childR = TSTNode.createToBottom(s, index, info);
      }
    } else {
      if (node.childL) {
        this.addRecurse(node.childL, s, index, info);
      } else {
        node.childL = TSTNode.createToBottom(s, index, info);
      }
    }
  }
}

export class WordSearchNew {
  private tst: TST;
  private width: number;
  private height: number;
  constructor(private letters: string[], private words: string[]) {
    this.width = this.letters[0].length;
    this.height = this.letters.length;
    this.tst = new TST();
    this.initTST();
  }

  initTST() {
    this.tst = new TST();
    // horizontal
    for (let y = 0; y < this.height; y++) {
      const line = Array.from(this.yieldLine(0, y, [1, 0])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: i, y: y, dx: 1, dy: 0}, i);
      }
      const reverse = Array.from(
        this.yieldLine(this.width - 1, y, [-1, 0])
      ).join("");
      for (let i = 0; i < reverse.length; i++) {
        this.tst.add(reverse, {x: this.width - i - 1, y: y, dx: -1, dy: 0}, i);
      }
    }
    // vertical
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [0, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: i, dx: 0, dy: 1}, i);
      }
      const reverse = Array.from(
        this.yieldLine(x, this.height - 1, [-1, 0])
      ).join("");
      for (let i = 0; i < reverse.length; i++) {
        this.tst.add(reverse, {x: x, y: this.height - i - 1, dx: -1, dy: 0}, i);
      }
    }
    // diagonal down right
    for (let y = this.height - 1; y >= 0; y--) {
      const line = Array.from(this.yieldLine(0, y, [1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: 0, y: y, dx: 1, dy: 1}, i);
      }
    }
    for (let x = 1; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: 0, dx: 1, dy: 1}, i);
      }
    }
		// diagonal up left
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, this.height - 1, [-1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: this.height - 1, dx: -1, dy: -1}, i);
      }
    }
		for (let y = this.height - 1; y >= 0; y--) {
      const line = Array.from(this.yieldLine(this.width - 1, y, [-1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: this.width - 1, y: y, dx: -1, dy: -1}, i);
      }
    }
		// diagonal down left
    for (let x = 0; x < this.width; x++) {
      const line = Array.from(this.yieldLine(x, 0, [-1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: 0, dx: -1, dy: 1}, i);
      }
    }
		for (let y = 1; y < this.height; y++) {
      const line = Array.from(this.yieldLine(this.width - 1, y, [-1, 1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: this.width - 1, y: y, dx: -1, dy: 1}, i);
      }
    }
		// diagonal up right
    for (let x = this.width - 1; x >= 0; x--) {
      const line = Array.from(this.yieldLine(x, this.height - 1, [1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: x, y: this.height - 1, dx: 1, dy: -1}, i);
      }
    }
		for (let y = this.height - 2; y >= 0; y--) {
      const line = Array.from(this.yieldLine(0, y, [1, -1])).join("");
      for (let i = 0; i < line.length; i++) {
        this.tst.add(line, {x: 0, y: y, dx: 1, dy: -1}, i);
      }
    }
  }

  private *yieldLine(startX: number, startY: number, dirs: [number, number]) {
    let x = startX,
      y = startY;
    while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      yield this.letters[y][x];
      x += dirs[0];
      y += dirs[1];
    }
  }

  public solve() {
    const answerMap = new Map<string, PositionInfo[]>();
    for (let word of this.words) {
      answerMap.set(word, this.tst.get(word));
    }
    return answerMap;
  }
}
const test = 
`T I I S I R F R O S T M R E O U I F E L
E D I L C E I L N A O F A S E O R Y H T
S E E T E R S O C H R I S T M A S F A S
A H B D O H W E O Y E T R H C E S I A O
A E H H T S R C A H N R E S A A N H T I
D D E R T P O Y E S S D S T E C S P K S
O O E O H W D H A L T W N H C T E G R O
I A R R E N I R L N E S E S N E T T I M
I M V E I A E E T F W S I E D M C T P R
L H T W H S B I L R S L E S O A A E D O
B R S U I H T S L E D C E A C O L D A R
R L T H G O E C A E L D N A C S A H H H
E R A I C V I N O Z B O O T S A L H C O
S B E N S E D E C E M B E R R O E B H P
O L F T K L L E O L P E K A L F W O N S
S L D R A E N I A D R A Z Z I L B T A H
E I O L H E T T N N A T I S I M E N E U
U H P S N O W P H T I R N A M W O N S S
F C N O S A E S B P T A O G B D L R T R
E C A L P E R I F G N R B N C E S E N O`;
