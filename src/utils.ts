import { PNG } from "pngjs";

export function readPixel(png: PNG, x: number, y: number) {
  const data = png.data;
  const i = (png.width * y + x) * 4;
  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3],
  };
}