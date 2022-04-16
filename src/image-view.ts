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

    get width() {
        return this.image.native.GetWidth();
    }

    get height() {
        return this.image.native.GetHeight();
    }

	private onCreate() {
		this.view = new Picture(this.window);
		this.view.SetStretchMode(StretchMode.Center);
	}

    updateImage(image: NativeImage) {
        this.image = image;
        this.view.SetImage(this.image.native);
    }
}
