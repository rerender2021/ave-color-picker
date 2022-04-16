import { Window } from "ave-ui";
import { GridLayout } from "../components";

export function getAppLayout(window: Window) {
	const containerLayout = {
		rows: "1",
		columns: "1 128dpx",
		areas: {
			image: { x: 0, y: 0 },
			pixel: { x: 1, y: 0 },
		},
	};

	const pixelLayout = {
		rows: "128dpx 4dpx 128dpx 4dpx 32dpx 4dpx 16dpx 4dpx 16dpx 4dpx 32dpx 4dpx 32dpx 1 16dpx 4dpx 16dpx 4dpx 16dpx 4dpx 16dpx 4dpx 16dpx",
		columns: "1",
		areas: {
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
		},
	};

	return {
		container: new GridLayout<keyof typeof containerLayout.areas>(window, containerLayout),
		pixelGrid: new GridLayout<keyof typeof pixelLayout.areas>(window, pixelLayout),
	};
}
