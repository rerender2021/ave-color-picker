import {
  App,
  WindowCreation,
  Window,
  WindowFlag,
  Picture,
  ResourceSource,
  Label,
  AlignType,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG } from "pngjs";
import { getGrid, readPixel } from "./utils";

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
      const label = new Label(window);
      label.SetAlignHorz(AlignType.Center);

      const picture = new Picture(window);
      const source = ResourceSource.FromBuffer(pictureBuffer);
      picture.SetPicture(source);

      const pixel = new Picture(window);
      picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(png, pos.x, pos.y);
        console.log(pos, color);

        const pixelPNG = new PNG({ width: 100, height: 100 });
        for (let y = 0; y < pixelPNG.height; y++) {
          for (var x = 0; x < pixelPNG.width; x++) {
            const i = (pixelPNG.width * y + x) * 4;
            pixelPNG.data[i] = color.r;
            pixelPNG.data[i + 1] = color.g;
            pixelPNG.data[i + 2] = color.b;
            pixelPNG.data[i + 3] = color.a;
          }
        }

        const pixelBuffer = PNG.sync.write(pixelPNG);
        const source = ResourceSource.FromBuffer(pixelBuffer);
        pixel.SetPicture(source);
        label.SetText(`rgba:(${color.r},${color.g},${color.b},${color.a})`);
      });

      const container = getGrid(window, png.width, png.height);
      container.ControlAdd(picture).SetGrid(1, 1);
      container.ControlAdd(pixel).SetGrid(3, 1);
      container.ControlAdd(label).SetGrid(3, 2);
      window.SetContent(container);
      return true;
    });
  }
}

globalThis.program = new Program();
globalThis.program.run();

// TODO: use native image to update pixel view