import {
  App,
  WindowCreation,
  Window,
  WindowFlag,
  Picture,
  ResourceSource,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG } from "pngjs";
import { get3x3Grid, readPixel } from "./utils";

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
    const pictureBuffer = fs.readFileSync(path.resolve(__dirname, "./square.png"));
    const png = PNG.sync.read(pictureBuffer);

    this.window.OnCreateContent((window) => {
      const picture = new Picture(window);
      const source = ResourceSource.FromBuffer(pictureBuffer);
      picture.SetPicture(source);

      picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(png, pos.x, pos.y);
        console.log(pos, color);
      });

      const container = get3x3Grid(window, png.width, png.height);
      container.ControlAdd(picture).SetGrid(1, 1);
      window.SetContent(container);
      return true;
    });
  }
}

globalThis.program = new Program();
globalThis.program.run();
