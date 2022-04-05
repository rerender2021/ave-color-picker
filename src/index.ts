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
      path.resolve(__dirname, "./square.png")
    );
    const png = PNG.sync.read(pictureBuffer);

    this.window.OnCreateContent((window) => {
      const colorText = new TextBox(window);
      colorText.SetReadOnly(true);
      colorText.SetBorder(false);

      const picture = new Picture(window);
      const source = ResourceSource.FromBuffer(pictureBuffer);
      picture.SetPicture(source);

      const colorView = new ColorView(window);
      picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(png, pos.x, pos.y);
        console.log(pos, color);

        colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
        colorText.SetText(`rgba:(${color.r},${color.g},${color.b},${color.a})`);
      });

      const container = getGrid(window, png.width, png.height);
      container.ControlAdd(picture).SetGrid(1, 1);
      container.ControlAdd(colorView).SetGrid(3, 1);
      container.ControlAdd(colorText).SetGrid(3, 2);
      window.SetContent(container);
      return true;
    });
  }
}

globalThis.program = new Program();
globalThis.program.run();

// TODO: use page to wrap big picrue