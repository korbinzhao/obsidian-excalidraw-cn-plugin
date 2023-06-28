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

    sequelize(data: ExcalidrawDataSource) {
        return JSON.stringify(data);
    }

    onChange(data: ExcalidrawDataSource) {
        const dataStr = this.sequelize(data);

        if (this.data !== dataStr) {
            this.data = dataStr;
        }

        this.requestSave();
    }

    async onLoadFile(file: TFile): Promise<void> {

        console.log('--- onLoadFile ---', file);

        this.file = file;

        this.render(file);
    }

    async onUnloadFile(file: TFile): Promise<void> {

        console.log('--- onUnloadFile ---', JSON.parse(this.data).elements?.length);

        this.setViewData(this.data, true);
    }

    async onClose() {

        console.log('--- onClose ---');

        this.setViewData(this.data, true);
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

        this.root = this.root || createRoot(this.containerEl.children[1]);;

        const fileData = await this.app.vault.process(file, data => data);

        if (!fileData) {
            return;
        }

        console.log('--- render ---', JSON.parse(fileData).elements?.length);

        this.data = fileData || DEFAULT_DATA;

        this.root?.render(
            <React.StrictMode>
                <ExcalidrawCnApp onChange={this.onChange.bind(this)} dataSource={fileData} />
            </React.StrictMode>
        );
    }

    clear(): void {
        this.data = DEFAULT_DATA;
        this.root?.render(null);
    }

}