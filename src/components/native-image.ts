import { AveImage, Byo2Image, Byo2ImageCreation, Byo2ImageDataType, IByo2Image, ImageData, ResourceSource, Window } from "ave-ui";
import { PNG, PNGWithMetadata } from "pngjs";
import { Component } from "./component";

export interface INativeImage {
	readPixel(x: number, y: number): { r: number; g: number; b: number; a: number };
	native: IByo2Image;
}

export class NativeRawImage extends Component implements INativeImage {
	private byo2: IByo2Image;
	private aveImage: AveImage;
	private imgData: ImageData;

	constructor(window: Window, aveImage: AveImage) {
		super(window);
		this.aveImage = aveImage;
		this.onCreate();
	}

	get native() {
		return this.byo2;
	}

	private onCreate() {
		const imgcp = new Byo2ImageCreation();
		imgcp.DataType = Byo2ImageDataType.Raw;

		this.imgData = this.aveImage.GetImage(0, 0, 0);
		imgcp.Data = ResourceSource.FromArrayBuffer(this.imgData.Data, this.imgData.RowPitch, this.imgData.SlicePitch);
		imgcp.Width = this.imgData.Width;
		imgcp.Height = this.imgData.Height;
		imgcp.Format = this.imgData.Format;
		this.byo2 = new Byo2Image(this.window, imgcp);
	}

	readPixel(x: number, y: number) {
		const color = this.imgData.GetPixel(x, y, 0);
		return {
			r: color.r * 255,
			g: color.g * 255,
			b: color.b * 255,
			a: color.a * 255,
		};
	}
}

export class NativeImage extends Component implements INativeImage {
	private byo2: IByo2Image;
	private png: PNGWithMetadata;

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
