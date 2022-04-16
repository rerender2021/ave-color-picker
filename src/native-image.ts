import { Byo2Image, Byo2ImageCreation, Byo2ImageDataType, IByo2Image, ResourceSource, Window } from "ave-ui";
import { PNG, PNGWithMetadata } from "pngjs";
import { Component } from "./component";

export class NativeImage extends Component {
	byo2: IByo2Image;
	png: PNGWithMetadata;

	// cp: creation param
	constructor(window: Window, buffer: Buffer) {
		super(window);
		this.onCreate(buffer);
	}

	get native() {
		return this.byo2;
	}

	private onCreate(buffer: Buffer) {
		const imgcp = new Byo2ImageCreation();
		imgcp.DataType = Byo2ImageDataType.Coded;
		imgcp.Data = ResourceSource.FromBuffer(buffer);

		this.byo2 = new Byo2Image(this.window, imgcp);
		this.png = PNG.sync.read(buffer);
	}

	readPixel(x: number, y: number) {
		const { png } = this;
		const data = png.data;
		const i = (png.width * y + x) * 4;
		return {
			r: data[i],
			g: data[i + 1],
			b: data[i + 2],
			a: data[i + 3],
		};
	}
}
