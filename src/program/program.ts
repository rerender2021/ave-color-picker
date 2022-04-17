import { App, WindowCreation, Window, WindowFlag, ColorView, Vec4, TextBox, Pager, Vec2, AlignType, Button, SysDialogFilter, DragDropImage, DropBehavior, KbKey, Rect, MessageIcon, MessageButton, PointerButton, Label, DpiMargin, DpiSize, CultureId, IconSource, VisualTextLayout } from "ave-ui";
import { MiniView, ZoomView, ImageView } from "../components";
import { assetPath, readAsBuffer } from "../utils";
import { getAppLayout } from "./layout";

export class Program {
	app: App;
	window: Window;

	imageView: ImageView;
	pager: Pager;
	miniView: MiniView;
	zoomView: ZoomView;
	colorView: ColorView;
	txtPixelPos: TextBox;
	txtRgba: TextBox;
	btnOpen: Button;
	btnPaste: Button;
	lockColor: boolean;

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
		this.onCreateContent();
		if (!this.window.CreateWindow()) process.exit(-1);

		this.window.SetVisible(true);
		this.window.Activate();
	}

	onCreateContent() {
		this.onDragDrop();
		this.onHotKey();

		const iconDataMap = {
			WindowIcon: [assetPath("color-wheel.png")],
			OpenFile: [assetPath("file-open.png")]
		};
		const resMap = this.app.CreateResourceMap(this.app, [16], iconDataMap);

		this.window.OnCreateContent((window) => {
			window.SetIcon(resMap.WindowIcon);

			this.imageView = new ImageView(window);
			this.onPointerEvent();

			this.miniView = new MiniView(window);
			this.zoomView = new ZoomView(window);
			this.colorView = new ColorView(window);
			this.lockColor = false;

			const createTextBox = () => {
				const txt = new TextBox(window);
				txt.SetReadOnly(true);
				txt.SetBorder(false);
				return txt;
			};

			this.txtPixelPos = createTextBox();
			this.txtRgba = createTextBox();

			this.pager = new Pager(window);
			this.pager.SetContent(this.imageView.control);
			this.pager.SetContentHorizontalAlign(AlignType.Center);
			this.pager.SetContentVerticalAlign(AlignType.Center);

			this.btnOpen = new Button(window);
			this.btnOpen.SetText("Open File");
			this.btnOpen.SetVisualTextLayout(VisualTextLayout.HorzVisualText);
			this.btnOpen.SetVisual(window.CreateManagedIcon(new IconSource(resMap.OpenFile, 16)))
			this.btnOpen.OnClick(() => this.browseOpenFile());

			this.btnPaste = new Button(window);
			this.btnPaste.SetText("Paste");
			this.btnPaste.OnClick(() => this.pastePicture());

			const container = this.onCreateLayout(window);
			window.SetContent(container);

			this.openFile(assetPath("wallpaper-full.png"));
			return true;
		});
	}

	onCreateLayout(window: Window) {
		const { container, pixelGrid } = getAppLayout(window);

		pixelGrid.addControl(this.miniView.control, pixelGrid.areas.miniView);
		pixelGrid.addControl(this.zoomView.control, pixelGrid.areas.zoomView);
		pixelGrid.addControl(this.colorView, pixelGrid.areas.colorView);

		const marginLeft = new DpiMargin(DpiSize.FromPixelScaled(4), DpiSize.Zero, DpiSize.Zero, DpiSize.Zero);
		pixelGrid.addControl(this.txtPixelPos, pixelGrid.areas.pixelPos).SetMargin(marginLeft);
		pixelGrid.addControl(this.txtRgba, pixelGrid.areas.pixelRgba).SetMargin(marginLeft);
		pixelGrid.addControl(this.btnOpen, pixelGrid.areas.openFile);
		pixelGrid.addControl(this.btnPaste, pixelGrid.areas.paste);

		const createLabel = (s: string) => {
			const lbl = new Label(window);
			lbl.SetText(s);
			return lbl;
		};

		pixelGrid.addControl(createLabel("WSAD: Move by pixel"), pixelGrid.areas.usageMove).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("Space/Click: Lock result"), pixelGrid.areas.usageLockColor).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("F: Open File"), pixelGrid.areas.usageOpenFile).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("V: Paste"), pixelGrid.areas.usagePaste).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("Drop a png to open"), pixelGrid.areas.usageDrop).SetMargin(marginLeft);

		//
		container.addControl(this.pager, container.areas.image);
		container.addControl(pixelGrid.control, container.areas.pixel);
		return container.control;
	}

	onDragDrop() {
		this.window.OnDragMove((sender, dc) => {
			if (1 == dc.FileGetCount() && dc.FileGet()[0].toLowerCase().endsWith(".png")) {
				dc.SetDropTip(DragDropImage.Copy, "Open this file");
				dc.SetDropBehavior(DropBehavior.Copy);
			}
		});
		this.window.OnDragDrop((sender, dc) => {
			this.openFile(dc.FileGet()[0]);
		});
	}

	onHotKey() {
		const { window } = this;
		// Move cursor
		const moveCursor = (v: Vec2) => {
			window.GetPlatform().PointerSetPosition(v);
			const rc = this.imageView.control.MapRect(Rect.Empty, false);
			this.onPointerMove(new Vec2(v.x, v.y).Sub(rc.Position));
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
					this.lockColor = !this.lockColor;
					break;
				case hkOpen:
					this.browseOpenFile();
					break;
				case hkPaste:
					this.pastePicture();
					break;
			}
		});
	}

	onPointerMove(pos: Vec2) {
		this.zoomView.updatePixelPos(pos);
		const color = this.imageView.readPixel(pos.x, pos.y);
		console.log(pos, color);

		this.colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
		this.txtPixelPos.SetText(`position: ${pos.x}, ${pos.y}`);
		this.txtRgba.SetText(`rgba(${color.r},${color.g},${color.b},${color.a})`);
	}

	onPointerEvent() {
		this.imageView.control.OnPointerEnter((sender, mp) => {
			this.lockColor = false;
		});
		this.imageView.control.OnPointerPress((sender, mp) => {
			if (mp.Button == PointerButton.First) {
				this.lockColor = !this.lockColor;
			}
		});
		this.imageView.control.OnPointerMove((sender, mp) => {
			if (!this.lockColor) this.onPointerMove(mp.Position);
		});
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
}
