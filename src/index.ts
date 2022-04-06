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
  Button,
  SysDialogFilter,
  DragDropImage,
  DropBehavior,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG, PNGWithMetadata } from "pngjs";
import { getGrid, readPixel } from "./utils";
import { ResourceSource } from "ave-ui/build/Ave/Io/IoCommon";

class Program {
  app: App;
  window: Window;
  picture: Picture;
  pager: Pager;
  png: PNGWithMetadata;

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

  openFile(file: string) {
    const pictureBuffer = fs.readFileSync(file);
    this.png = PNG.sync.read(pictureBuffer);
    const source = ResourceSource.FromBuffer(pictureBuffer);
    this.picture.SetPicture(source);
    this.pager.SetContentSize(new Vec2(this.png.width, this.png.height));
  }

  OnCreateContent() {
    //

    this.window.OnCreateContent((window) => {
      const colorText = new TextBox(window);
      colorText.SetReadOnly(true);
      colorText.SetBorder(false);

      this.picture = new Picture(window);
      this.picture.SetStretchMode(StretchMode.Center);

      this.pager = new Pager(window);
      this.pager.SetContent(this.picture);
      this.pager.SetContentHorizontalAlign(AlignType.Center);
      this.pager.SetContentVerticalAlign(AlignType.Center);

      const colorView = new ColorView(window);
      this.picture.OnPointerMove((sender, mp) => {
        const pos = mp.Position;
        const color = readPixel(this.png, pos.x, pos.y);
        console.log(pos, color);

        colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
        colorText.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
      });

      const container = new Grid(window);
      container.RowAddSlice(1);
      container.ColAddSlice(1);
      container.ColAddDpx(128);

      container.ControlAdd(this.pager).SetGrid(0, 0);

      const btnOpen = new Button(window);
      btnOpen.SetText("Open File");
      btnOpen.OnClick(() => {
        const s = window.GetCommonUi().OpenFile([new SysDialogFilter("PNG Files", "*.png")], "png", "", "");
        if (s.length > 0)
          this.openFile(s);
      });

      const pixelGrid = new Grid(window);
      pixelGrid.ColAddSlice(1);
      pixelGrid.RowAddDpx(128, 24, 32);

      pixelGrid.ControlAdd(colorView).SetGrid(0, 0);
      pixelGrid.ControlAdd(colorText).SetGrid(0, 1);
      pixelGrid.ControlAdd(btnOpen).SetGrid(0, 2);

      container.ControlAdd(pixelGrid).SetGrid(1, 0);
      window.SetContent(container);

      window.OnDragMove((sender, dc) => {
        if (1 == dc.FileGetCount() && dc.FileGet()[0].toLowerCase().endsWith(".png")) {
          dc.SetDropTip(DragDropImage.Copy, "Open this file");
          dc.SetDropBehavior(DropBehavior.Copy);
        }
      });
      window.OnDragDrop((sender, dc) => {
        this.openFile(dc.FileGet()[0]);
      });
      this.openFile(path.resolve(__dirname, "../assets/wallpaper.png"));
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
