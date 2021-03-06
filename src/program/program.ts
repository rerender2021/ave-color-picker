import { App, WindowCreation, Window, WindowFlag, ColorView, Vec4, TextBox, Pager, Vec2, AlignType, Button, SysDialogFilter, DragDropImage, DropBehavior, KbKey, Rect, PointerButton, Label, DpiMargin, DpiSize, CultureId, IconSource, VisualTextLayout, ToolBar, ToolBarItem, ToolBarItemType, Menu, MenuItem, MenuType, AveGetClipboard, ResourceSource, ThemeImage, ThemePredefined_Dark, ToolBarItemFlag } from "ave-ui";
import { MiniView, ZoomView, ImageView } from "../components";
import { assetPath } from "../utils";
import { getAppLayout } from "./layout";
import * as Color from "color";
import { Ii18n, initI18n, KeyOfLang } from "./i18n";
import * as fs from "fs";

export class Program {
	app: App;
	theme: ThemeImage;
	themeDark: ThemePredefined_Dark;
	isDark: boolean;
	window: Window;
	i18n: Ii18n;

	imageView: ImageView;
	pager: Pager;
	miniView: MiniView;
	zoomView: ZoomView;
	colorView: ColorView;
	txtPixelPos: TextBox;
	txtRgba: TextBox;
	txtHex: TextBox;
	btnOpen: Button;
	btnPaste: Button;
	lockColor: boolean;

	constructor() {
		this.app = new App();
		this.i18n = initI18n(this.app);

		this.theme = new ThemeImage();
		this.themeDark = new ThemePredefined_Dark();
		this.isDark = false;

		const cpWindow = new WindowCreation();
		cpWindow.Title = "Color Picker";
		cpWindow.Flag |= WindowFlag.Layered;
		cpWindow.Theme = this.theme;

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
		this.onLanguageChange();

		const iconDataMap = {
			WindowIcon: [assetPath("color-wheel.png")],
			OpenFile: [assetPath("file-open.png")],
			Language: [assetPath("language.png")],
			Sun: [assetPath("sun.png")],
			Moon: [assetPath("moon.png")],
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
			this.txtHex = createTextBox();

			this.pager = new Pager(window);
			this.pager.SetContent(this.imageView.control);
			this.pager.SetContentHorizontalAlign(AlignType.Center);
			this.pager.SetContentVerticalAlign(AlignType.Center);

			this.btnOpen = new Button(window, "OpenFile" as KeyOfLang);
			this.btnOpen.SetVisualTextLayout(VisualTextLayout.HorzVisualText);
			this.btnOpen.SetVisual(window.CreateManagedIcon(new IconSource(resMap.OpenFile, 16)));
			this.btnOpen.OnClick(() => this.browseOpenFile());

			this.btnPaste = new Button(window, "Paste" as KeyOfLang);
			this.btnPaste.OnClick(() => this.pastePicture());

			const container = this.onCreateLayout(window);
			window.SetContent(container);

			const menuLang = new Menu(window);
			menuLang.OnClick((menu, nId) => {
				this.i18n.switch(nId - 1);
				menu.SetRadioId(nId);
			});

			// the reason of +1: menu item id can't be 0, CultureId.en_us is 0
			menuLang.InsertItem(new MenuItem(CultureId.en_us + 1, MenuType.Text, 0, this.app.GetCultureInfo(CultureId.en_us).NameNative));
			menuLang.InsertItem(new MenuItem(CultureId.zh_cn + 1, MenuType.Text, 0, this.app.GetCultureInfo(CultureId.zh_cn).NameNative));

			this.i18n.switch(CultureId.en_us);
			menuLang.SetRadioId(CultureId.en_us + 1);

			//
			const toolbar = new ToolBar(window);
			toolbar.SetBackground(false);
			const ToolBarItemId = {
				Lang: 1,
				Theme: 2,
			};
			toolbar.ToolInsert(new ToolBarItem(ToolBarItemId.Lang, ToolBarItemType.ButtonDrop, window.CacheIcon(new IconSource(resMap.Language, 16))), -1);
			const theme = new ToolBarItem(ToolBarItemId.Theme, ToolBarItemType.Button, window.CacheIcon(new IconSource(resMap.Sun, 16)));
			toolbar.ToolInsert(theme, -1);
			toolbar.DropSetById(1, menuLang);
			toolbar.OnClick((sender, id) => {
				if (id === ToolBarItemId.Theme) {
					if (!this.isDark) {
						this.themeDark.SetStyle(this.theme, 0); // switch to dark theme
						theme.Flag = ToolBarItemFlag.Icon;
						theme.Icon = window.CacheIcon(new IconSource(resMap.Moon, 16));
						toolbar.ToolSetById(ToolBarItemId.Theme, theme);
					} else {
						this.theme.ResetTheme(); // reset to light theme
						theme.Flag = ToolBarItemFlag.Icon;
						theme.Icon = window.CacheIcon(new IconSource(resMap.Sun, 16));
						toolbar.ToolSetById(ToolBarItemId.Theme, theme);
					}
					this.isDark = !this.isDark;
				}
			});
			window.GetFrame().SetToolBarRight(toolbar);

			this.openFile(assetPath("wallpaper.png"));
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
		pixelGrid.addControl(this.txtHex, pixelGrid.areas.pixelHex).SetMargin(marginLeft);
		pixelGrid.addControl(this.txtRgba, pixelGrid.areas.pixelRgba).SetMargin(marginLeft);
		pixelGrid.addControl(this.btnOpen, pixelGrid.areas.openFile);
		pixelGrid.addControl(this.btnPaste, pixelGrid.areas.paste);

		const createLabel = (key: KeyOfLang) => {
			const lbl = new Label(window, key);
			return lbl;
		};

		pixelGrid.addControl(createLabel("UsageMoveByPixel"), pixelGrid.areas.usageMove).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("UsageLockColor"), pixelGrid.areas.usageLockColor).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("UsageOpenFile"), pixelGrid.areas.usageOpenFile).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("UsagePaste"), pixelGrid.areas.usagePaste).SetMargin(marginLeft);
		pixelGrid.addControl(createLabel("UsageDrop"), pixelGrid.areas.usageDrop).SetMargin(marginLeft);

		//
		container.addControl(this.pager, container.areas.image);
		container.addControl(pixelGrid.control, container.areas.pixel);
		return container.control;
	}

	onDragDrop() {
		this.window.OnDragMove((sender, dc) => {
			if (1 == dc.FileGetCount() && ["png", "jpg", "jpeg"].some((extension) => dc.FileGet()[0].toLowerCase().endsWith(extension))) {
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

	onLanguageChange() {
		this.window.OnLanguageChange((sender) => {
			const pos = this.zoomView.pixelPos;
			this.txtPixelPos.SetText(this.i18n.t("Position", { x: pos.x, y: pos.y }));
		});
	}

	onPointerMove(pos: Vec2) {
		this.zoomView.updatePixelPos(pos);
		const color = this.imageView.readPixel(pos.x, pos.y);
		//console.log(pos, color);

		this.colorView.SetSolidColor(new Vec4(color.r, color.g, color.b, color.a));
		this.txtPixelPos.SetText(this.i18n.t("Position", { x: pos.x, y: pos.y }));
		const rgba = `rgba(${color.r},${color.g},${color.b},${color.a})`;
		this.txtRgba.SetText(rgba);
		this.txtHex.SetText(`hex: ${Color(rgba).hex()}`);
	}

	onPointerEvent() {
		let bMoving = false;
		let bMoved = false;
		let vPressPointerPos = Vec2.Zero;
		let vPressScrollPos = Vec2.Zero;
		this.imageView.control.OnPointerEnter((sender, mp) => {
			this.lockColor = false;
		});
		this.imageView.control.OnPointerPress((sender, mp) => {
			if (mp.Button == PointerButton.First) {
				bMoving = true;
				bMoved = false;
				vPressPointerPos = this.window.GetPlatform().PointerGetPosition();
				vPressScrollPos = this.pager.GetScrollPosition();
			}
		});
		this.imageView.control.OnPointerRelease((sender, mp) => {
			if (mp.Button == PointerButton.First) {
				bMoving = false;
				if (!bMoved)
					this.lockColor = !this.lockColor;
			}
		});
		this.imageView.control.OnPointerMove((sender, mp) => {
			if (bMoving) {
				bMoved = true;
				const vPos = this.window.GetPlatform().PointerGetPosition();
				this.pager.SetScrollPosition(vPressScrollPos.Add(vPos.Sub(vPressPointerPos)), false);
				this.window.Update();
			}
			else if (!this.lockColor) this.onPointerMove(mp.Position);
		});
		// this.imageView.control.OnPaintPost((sender, painter, rc) => {
		// 	console.log(this.window.GetTime());
		// });
	}

	openFile(file: string) {
		const codec = this.app.GetImageCodec();
		const resourceSource = ResourceSource.FromBuffer(fs.readFileSync(file));
		const aveImage = codec.Open(resourceSource);
		this.imageView.updateRawImage(aveImage);
		this.track();
	}

	track() {
		this.lockColor = false;
		this.zoomView.track({ image: this.imageView.native });
		this.miniView.track({ pager: this.pager, image: this.imageView.native });
		this.pager.SetContentSize(new Vec2(this.imageView.width, this.imageView.height));
	}

	async browseOpenFile() {
		const s = await this.window.GetCommonUi().OpenFile([new SysDialogFilter("Image Files", "*.png;*.jpg;*.jpeg")], "png", "", "");
		if (null != s && s.length > 0) this.openFile(s);
	}

	pastePicture() {
		const clipboard = AveGetClipboard();
		if (clipboard.HasImage()) {
			const aveImage = clipboard.GetImage();
			this.imageView.updateRawImage(aveImage);
			this.track();
		} else if (clipboard.HasFile()) {
			const [file] = clipboard.GetFile();
			if (file && ["png", "jpg", "jpeg"].some((extension) => file.endsWith(extension))) {
				this.openFile(file);
			}
		}
	}
}
