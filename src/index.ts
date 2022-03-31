import { App, WindowCreation, Window, WindowFlag, Grid, Button, Picture, ResourceSource } from 'ave-ui';
import * as path from "path";
import * as fs from "fs";

export function main(window: Window) {
    const picture = new Picture(window);
    const buffer = fs.readFileSync(path.resolve(__dirname, "./FileOpen#6.png"));
    const source = ResourceSource.FromBuffer(buffer);
    picture.SetPicture(source);

    const container = get3x3Grid(window);
    container.ControlAdd(picture).SetGrid(1, 1)
    window.SetContent(container);
}

run(main);

export function run(main: Function) {
    const app = new App();
    globalThis.app = app;

    //
    const cpWindow = new WindowCreation();
    cpWindow.Title = 'Window';
    cpWindow.Flag |= WindowFlag.Layered;

    const window = new Window(cpWindow);
    globalThis._window = window;

    window.OnCreateContent(sender => {
        main(window);
        return true
    })

    if (!window.CreateWindow())
        process.exit(-1);

    window.SetVisible(true);
    window.Activate();
}

export function get3x3Grid(window: Window, width = 500, height = 500) {
    const container = new Grid(window);
    container.ColAddSlice(1);
    container.ColAddDpx(width);
    container.ColAddSlice(1);

    container.RowAddSlice(1);
    container.RowAddDpx(height);
    container.RowAddSlice(1);
    return container;
}