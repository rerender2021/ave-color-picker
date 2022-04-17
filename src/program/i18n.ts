import { App, CultureId } from "ave-ui";

export interface ILang {
	// ave built-in language key
	AppTitle: string;
	CoOk: string;

	// user defined key
	OpenFile: string;
	Paste: string;
}

export type KeyOfLang = keyof ILang;

export interface Ii18n {
	t(key: keyof ILang): string;
	switch(id: CultureId): void;
	lang: Partial<Record<CultureId, ILang>>;
}

export function initI18n(app: App) {
	const i18n: Ii18n = {
		t(key: keyof ILang) {
			return app.LangGetString(key);
		},
		switch(this: Ii18n, id: CultureId) {
			app.LangSetDefaultString(id, this.lang[id]);
		},
		lang: {
			[CultureId.en_us]: {
				AppTitle: "Color Picker",
                CoOk: "OK",
				OpenFile: "Open File",
				Paste: "Paste",
			},
			[CultureId.zh_cn]: {
				AppTitle: "颜色选择器",
                CoOk: "好的",
				OpenFile: "选择图片",
				Paste: "粘贴",
			},
		},
	};

	return i18n;
}

// // prettier-ignore
// this.app.LangSetDefaultString(CultureId.en_us, {
// 	"CoOk"      /**/: "OK",
// 	"CoCut"    	/**/: "Cut",
// 	"CoCopy"   	/**/: "Copy",
// 	"CoPaste"  	/**/: "Paste",
// 	"CoDelete" 	/**/: "Delete",
// 	"CoUndo"   	/**/: "Undo",
// 	"CoSelAll" 	/**/: "Select All",
// });
