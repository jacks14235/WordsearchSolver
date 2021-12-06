export class Gradient {
  constructor(private stops: [number, number, number][], 
              private positions: number[]) {}

  eval(n: number) {
    let index = 0;
    if (n == 0) {
      return this.stops[0]
    }
    while (n > this.positions[index]) 
      index++
    const r = (n - this.positions[index - 1]) / (this.positions[index] - this.positions[index - 1])
    return (this.stops[index - 1].map((c,i) => c + (this.stops[index][i] - c) * r));
  }
}