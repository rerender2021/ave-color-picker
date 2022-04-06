import { IPackConfig } from "ave-pack";

const config: IPackConfig = {
  build: {
    projectRoot: __dirname,
    target: "node14-win-x64",
    input: "./build/index.js",
    output: "./bin/color-picker.exe",
  },
  resource: {
    icon: "./assets/color-wheel.ico",
    productVersion: "0.0.1",
    productName: "Color Picker",
    fileVersion: "0.0.1",
    companyName: "QberSoft",
    fileDescription: "A simple color picker",
    LegalCopyright: `© ${new Date().getFullYear()} Ave Copyright.`,
  },
};

export default config;
