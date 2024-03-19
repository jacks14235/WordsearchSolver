import { add } from "@tensorflow/tfjs";

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
    this.words = words.map(w => w.toUpperCase()).filter(w => w.length > 3) || [];
    this.tst = new TST();
    
    // Initialize tst
    for (let word of this.words) {
      this.tst.add(word);
    }

    if (this.letters.length !== this.boxes.length) {
      throw new Error('Length mismatch between boxes and letters.');
    }
  }

  public solve(): Solution[] {
    // const answerMap = new Map<string, PositionInfo[]>();

    const solutions: {word: string, start: [number, number], end: [number, number], dir: [number, number]}[] = [];

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
    // this.initTST();
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
      if (i !== 0 && i % this.width === 0) {
        sb += '\n'
      }
      sb += l + ' '
    })
    return sb;
  }
}

class FullNode {
  public children: FullNode[] = new Array(26).fill(null);
  public end: boolean = false;
}

class FullTree {
  private root = new FullNode();
  public add(s: string) {
    this.addRecurse(s, this.root, 0);
  }
  private addRecurse(s: string, node: FullNode, index: number) {
    if (index === s.length - 1) {
      node.end = true;
      console.log('End', s, index);
      return;
    }
    const c = s.charCodeAt(index) - 65;
    if (node.children[c] == null) {
      node.children[c] = new FullNode();
    } else {
      this.addRecurse(s, node.children[c], index + 1);
    }
  }

  public get(s: string): boolean {
    return this.getRecurse(s, this.root, 0);
  }

  private getRecurse(s: string, node: FullNode, index: number): boolean {
    if (index === s.length - 1) return node.end;
    const c = s.charCodeAt(index) - 65;
    if (node.children[c] == null) return false
    else return this.getRecurse(s, node.children[c], index + 1);
  }
}

class TSTNode {
  public childL: TSTNode | null = null;
  public childR: TSTNode | null = null;
  public childM: TSTNode | null = null;
  // is there a word that ends here?
  public end: boolean = false;
  constructor(public letter: string) {}

  public static createToBottom(
    s: string,
    index: number,
  ) {
    const newNode = new TSTNode(s[index]);
    if (index === s.length - 1) {
      newNode.end = true;
      return newNode;
    }
    newNode.childM = this.createToBottom(s, index + 1);
    return newNode;
  }
}

export class TST {
  private root: TSTNode | null = null;

  public get(s: string): boolean {
    if (!this.root) return false;
    return this.getRecurse(s, 0, this.root);
  }

  private getRecurse(
    s: string,
    index: number,
    curr: TSTNode
  ): boolean {
    if (curr.letter === s[index]) {
      if (index === s.length - 1) return curr.end;
      if (curr.childM) return this.getRecurse(s, index + 1, curr.childM);
      else return false;
    } else if (s[index] > curr.letter) {
      if (curr.childR) return this.getRecurse(s, index, curr.childR);
      else return false;
    } else {
      if (curr.childL) return this.getRecurse(s, index, curr.childL);
      else return false;
    }
  }

  public add(s: string, startIndex?: number) {
    if (!this.root)
      this.root = TSTNode.createToBottom(s, startIndex || 0);
    this.addRecurse(this.root, s, startIndex || 0);
  }

  private addRecurse(
    node: TSTNode,
    s: string,
    index: number,
  ) {
    if (s[index] === node.letter) {
      if (index === s.length - 1) {
        node.end = true;
        console.log("HERE");
        console.log(s)
        return;
      }
      this.addRecurse(
        node.childM ||
          (node.childM = TSTNode.createToBottom(s, index + 1)),
        s,
        index + 1
      );
    } else if (s[index] > node.letter) {
      if (node.childR) {
        this.addRecurse(node.childR, s, index);
      } else {
        node.childR = TSTNode.createToBottom(s, index);
      }
    } else {
      if (node.childL) {
        this.addRecurse(node.childL, s, index);
      } else {
        node.childL = TSTNode.createToBottom(s, index);
      }
    }
  }
}

const test = 
`
T E D
S R B
T A O
`;

export function testTST() {
  const t = new FullTree();
  t.add('dog')
  t.add('doge')
  t.add('doggy')

  console.log(t.get('dog'));
  console.log(t.get('doge'));
  console.log(t.get('doggy'));

  console.log(t.get('dogg'));
  console.log(t.get('dogge'));
  console.log(t.get('do'));
}

