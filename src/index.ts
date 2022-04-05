import {
  App,
  WindowCreation,
  Window,
  WindowFlag,
  Picture,
  ResourceSource,
  ColorView,
  Vec4,
  TextBox,
  Pager,
  StretchMode,
  DpiMargin,
  DpiSize,
  Grid,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG } from "pngjs";
import { getGrid, readPixel } from "./utils";
import { hideConsole } from "node-hide-console-window";

//To hide your console just call:
hideConsole();

class Program {
  app: App;
  window: Window;

  constructor() {
    this.app = new App();

    const cpWindow = new WindowCreation();
    cpWindow.Title = "Color Picker";
    cpWindow.Flag |= WindowFlag.Layered;

    this.window = new Window(cpWindow);
  }

  run() {
    this.OnCreateContent();
    if (!this.window.CreateWindow()) process.exit(-1);

    this.window.SetVisible(true);
    this.window.Activate();
  }

  OnCreateContent() {
    //
    const pictureBuffer = fs.readFileSync(
      path.resolve(__dirname, "./wallpaper.png")
    );
    const png = PNG.sync.read(pictureBuffer);

    this.window.OnCreateContent((window) => {
      const colorText = new TextBox(window);
      colorText.SetReadOnly(true);
      colorText.SetBorder(false);

      const picture = new Picture(window);
      const source = ResourceSource.FromBuffer(pictureBuffer);
      picture.SetPicture(source);
      picture.SetStretchMode(StretchMode.Center);

      const pager = new Pager(window);
      const pictureGrid = new Grid(window);
      // pictureGrid.ColAddDpx(100);
      pictureGrid.ColAddSlice(1);
      // pictureGrid.ColAddDpx(100);
      
      // pictureGrid.RowAddDpx(100);
      pictureGrid.RowAddSlice(1);
      // pictureGrid.RowAddDpx(100);
      pictureGrid.SetBackColor(new Vec4(255, 0, 0, 128));
      pictureGrid.ControlAdd(picture).SetGrid(0,0);

      // pager.SetContent(pictureGrid);

      const colorView = new ColorView(window);
      picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(png, pos.x, pos.y);
        console.log(pos, color);

        colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
        colorText.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
      });

      const container = getGrid(window, png.width, png.height);

      // const margin = new DpiMargin(
      //   DpiSize.FromPixelScaled(100), // margin left
      //   DpiSize.FromPixelScaled(100), // margin top
      //   DpiSize.FromPixelScaled(100), // margin right
      //   DpiSize.FromPixelScaled(100) // margin bottom
      // );
      container.ControlAdd(pictureGrid).SetGrid(1, 1);

      const pixelGrid = new Grid(window);
      pixelGrid.ColAddSlice(1);
      pixelGrid.ColAddDpx(125);
      pixelGrid.ColAddSlice(1);

      pixelGrid.RowAddSlice(1);
      pixelGrid.RowAddDpx(125);
      pixelGrid.RowAddDpx(50);
      pixelGrid.RowAddSlice(1);

      pixelGrid.ControlAdd(colorView).SetGrid(1, 1);
      pixelGrid.ControlAdd(colorText).SetGrid(1, 2);

      container.ControlAdd(pixelGrid).SetGrid(3, 0, 1, 3);
      window.SetContent(container);
      return true;
    });
  }
}

globalThis.program = new Program();
globalThis.program.run();

// TODO: use page to wrap big picrue
// lock color
// more color format
// drag to open
