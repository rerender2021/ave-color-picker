import { App, WindowCreation, Window, WindowFlag, ColorView, Vec4, TextBox, Pager, Grid, Vec2, AlignType, Button, SysDialogFilter, DragDropImage, DropBehavior, KbKey, Rect, MessageIcon, MessageButton, PointerButton, Label, DpiMargin, DpiSize, CultureId } from "ave-ui";
import { MiniView } from "./mini-view";
import { ZoomView } from "./zoom-view";
import { NativeImage } from "./native-image";
import { ImageView } from "./image-view";
import { assetPath, readAsBuffer } from "./utils";

export class Program {
	app: App;
	window: Window;
	image: NativeImage;
	imageView: ImageView;
	pager: Pager;
	miniView: MiniView;
	zoomView: ZoomView;

	constructor() {
		this.app = new App();
		// prettier-ignore
		this.app.LangSetDefaultString(CultureId.en_us, {
			"CoOk"      /**/: "OK",
			"CoCut"    	/**/: "Cut",
			"CoCopy"   	/**/: "Copy",
			"CoPaste"  	/**/: "Paste",
			"CoDelete" 	/**/: "Delete",
			"CoUndo"   	/**/: "Undo",
			"CoSelAll" 	/**/: "Select All",
		});

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
		this.image = new NativeImage(this.window, readAsBuffer(file));
		this.imageView.updateImage(this.image);

		const nativeImage = this.image.native;
		this.zoomView.track({ image: nativeImage });
		this.miniView.track({ pager: this.pager, image: nativeImage });

		this.pager.SetContentSize(new Vec2(this.imageView.width, this.imageView.height));
	}

	async browseOpenFile() {
		const s = await this.window.GetCommonUi().OpenFile([new SysDialogFilter("PNG Files", "*.png")], "png", "", "");
		if (null != s && s.length > 0) this.openFile(s);
	}

	pastePicture() {
		this.window.GetCommonUi().Message("TODO: Paste picture from clipboard.", "", MessageIcon.None, MessageButton.Ok, "color-picker");
	}

	OnCreateContent() {
		this.window.OnCreateContent((window) => {
			this.imageView = new ImageView(window);
			this.miniView = new MiniView(window);
			this.zoomView = new ZoomView(window);

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
				this.zoomView.updatePixelPos(pos);
				const color = this.image.readPixel(pos.x, pos.y);
				console.log(pos, color);

				colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
				txtPixelPos.SetText(`position: ${pos.x}, ${pos.y}`);
				txtRgba.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
			};
			let bLock: boolean = false;

			this.imageView.control.OnPointerEnter((sender, mp) => {
				bLock = false;
			});
			this.imageView.control.OnPointerPress((sender, mp) => {
				if (mp.Button == PointerButton.First) {
					bLock = !bLock;
				}
			});
			this.imageView.control.OnPointerMove((sender, mp) => {
				if (!bLock) onPointerMove(mp.Position);
			});

			const container = new Grid(window);
			container.RowAddSlice(1);
			container.ColAddSlice(1);
			container.ColAddDpx(128);

			this.pager = new Pager(window);
			this.pager.SetContent(this.imageView.control);
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
			pixelGrid.RowAddDpx(16, 4, 16, 4, 16, 4, 16, 4, 16);

			const marginLeft = new DpiMargin(DpiSize.FromPixelScaled(4), DpiSize.Zero, DpiSize.Zero, DpiSize.Zero);

			let row = -2;
			pixelGrid.ControlAdd(this.miniView.control).SetGrid(0, (row += 2));
			pixelGrid.ControlAdd(this.zoomView.control).SetGrid(0, (row += 2));
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
				//lbl.SetAlignHorz(AlignType.Far);
				return lbl;
			};

			pixelGrid
				.ControlAdd(createLabel("WSAD: Move by pixel"))
				.SetGrid(0, (row += 2))
				.SetMargin(marginLeft);
			pixelGrid
				.ControlAdd(createLabel("Space/Click: Lock result"))
				.SetGrid(0, (row += 2))
				.SetMargin(marginLeft);
			pixelGrid
				.ControlAdd(createLabel("F: Open File"))
				.SetGrid(0, (row += 2))
				.SetMargin(marginLeft);
			pixelGrid
				.ControlAdd(createLabel("V: Paste"))
				.SetGrid(0, (row += 2))
				.SetMargin(marginLeft);
			pixelGrid
				.ControlAdd(createLabel("Drop a png to open"))
				.SetGrid(0, (row += 2))
				.SetMargin(marginLeft);

			container.ControlAdd(pixelGrid).SetGrid(1, 0);
			window.SetContent(container);

			// Move cursor
			const moveCursor = (v: Vec2) => {
				window.GetPlatform().PointerSetPosition(v);
				const rc = this.imageView.control.MapRect(Rect.Empty, false);
				onPointerMove(new Vec2(v.x, v.y).Sub(rc.Position));
			};
			const hkW = window.HotkeyRegister(KbKey.W, 0);
			const hkS = window.HotkeyRegister(KbKey.S, 0);
			const hkA = window.HotkeyRegister(KbKey.A, 0);
			const hkD = window.HotkeyRegister(KbKey.D, 0);
			const hkSpace = window.HotkeyRegister(KbKey.Space, 0);
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
					case hkSpace:
						bLock = !bLock;
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
				if (1 == dc.FileGetCount() && dc.FileGet()[0].toLowerCase().endsWith(".png")) {
					dc.SetDropTip(DragDropImage.Copy, "Open this file");
					dc.SetDropBehavior(DropBehavior.Copy);
				}
			});
			window.OnDragDrop((sender, dc) => {
				this.openFile(dc.FileGet()[0]);
			});

			this.openFile(assetPath("wallpaper-full.png"));
			return true;
		});
	}
}
