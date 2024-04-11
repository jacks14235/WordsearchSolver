import { StringNGramsAttrs, add, string } from "@tensorflow/tfjs";
import englishwords from "./usa2.json";
import embed from './glove-twitter-25d.json';
const dlxlib = require('dlxlib');

type Solution = { word: string, start: [number, number], end: [number, number] }

export function myMod(a: number, b: number) {
  return ((a % b) + b) % b;
};

class DlxNode {
  public up: DlxNode | null;
  public down: DlxNode | null;
  public left: DlxNode | null;
  public right: DlxNode | null;
  constructor(public id: number) {
    this.up = null;
    this.down = null;
    this.left = null;
    this.right = null;
  }

  public removeRow(start?: DlxNode) {
    if (start === this) return;
    this.up!.down = this.down;
    this.down!.up = this.up;
    this.right?.removeRow(start || this);
  }

  public removeCol(start?: DlxNode) {
    console.log(this);
    console.log(this.left);
    // if (start === this) return;
    this.left!.right = this.right;
    this.right!.left = this.left;
    // this.down?.removeCol(start || this);
  }

  public restoreRow(start?: DlxNode) {
    if (start === this) return;
    this.up!.down = this;
    this.down!.up = this;
    this.right?.restoreRow(start || this);
  }

  public restoreCol(start?: DlxNode) {
    if (start === this) return;
    this.left!.right = this;
    this.right!.left = this;
    this.down?.restoreCol(start || this);
  }

}

export class SolutionSet {
  constructor(
    private letters: number[],
    private words: number[][],
    private solutions: number[][],
    private scores: number[]
  ) {};

  private toWord(letters: number[]): string {
    return letters.map(l => String.fromCharCode(this.letters[l] + 65)).join('');
  }

  public getScore(ind: number) {
    if (this.scores.length === 0) return 0;
    return this.scores[myMod(ind, this.scores.length)];
  }

  // returns list of words (in string format)
  public getSolution(ind: number): {words: string[], indices: number[][]} {
    if (this.solutions.length === 0) return {words: [], indices: []};
    const i = myMod(ind, this.solutions.length);
    const sol = this.solutions[i];
    const words = [];
    const indices = [];
    for (let wordIdx of sol) {
      const word = this.toWord(this.words[wordIdx]);
      indices.push(this.words[wordIdx]);
      words.push(word);
    }
    return {words, indices};
  }

  public length() {
    return this.solutions.length;
  }
}

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

  public solve(): SolutionSet {

    let wordsFound: number[][] = [];
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        wordsFound = [...wordsFound, ...this.findWords(i, j)];
      }
    }
    console.log(wordsFound)
    const matrix: number[][] = new Array(wordsFound.length).fill(0).map(() => new Array(this.width * this.height).fill(0))
    for (let i = 0; i < wordsFound.length; i++) {
      for (let j = 0; j < wordsFound[i].length; j++) {
        matrix[i][wordsFound[i][j]] = 1;
      }
    }

    var perfectCovers = dlxlib.solve(matrix) as number[][];
    console.log("Number of solutions", perfectCovers.length);

    const map = new Map<string, number[]>(Object.entries(embed));

    const scores = new Array<[number, number]>(perfectCovers.length);
    for (let idx = 0; idx < perfectCovers.length; idx++) {
      let avgSim = 0;
      let count = 0;
      for (let i = 1; i < perfectCovers[idx].length; i++) {
        const word1 = this.toWord(wordsFound[perfectCovers[idx][i]]);
        const embed1 = map.get(word1);
        if (!embed1) {
          // console.log("Missing " + word1, embed1);
          continue;
        }
        for (let j = 0; j < i; j++) {
          const word2 = this.toWord(wordsFound[perfectCovers[idx][j]]);
          const embed2 = map.get(word2);
          if (!embed2) {
            // console.log("Missing " + word2, embed2);
            continue;
          }
          avgSim += cosSim(embed1, embed2);
          count++;
        }
      }
      avgSim /= count;
      scores[idx] = [idx, avgSim];
    }

    // const sorted = scores.sort((a, b) => b[1] - a[1]);
    const sorted = scores.sort((a, b) => b[1] - a[1])
    const coversSorted = scores.map(i => perfectCovers[i[0]]);
    for (let i = 0; i < 4; i++) {
      console.log('====================');
      console.log('Score: ' + sorted[i][1]);
      const sol = perfectCovers[sorted[i][0]];
      for (let wordIdx of sol) {
        const word = this.toWord(wordsFound[wordIdx]);
        console.log(word);
      }
    }

    const solutionSet = new SolutionSet(this.letters, wordsFound, coversSorted, sorted.map(i => i[1]));
    
    return solutionSet;
  }

  getLetter(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }
    return this.letters[this.width * y + x];
  }

  public getBox(ind: number) {
    return this.boxes[ind];
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

  public algorithmX(subsets: number[][], w?: number, h?:number) {
    // initialize data structure
    const width = w || this.width;
    const height = h || this.height;
    // doubly-linked nodes at the top of each column
    const nodes = new Map<number, DlxNode>();
    const headers= new Array<DlxNode>();
    const nLetters = width * height;
    // stores 0 for present, 1 for not present
    const values = new Uint8Array(subsets.length * nLetters);
    for (let i = 0; i < subsets.length; i++) {
      for (let j of subsets[i]) {
        values[i * nLetters + j] = 1;
      }
    }
    const asdf = values.toString();
    for (let i = 0; i < 4; i++) {
      console.log(asdf.substring(8 * i, 8 * (i+1)))
    }
    
    const counts = new Array<number>(nLetters);
    // up and down connections
    for (let i = 0; i < nLetters; i++) {
      let start: DlxNode | null = null;
      let last: DlxNode | null = null;
      let count = 0;
      for (let j = 0; j < subsets.length; j++) {
        const idx = j * nLetters + i;
        if (values[idx] === 1) {
          const node = new DlxNode(idx);
          start = start || node;
          node.up = last;
          if (last !== null) {
            last.down = node;
          }
          last = node;
          nodes.set(idx, node);
          count++;
        }
      }
      if (start === null) {
        console.error('No subsets contain the value ' + i);
        return [];
      }
      start.up = last;
      last!.down = start;
      headers.push(start);
      counts[i] = count;
    }

    // left and right connections
    for (let i = 0; i < subsets.length; i++) {
      let start: DlxNode | null = null;
      let last: DlxNode | null = null;
      for (let j = 0; j < nLetters; j++) {
        const idx = i * nLetters + j;
        const node = nodes.get(idx);
        if (node) {
          start = start || node;
          node.left = last;
          if (last !== null) {
            last.right = node;
          }
          last = node;
        }
      }
      if (start === null) continue;
      start.left = last;
      last!.right = start;
    }
    console.log(counts);

    this.algorithmXRecurse(headers, argmin(counts), counts);
  }

  private algorithmXRecurse(headers: Array<DlxNode>, selection: number, counts: number[]) {
    const start = headers[selection];
    let curr = start;
    // loop through node in selected column
    do {
      const removedRows = new Array<DlxNode>();
      // for each node in this row
      let curr_in_row = curr;
      let start_in_row = curr;
      do {
        // go through column and remove their row
        let curr_in_col = curr_in_row;
        let start_in_col = curr_in_row;
        do {
          curr_in_col.removeRow();
          curr_in_col = curr_in_col.down || start_in_col;
          removedRows.push(curr_in_col);
        } while (curr_in_col !== start_in_col);

        curr_in_row = curr_in_row.right || start_in_row;
      } while (curr_in_row !== start_in_row);

      curr = curr.down || start;
    } while (curr !== start)
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

  getBoxCenterInd(ind: number) {
    const b = this.boxes[ind]
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

function argmin(n: number[]) {
  let min = n[0];
  let argmin = 0;
  for (let i = 1; i < n.length; i++) {
    if (n[i] < min) {
      min = n[i];
      argmin = i;
    }
  }
  return argmin;
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

const board = 
`
T E D
S R B
T A O
`;

// const strands = `
// IDYREK
// RANECA
// YERSOB
// ZOYAER
// ERSFDG
// RFTOUO
// MOTOCR
// EASDEP
// `

export function testTST() {
  // const letters = strands.trim().split("").filter(i => !/\s/.test(i));
  
  // const test = new WordSearch(
  //   letters, 6, 8, englishwords, [0,0], []
  // );
  // let solves: number[][] = [];
  // test.solve();
  // console.log("Searching for " + englishwords.length + " words.");
  // for (let i = 0; i < 6; i++) {
  //   for (let j = 0; j < 8; j++) {
  //     solves = [...solves, ...test.findWords(i, j)];
  //     console.log(i, j);
  //   }
  // }
  // console.log('found ' + solves.length + ' words!');
  // console.log(solves)
  // let solvedWords = solves.map(s => test.toWord(s));
  // console.log(solvedWords.sort((a: string, b: string) => b.length - a.length));
  // let max = 0;
  // let longest: number[] = [];
  // for (let s of solves) {
  //   if (s.length > max) {
  //     max = s.length;
  //     longest = s
  //   }
  // }
  // console.log("longest word: ", test.toWord(longest));

  // var matrix = [
  //   [1, 0, 0, 0],
  //   [0, 1, 1, 0],
  //   [1, 0, 0, 1],
  //   [0, 0, 1, 1],
  //   [0, 1, 0, 0],
  //   [0, 0, 1, 0]
  // ];
  
  // var solutions = dlxlib.solve(matrix);
  // for (var i = 0; i < solutions.length; i++) {
  //     console.log('solution[%d]: %s', i, JSON.stringify(solutions[i]));
  // }
  
}

function cosSim(a: number[], b: number[]) {
  let dot = 0;
  let asum = 0;
  let bsum = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    asum += a[i] * a[i];
    bsum += b[i] * b[i];
  }
  return dot / (Math.sqrt(asum) * Math.sqrt(bsum));
}
