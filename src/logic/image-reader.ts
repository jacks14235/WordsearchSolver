import {BWImage} from './bw-image-reader';

export class ImageReader {
  constructor(public width: number, public height: number, private data: ImageData) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  getData() {
    return this.data
  }

  getPixel(x: number, y: number) {
    const i = this.width * x + y;
    return [this.data.data[i], this.data.data[i + 1], this.data.data[i + 2], this.data.data[i + 3]]
  }

}