import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import ExcalidrawCnApp from './excalidraw-app/src/App';
import { ExcalidrawElement } from "@handraw/excalidraw/types/element/types";
import { AppState } from "@handraw/excalidraw/types/types";
import { ExcalidrawDataSource } from './excalidraw-app/src/App';

export const VIEW_TYPE_EXCALIDRAW_CN = "excalidraw_cn";

const DEFAULT_DATA = '{}';

export class ExcalidrawCnView extends TextFileView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    root: Root;

    data: string = DEFAULT_DATA;
   
    file: TFile;

    getViewType() {
        return VIEW_TYPE_EXCALIDRAW_CN;
    }

    sequelize({ elements, appState }: ExcalidrawDataSource) {
        return JSON.stringify({ elements, appState });
    }

    onSave(elements: readonly ExcalidrawElement[], appState: AppState) {

        this.data = this.sequelize({ elements, appState });

        this.requestSave();
    }

    async onLoadFile(file: TFile): Promise<void> {

        console.log('--- onLoadFile ---', file);

        this.render(file);
    }

    async onUnloadFile(file: TFile): Promise<void> {

        console.log('--- onUnloadFile ---', JSON.parse(this.data).elements?.length);

        this.setViewData(this.data, true);
    }

    async onClose() {

        console.log('--- onClose ---');

        this.setViewData(this.data, true);
        this.root?.unmount();
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string = DEFAULT_DATA, clear: boolean = false): void {
        this.data = data;

        this.app.vault.modify(this.file, data);

        console.log('--- setViewData --', data.length);

        if (clear) {
            this.clear();
        }
    }

    async render(file: TFile) {

        this.file = file;

        this.root = this.root || createRoot(this.containerEl.children[1]);;

        const dataSource = await this.app.vault.process(file, data => data);

        this.data = dataSource || DEFAULT_DATA;

        this.root.render(
            <React.StrictMode>
                <ExcalidrawCnApp onChange={this.onSave.bind(this)} dataSource={dataSource} />
            </React.StrictMode>
        );
    }

    clear(): void {
        this.data = DEFAULT_DATA;
        this.root.render(null);
    }

}