import { TextFileView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import ExcalidrawCnApp from './excalidraw-app/src/App';

export const VIEW_TYPE_EXCALIDRAW_CN = "excalidraw_cn";

export class ExcalidrawCnView extends TextFileView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    root: Root;

    getViewType() {
        return VIEW_TYPE_EXCALIDRAW_CN;
    }

    async onOpen() {
        const root = createRoot(this.containerEl.children[1]);
        this.root = root;

        root.render(
            <React.StrictMode>
                <ExcalidrawCnApp />
            </React.StrictMode>
        );
    }

    async onClose() {
        this.root.unmount();
    }

    getViewData(): string {
        return 'get view data'
    }

    setViewData(data: string, clear: boolean): void {

    }

    clear(): void {

    }


}