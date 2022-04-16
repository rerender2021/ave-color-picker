import { DpiSize, Grid, IControl, Window } from "ave-ui";
import { Component } from "./component";

export interface IGridLayout {
	/**
	 * whitespace sperated sizes, eg. "1 50px 100dpx"
	 */
	columns?: string;
	rows?: string;
	areas?: Record<string, GridArea>;
}

export type GridArea = {
	/**
	 * column
	 */
	x: number;
	/**
	 * row
	 */
	y: number;
	xspan?: number;
	yspan?: number;
};

export class GridLayout extends Component {
	private grid: Grid;
	private layout: IGridLayout;

	constructor(window: Window, layout: IGridLayout) {
		super(window);
		this.grid = new Grid(this.window);
		this.layout = layout;
		this.createGrid();
	}

	get control() {
		return this.grid;
	}

	addControl(control: IControl, area: string | GridArea) {
		const childArea = typeof area === "string" ? this.getArea(area) : area;
		const gridControl = this.grid.ControlAdd(control).SetGrid(childArea.x, childArea.y, childArea.xspan, childArea.yspan);
		return gridControl;
	}

	private createGrid() {
		const { columns, rows } = this.layout;

		//
		columns
			?.trim()
			.split(" ")
			.forEach((col) => this.grid.ColAdd(parseSize(col)));

		//
		rows?.trim()
			.split(" ")
			.forEach((row) => this.grid.RowAdd(parseSize(row)));
	}

	private getArea(name: string) {
		const areas = this.layout.areas || {};
		return areas[name] || { x: 0, y: 0, xspan: 1, yspan: 1 };
	}
}

function parseSize(size: string) {
	if (size.endsWith("px")) {
		return DpiSize.FromPixel(parseFloat(size.replace("px", "")));
	} else if (size.endsWith("dpx")) {
		return DpiSize.FromPixelScaled(parseFloat(size.replace("dpx", "")));
	} else {
		return DpiSize.FromSlice(parseFloat(size));
	}
}
