import { Picture, StretchMode, Window } from "ave-ui";
import { Component } from "./component";
import { NativeImage } from "./native-image";

export class ImageView extends Component {
	private view: Picture;
	private image: NativeImage;

	constructor(window: Window) {
		super(window);
		this.onCreate();
	}

	get control() {
		return this.view;
	}

	get native() {
		return this.image.native;
	}

	get width() {
		return this.image.native.GetWidth();
	}

	get height() {
		return this.image.native.GetHeight();
	}
	
	readPixel(x: number, y: number) {
		return this.image.readPixel(x, y);
	}

	private onCreate() {
		this.view = new Picture(this.window);
		this.view.SetStretchMode(StretchMode.Center);
	}

	updateImage(buffer: Buffer) {
		this.image = new NativeImage(this.window, buffer);
		this.view.SetImage(this.image.native);
	}
}
