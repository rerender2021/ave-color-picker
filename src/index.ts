import {
  App,
  WindowCreation,
  Window,
  WindowFlag,
  Picture,
  ColorView,
  Vec4,
  TextBox,
  Pager,
  StretchMode,
  Grid,
  Vec2,
  AlignType,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG } from "pngjs";
import { getGrid, readPixel } from "./utils";
import { ResourceSource } from "ave-ui/build/Ave/Io/IoCommon";

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
      pager.SetContent(picture);
      pager.SetContentHorizontalAlign(AlignType.Center);
      pager.SetContentVerticalAlign(AlignType.Center);
      pager.SetContentSize(new Vec2(png.width, png.height));

      const colorView = new ColorView(window);
      picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(png, pos.x, pos.y);
        console.log(pos, color);

        colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
        colorText.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
      });

      const container = getGrid(window, png.width, png.height);
      container.ControlAdd(pager).SetGrid(1, 1);

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
