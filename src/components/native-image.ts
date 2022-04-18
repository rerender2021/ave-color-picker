import { AveImage, Byo2Image, Byo2ImageCreation, Byo2ImageDataType, IByo2Image, ImageData, ResourceSource, Window } from "ave-ui";
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
		const color = this.imgData.SafeGetPixel(x, y, 0);
		return {
			r: color.r * 255,
			g: color.g * 255,
			b: color.b * 255,
			a: color.a * 255,
		};
	}
}