import { App, WindowCreation, Window, WindowFlag, ColorView, Vec4, TextBox, Pager, Vec2, AlignType, Button, SysDialogFilter, DragDropImage, DropBehavior, KbKey, Rect, MessageIcon, MessageButton, PointerButton, Label, DpiMargin, DpiSize, CultureId } from "ave-ui";
import { MiniView, ZoomView, ImageView, GridLayout, IGridLayout } from "../components";
import { assetPath, readAsBuffer } from "../utils";

export class Program {
	app: App;
	window: Window;

	imageView: ImageView;
	miniView: MiniView;
	zoomView: ZoomView;
	pager: Pager;

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
		this.imageView.updateImage(readAsBuffer(file));
		this.zoomView.track({ image: this.imageView.native });
		this.miniView.track({ pager: this.pager, image: this.imageView.native });
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
		const iconDataMap = {
			WindowIcon: [assetPath("color-wheel.png")],
		};
		const resMap = this.app.CreateResourceMap(this.app, [16], iconDataMap);

		this.window.OnCreateContent((window) => {
			window.SetIcon(resMap.WindowIcon);
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
				const color = this.imageView.readPixel(pos.x, pos.y);
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

			const appAreas = {
				image: { x: 0, y: 0 },
				pixel: { x: 1, y: 0 },
			};
			const appLayout: IGridLayout = {
				rows: "1",
				columns: "1 128dpx",
				areas: appAreas,
			};

			const container = new GridLayout(window, appLayout);

			this.pager = new Pager(window);
			this.pager.SetContent(this.imageView.control);
			this.pager.SetContentHorizontalAlign(AlignType.Center);
			this.pager.SetContentVerticalAlign(AlignType.Center);

			container.addControl(this.pager, appAreas.image);

			const btnOpen = new Button(window);
			btnOpen.SetText("Open File");
			btnOpen.OnClick(() => this.browseOpenFile());

			const btnPaste = new Button(window);
			btnPaste.SetText("Paste");
			btnPaste.OnClick(() => this.pastePicture());

			const pixelAreas = {
				//
				miniView: { x: 0, y: 0 },
				zoomView: { x: 0, y: 2 },
				colorView: { x: 0, y: 4 },
				pixelPos: { x: 0, y: 6 },
				pixelRgba: { x: 0, y: 8 },
				openFile: { x: 0, y: 10 },
				paste: { x: 0, y: 12 },
				//
				usageMove: { x: 0, y: 14 },
				usageLockColor: { x: 0, y: 16 },
				usageOpenFile: { x: 0, y: 18 },
				usagePaste: { x: 0, y: 20 },
				usageDrop: { x: 0, y: 22 },
			};
			const pixelLayout: IGridLayout = {
				rows: "128dpx 4dpx 128dpx 4dpx 32dpx 4dpx 16dpx 4dpx 16dpx 4dpx 32dpx 4dpx 32dpx 1 16dpx 4dpx 16dpx 4dpx 16dpx 4dpx 16dpx 4dpx 16dpx",
				columns: "1",
				areas: pixelAreas,
			};
			const pixelGrid = new GridLayout(window, pixelLayout);

			pixelGrid.addControl(this.miniView.control, pixelAreas.miniView);
			pixelGrid.addControl(this.zoomView.control, pixelAreas.zoomView);
			pixelGrid.addControl(colorView, pixelAreas.colorView);

			const marginLeft = new DpiMargin(DpiSize.FromPixelScaled(4), DpiSize.Zero, DpiSize.Zero, DpiSize.Zero);
			pixelGrid.addControl(txtPixelPos, pixelAreas.pixelPos).SetMargin(marginLeft);
			pixelGrid.addControl(txtRgba, pixelAreas.pixelRgba).SetMargin(marginLeft);
			pixelGrid.addControl(btnOpen, pixelAreas.openFile);
			pixelGrid.addControl(btnPaste, pixelAreas.paste);

			const createLabel = (s: string) => {
				const lbl = new Label(window);
				lbl.SetText(s);
				return lbl;
			};

			pixelGrid.addControl(createLabel("WSAD: Move by pixel"), pixelAreas.usageMove).SetMargin(marginLeft);
			pixelGrid.addControl(createLabel("Space/Click: Lock result"), pixelAreas.usageLockColor).SetMargin(marginLeft);
			pixelGrid.addControl(createLabel("F: Open File"), pixelAreas.usageOpenFile).SetMargin(marginLeft);
			pixelGrid.addControl(createLabel("V: Paste"), pixelAreas.usagePaste).SetMargin(marginLeft);
			pixelGrid.addControl(createLabel("Drop a png to open"), pixelAreas.usageDrop).SetMargin(marginLeft);

			container.addControl(pixelGrid.control, appAreas.pixel);
			window.SetContent(container.control);

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
