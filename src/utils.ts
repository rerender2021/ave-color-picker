import { Grid, Window } from "ave-ui";
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

export function get3x3Grid(window: Window, width = 500, height = 500) {
  const container = new Grid(window);
  container.ColAddSlice(1);
  container.ColAddDpx(width);
  container.ColAddSlice(1);

  container.RowAddSlice(1);
  container.RowAddDpx(height);
  container.RowAddSlice(1);
  return container;
}