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
  Byo2Image,
  Byo2ImageCreation,
  Byo2ImageDataType,
  Placeholder,
  KbKey,
  Rect,
  MessageIcon,
  MessageButton,
  PointerButton,
  Label,
  DpiMargin,
  DpiSize,
  DrawImageFilter,
  DrawImageFlag,
  DrawImageParam,
  ResourceSource,
} from "ave-ui";
import * as path from "path";
import * as fs from "fs";
import { PNG, PNGWithMetadata } from "pngjs";
import { readPixel } from "./utils";

class Program {
  app: App;
  window: Window;
  image: Byo2Image;
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
    const imgcp = new Byo2ImageCreation();
    imgcp.DataType = Byo2ImageDataType.Coded;
    imgcp.Data = source;
    this.image = new Byo2Image(this.window, imgcp);
    this.picture.SetImage(this.image);
    this.pager.SetContentSize(new Vec2(this.png.width, this.png.height));
  }

  browseOpenFile() {
    const s = this.window
      .GetCommonUi()
      .OpenFile([new SysDialogFilter("PNG Files", "*.png")], "png", "", "");
    if (null != s && s.length > 0) this.openFile(s);
  }

  pastePicture() {
    this.window
      .GetCommonUi()
      .Message(
        "TODO: Paste picture from clipboard.",
        "",
        MessageIcon.None,
        MessageButton.Ok,
        "color-picker"
      );
  }

  OnCreateContent() {
    this.window.OnCreateContent((window) => {
      this.picture = new Picture(window);
      this.picture.SetStretchMode(StretchMode.Center);

      const dip = new DrawImageParam();
      dip.Filter = DrawImageFilter.Point;

      const miniView = new Placeholder(window);
      miniView.OnPaintPost((sender, painter, rc) => {
        const rcImage = new Rect(0, 0, this.png.width, this.png.height);
        const rcContainer = new Rect(rc.x, rc.y, rc.w, rc.h);
        rcImage.UniformScale(rcContainer);
        dip.TargetSize.x = rcImage.w;
        dip.TargetSize.y = rcImage.h;
        painter.DrawImageEx(
          this.image,
          rcImage.Position,
          DrawImageFlag.TargetSize,
          dip
        );
        painter.SetPenColor(new Vec4(0, 0, 0, 255));
        const vw = this.pager.GetRect().w;
        const vh = this.pager.GetRect().h;
        if (this.png.width > vw || this.png.height > vh) {
          const rcv = new Rect(0, 0, 1, 1);
          if (this.png.width > vw) {
            rcv.x = -this.picture.GetRect().x / this.png.width;
            rcv.w = vw / this.png.width;
          }
          if (this.png.height > vh) {
            rcv.y = -this.picture.GetRect().y / this.png.height;
            rcv.h = vh / this.png.height;
          }
          rcv.x = rcv.x * rcImage.w + rcImage.x;
          rcv.w *= rcImage.w;
          rcv.y = rcv.y * rcImage.h + rcImage.y;
          rcv.h *= rcImage.h;
          painter.SetPenColor(new Vec4(255, 255, 255, 255));
          painter.DrawRectangle(rcv.x - 1, rcv.y - 1, rcv.w + 2, rcv.h + 2);
          painter.SetPenColor(new Vec4(0, 0, 0, 255));
          painter.DrawRectangle(rcv.x, rcv.y, rcv.w, rcv.h);
        }
        painter.DrawRectangle(rc.x, rc.y, rc.w, rc.h);
      });

      let vPixelPos = new Vec2(-1, -1);
      const zoomView = new Placeholder(window);
      zoomView.OnPaintPost((sender, painter, rc) => {
        const blockSize = rc.w / 9;
        if (
          vPixelPos.x >= 0 &&
          vPixelPos.y >= 0 &&
          vPixelPos.x < this.png.width &&
          vPixelPos.y < this.png.height
        ) {
          const v = Vec2.Zero;
          dip.SourceRect.x = vPixelPos.x - 4;
          dip.SourceRect.y = vPixelPos.y - 4;
          dip.SourceRect.w = 9;
          dip.SourceRect.h = 9;
          dip.TargetSize.x = rc.w;
          dip.TargetSize.y = rc.h;
          if (dip.SourceRect.x < 0) {
            v.x -= blockSize * dip.SourceRect.x;
            dip.SourceRect.x = 0;
          }
          if (dip.SourceRect.y < 0) {
            v.y -= blockSize * dip.SourceRect.y;
            dip.SourceRect.y = 0;
          }
          if (dip.SourceRect.Right >= this.png.width)
            dip.SourceRect.w = this.png.width - dip.SourceRect.x;
          if (dip.SourceRect.Bottom >= this.png.height)
            dip.SourceRect.h = this.png.height - dip.SourceRect.y;
          dip.TargetSize.x = dip.SourceRect.w * blockSize;
          dip.TargetSize.y = dip.SourceRect.h * blockSize;
          painter.DrawImageEx(
            this.image,
            v,
            DrawImageFlag.TargetSize |
              DrawImageFlag.SourceRect |
              DrawImageFlag.Filter,
            dip
          );
        }
        painter.SetPenColor(new Vec4(0, 0, 0, 255));
        painter.DrawRectangle(rc.x, rc.y, rc.w, rc.h);
        painter.DrawRectangle(
          (rc.w - blockSize) * 0.5,
          (rc.h - blockSize) * 0.5,
          blockSize,
          blockSize
        );
        painter.SetPenColor(new Vec4(255, 255, 255, 255));
        painter.DrawRectangle(
          (rc.w - blockSize) * 0.5 - 1,
          (rc.h - blockSize) * 0.5 - 1,
          blockSize + 2,
          blockSize + 2
        );
      });

      const colorView = new ColorView(window);

      const createTextBox = () => {
        const txt = new TextBox(window);
        txt.SetReadOnly(true);
        txt.SetBorder(false);
        return txt;
      };

      const txtPixelPos = createTextBox();
      const txtRgba = createTextBox();

      const onPointerMove = (pos: Vec2) => {
        vPixelPos = pos;
        const color = readPixel(this.png, pos.x, pos.y);
        console.log(pos, color);

        colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
        txtPixelPos.SetText(`position: ${pos.x}, ${pos.y}`);
        txtRgba.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
      };
      let bLock: boolean = false;
      this.picture.OnPointerEnter((sender, mp) => {
        bLock = false;
      });
      this.picture.OnPointerPress((sender, mp) => {
        if (mp.Button == PointerButton.First) bLock = !bLock;
      });
      this.picture.OnPointerMove((sender, mp) => {
        if (!bLock) onPointerMove(mp.Position);
      });

      const container = new Grid(window);
      container.RowAddSlice(1);
      container.ColAddSlice(1);
      container.ColAddDpx(128);

      this.pager = new Pager(window);
      this.pager.SetContent(this.picture);
      this.pager.SetContentHorizontalAlign(AlignType.Center);
      this.pager.SetContentVerticalAlign(AlignType.Center);

      container.ControlAdd(this.pager).SetGrid(0, 0);

      const btnOpen = new Button(window);
      btnOpen.SetText("Open File");
      btnOpen.OnClick(() => this.browseOpenFile());

      const btnPaste = new Button(window);
      btnPaste.SetText("Paste");
      btnPaste.OnClick(() => this.pastePicture());

      const pixelGrid = new Grid(window);
      pixelGrid.ColAddSlice(1);
      pixelGrid.RowAddDpx(128, 4, 128, 4, 32, 4, 16, 4, 16, 4, 32, 4, 32);
      pixelGrid.RowAddSlice(1);
      pixelGrid.RowAddDpx(16, 4, 16, 4, 16, 4, 16);

      const marginLeft = new DpiMargin(
        DpiSize.FromPixelScaled(4),
        DpiSize.Zero,
        DpiSize.Zero,
        DpiSize.Zero
      );

      let row = -2;
      pixelGrid.ControlAdd(miniView).SetGrid(0, (row += 2));
      pixelGrid.ControlAdd(zoomView).SetGrid(0, (row += 2));
      pixelGrid.ControlAdd(colorView).SetGrid(0, (row += 2));
      pixelGrid
        .ControlAdd(txtPixelPos)
        .SetGrid(0, (row += 2))
        .SetMargin(marginLeft);
      pixelGrid
        .ControlAdd(txtRgba)
        .SetGrid(0, (row += 2))
        .SetMargin(marginLeft);
      pixelGrid.ControlAdd(btnOpen).SetGrid(0, (row += 2));
      pixelGrid.ControlAdd(btnPaste).SetGrid(0, (row += 2));

      const createLabel = (s: string) => {
        const lbl = new Label(window);
        lbl.SetText(s);
        lbl.SetAlignHorz(AlignType.Far);
        return lbl;
      };

      const marginRight = new DpiMargin(
        DpiSize.Zero,
        DpiSize.Zero,
        DpiSize.FromPixelScaled(4),
        DpiSize.Zero
      );
      pixelGrid
        .ControlAdd(createLabel("WSAD: Move by pixel"))
        .SetGrid(0, (row += 2))
        .SetMargin(marginRight);
      pixelGrid
        .ControlAdd(createLabel("F: Open File"))
        .SetGrid(0, (row += 2))
        .SetMargin(marginRight);
      pixelGrid
        .ControlAdd(createLabel("V: Paste"))
        .SetGrid(0, (row += 2))
        .SetMargin(marginRight);
      pixelGrid
        .ControlAdd(createLabel("Drop a png to open"))
        .SetGrid(0, (row += 2))
        .SetMargin(marginRight);

      container.ControlAdd(pixelGrid).SetGrid(1, 0);
      window.SetContent(container);

      // Move cursor
      const moveCursor = (v: Vec2) => {
        window.GetPlatform().PointerSetPosition(v);
        const rc = this.picture.MapRect(Rect.Empty, false);
        onPointerMove(new Vec2(v.x, v.y).Sub(rc.Position));
      };
      const hkW = window.HotkeyRegister(KbKey.W, 0);
      const hkS = window.HotkeyRegister(KbKey.S, 0);
      const hkA = window.HotkeyRegister(KbKey.A, 0);
      const hkD = window.HotkeyRegister(KbKey.D, 0);
      const hkOpen = window.HotkeyRegister(KbKey.F, 0);
      const hkPaste = window.HotkeyRegister(KbKey.V, 0);
      window.OnWindowHotkey((sender, nId, key, n) => {
        const v = window.GetPlatform().PointerGetPosition();
        switch (nId) {
          case hkW:
            --v.y;
            moveCursor(v);
            break;
          case hkS:
            ++v.y;
            moveCursor(v);
            break;
          case hkA:
            --v.x;
            moveCursor(v);
            break;
          case hkD:
            ++v.x;
            moveCursor(v);
            break;
          case hkOpen:
            this.browseOpenFile();
            break;
          case hkPaste:
            this.pastePicture();
            break;
        }
      });

      // Drag & drop support
      window.OnDragMove((sender, dc) => {
        if (
          1 == dc.FileGetCount() &&
          dc.FileGet()[0].toLowerCase().endsWith(".png")
        ) {
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
