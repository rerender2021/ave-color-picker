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
		// prettier-ignore
		rows: [
			"128dpx", /* mini view  */ "4dpx",
			"128dpx", /* zoom view  */ "4dpx",
			"32dpx",  /* color view */ "4dpx",
			"16dpx",  /* pixel pos  */ "4dpx",
			"16dpx",  /* pixel hex */ "4dpx",
			"16dpx",  /* pixel rgba */ "4dpx",
			"32dpx",  /* open file  */ "4dpx",
			"32dpx",  /* paste 		*/
			"1", 
			"16dpx",  /* move: wasd */ "4dpx",
			"16dpx",  /* lock color */ "4dpx",
			"16dpx",  /* open file  */ "4dpx",
			"16dpx",  /* paste      */ "4dpx",
			"16dpx",  /* drop png   */
		].join(" "),
		columns: "1",
		areas: {
			//
			miniView: { x: 0, y: 0 },
			zoomView: { x: 0, y: 2 },
			colorView: { x: 0, y: 4 },
			pixelPos: { x: 0, y: 6 },
			pixelHex: { x: 0, y: 8 },
			pixelRgba: { x: 0, y: 10 },
			openFile: { x: 0, y: 12 },
			paste: { x: 0, y: 14 },
			//
			usageMove: { x: 0, y: 16 },
			usageLockColor: { x: 0, y: 18 },
			usageOpenFile: { x: 0, y: 20 },
			usagePaste: { x: 0, y: 22 },
			usageDrop: { x: 0, y: 24 },
		},
	};

	return {
		container: new GridLayout<keyof typeof containerLayout.areas>(window, containerLayout),
		pixelGrid: new GridLayout<keyof typeof pixelLayout.areas>(window, pixelLayout),
	};
}
