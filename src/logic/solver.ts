import { add, string } from "@tensorflow/tfjs";
import englishwords from "./usa2.json";

type Solution = { word: string, start: [number, number], end: [number, number] }

export class WordSearch {
  private letters: number[];
  private tree: FullTree;
  private found: number[][];
  private words: string[];
  constructor(
    letters: string[],
    public width: number,
    public height: number,
    words: string[],
    private confidences: number[],
    private boxes: number[][]) {
    this.found = new Array(0);
    this.letters = letters.map((l) => l.toUpperCase()).map(l => l.charCodeAt(0) - 65);
    this.tree = new FullTree();
    this.words = words.filter(w => w.length > 3).map(w => w.toUpperCase());
    
    // Initialize tree
    for (let word of this.words) {
      this.tree.add(word);
    }

    // if (this.letters.length !== this.boxes.length) {
    //   throw new Error('Length mismatch between boxes and letters.');
    // }
  }

  public solve(): Solution[] {
    // const answerMap = new Map<string, PositionInfo[]>();

    const solutions: {word: string, start: [number, number], end: [number, number], dir: [number, number]}[] = [];

    const withBoxes: Solution[] = solutions.map(a => ({...a, start: this.getBoxCenter(...a.start), end: this.getBoxCenter(...a.end)}))
    return withBoxes;
  }

  getLetter(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }
    return this.letters[this.width * y + x];
  }

  public toWord(letters: number[]) {
    return letters.map(l => String.fromCharCode(this.letters[l] + 65)).join('');
  }

  public findWords(x: number, y: number) {
    const finds: number[][] = [];
    const firstLetter = this.getLetter(x, y);
    const node = this.tree.root.children[firstLetter];
    if (node === null) return [];
    this.findWordsRecurse(x, y, [], node, finds);
    return finds;
  }

  // path is the positions in the grid
  private findWordsRecurse(x: number, y: number, path: number[], node: FullNode, finds: number[][]) {
    const pos = this.width * y + x;
    // return if letter already used
    if (path.includes(pos)) return;
    path.push(pos);
    if (node.end) finds.push([...path]);
    let l;

    l = this.getLetter(x - 1, y - 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x - 1, y - 1, path, node.children[l], finds);
    }
    l = this.getLetter(x, y - 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x, y - 1, path, node.children[l], finds);
    }
    l = this.getLetter(x + 1, y - 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x + 1, y - 1, path, node.children[l], finds);
    }
    l = this.getLetter(x - 1, y);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x - 1, y, path, node.children[l], finds);
    }
    l = this.getLetter(x + 1, y);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x + 1, y, path, node.children[l], finds);
    }
    l = this.getLetter(x - 1, y + 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x - 1, y + 1, path, node.children[l], finds);
    }
    l = this.getLetter(x, y + 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x, y + 1, path, node.children[l], finds);
    }
    l = this.getLetter(x + 1, y + 1);
    if (l !== -1 && node.children[l] !== null) {
      this.findWordsRecurse(x + 1, y + 1, path, node.children[l], finds);
    }

    path.pop();
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

  setWords(words: string[]) {
    this.words = words.map(w => w.toUpperCase());
  }

  changeLetter(i: number, l: string) {
    this.letters[i] = l.toUpperCase().charCodeAt(0);
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
    let r: {index: number, letter: number, box: number[]} | undefined = undefined;
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
  public root = new FullNode();
  public add(s: string) {
    this.addRecurse(s, this.root, 0);
  }
  private addRecurse(s: string, node: FullNode, index: number) {
    // console.log(s, index);
    if (index === s.length) {
      node.end = true;
      // console.log('End', s, index);
      return;
    }
    const c = s.charCodeAt(index) - 65;
    if (node.children[c] == null) {
      node.children[c] = new FullNode();
    }
    this.addRecurse(s, node.children[c], index + 1);
  }

  public get(s: string): boolean {
    return this.getRecurse(s, this.root, 0);
  }

  private getRecurse(s: string, node: FullNode, index: number): boolean {
    if (index === s.length) {
      // console.log(s, index);
      return node.end;
    }
    const c = s.charCodeAt(index) - 65;
    // console.log(s.charAt(index), !!node.children[c])
    if (node.children[c] == null) return false
    else return this.getRecurse(s, node.children[c], index + 1);
  }
}

// class TSTNode {
//   public childL: TSTNode | null = null;
//   public childR: TSTNode | null = null;
//   public childM: TSTNode | null = null;
//   // is there a word that ends here?
//   public end: boolean = false;
//   constructor(public letter: string) {}

//   public static createToBottom(
//     s: string,
//     index: number,
//   ) {
//     const newNode = new TSTNode(s[index]);
//     if (index === s.length - 1) {
//       newNode.end = true;
//       return newNode;
//     }
//     newNode.childM = this.createToBottom(s, index + 1);
//     return newNode;
//   }
// }

// export class TST {
//   private root: TSTNode | null = null;

//   public get(s: string): boolean {
//     if (!this.root) return false;
//     return this.getRecurse(s, 0, this.root);
//   }

//   private getRecurse(
//     s: string,
//     index: number,
//     curr: TSTNode
//   ): boolean {
//     if (curr.letter === s[index]) {
//       if (index === s.length - 1) return curr.end;
//       if (curr.childM) return this.getRecurse(s, index + 1, curr.childM);
//       else return false;
//     } else if (s[index] > curr.letter) {
//       if (curr.childR) return this.getRecurse(s, index, curr.childR);
//       else return false;
//     } else {
//       if (curr.childL) return this.getRecurse(s, index, curr.childL);
//       else return false;
//     }
//   }

//   public add(s: string, startIndex?: number) {
//     if (!this.root)
//       this.root = TSTNode.createToBottom(s, startIndex || 0);
//     this.addRecurse(this.root, s, startIndex || 0);
//   }

//   private addRecurse(
//     node: TSTNode,
//     s: string,
//     index: number,
//   ) {
//     if (s[index] === node.letter) {
//       if (index === s.length - 1) {
//         node.end = true;
//         console.log("HERE");
//         console.log(s)
//         return;
//       }
//       this.addRecurse(
//         node.childM ||
//           (node.childM = TSTNode.createToBottom(s, index + 1)),
//         s,
//         index + 1
//       );
//     } else if (s[index] > node.letter) {
//       if (node.childR) {
//         this.addRecurse(node.childR, s, index);
//       } else {
//         node.childR = TSTNode.createToBottom(s, index);
//       }
//     } else {
//       if (node.childL) {
//         this.addRecurse(node.childL, s, index);
//       } else {
//         node.childL = TSTNode.createToBottom(s, index);
//       }
//     }
//   }
// }

const board = 
`
T E D
S R B
T A O
`;

const strands = `
IDYREK
RANECA
YERSOB
ZOYAER
ERSFDG
RFTOUO
MOTOCR
EASDEP
`

export function testTST() {
  const letters = strands.trim().split("").filter(i => !/\s/.test(i));
  
  const test = new WordSearch(
    letters, 6, 8, englishwords, [0,0], []
  );
  let solves: number[][] = [];
  console.log("Searching for " + englishwords.length + " words.");
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 8; j++) {
      solves = [...solves, ...test.findWords(i, j)];
      console.log(i, j);
    }
  }
  console.log('found ' + solves.length + ' words!');
  console.log(solves)
  let solvedWords = solves.map(s => test.toWord(s));
  console.log(solvedWords.sort((a: string, b: string) => b.length - a.length));
  let max = 0;
  let longest: number[] = [];
  for (let s of solves) {
    if (s.length > max) {
      max = s.length;
      longest = s
    }
  }
  console.log("longest word: ", test.toWord(longest))
}

