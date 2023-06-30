import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import ExcalidrawCnApp from './excalidraw-app';
import { ExcalidrawDataSource } from './excalidraw-app';

export const VIEW_TYPE_EXCALIDRAW_CN = "excalidraw_cn";

const DEFAULT_DATA = '{}';

export class ExcalidrawCnView extends TextFileView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    root: Root;

    data: string = DEFAULT_DATA;

    dataObj: ExcalidrawDataSource | {};

    file: TFile;

    excalidrawCnAppRef: any;

    getViewType() {
        return VIEW_TYPE_EXCALIDRAW_CN;
    }

    sequelize(data: ExcalidrawDataSource | {}) {
        return JSON.stringify(data);
    }

    onChange(data: ExcalidrawDataSource | {}) {
        this.dataObj = data;
        this.requestSave();
    }

    async onLoadFile(file: TFile): Promise<void> {

        console.log('--- onLoadFile ---', file.path);

        this.file = file;

        this.render(file);
    }

    async onUnloadFile(file: TFile): Promise<void> {

        console.log('--- onUnloadFile ---', JSON.parse(this.data).elements?.length, file.path);

        this.clear();

        console.log('----------------------------');
    }

    onunload(){
        console.log('--- onunload ---');
        this.root?.unmount();
    }

    async onClose() {
        console.log('--- onClose ---');

        this.root?.unmount();
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string = DEFAULT_DATA, clear: boolean = false): void {
        this.data = data;

        console.log('--- setViewData --', data.length);

        if (clear) {
            this.clear();
        }
    }

    async save(clear: boolean = false) {

        console.log('--- save ---');

        const data = this.sequelize(this.dataObj);

        this.setViewData(data);

        this.app.vault.modify(this.file, this.data);

        if (clear) {
            this.clear();
        }
    }

    getExcalidrawCnAppRef(ref: any) {
        this.excalidrawCnAppRef = ref;
    }

    async render(file: TFile) {

        this.root = this.root || createRoot(this.containerEl.children[1]);;

        const fileData = await this.app.vault.process(file, data => data);

        if (!fileData) {
            return;
        }

        console.log('--- render ---', JSON.parse(fileData).elements?.length, JSON.parse(fileData).files);

        this.setViewData(fileData);

        this.root?.render(
            <React.StrictMode>
                <ExcalidrawCnApp
                    outputExcalidrawCnAppAPI={this.getExcalidrawCnAppRef.bind(this)}
                    onChange={this.onChange.bind(this)}
                    dataSource={fileData}
                    fileName={this.file.name}
                />
            </React.StrictMode>
        );
    }

    clear(): void {
        this.setViewData(DEFAULT_DATA);
        this.dataObj = {};
        this.root?.render(null);
    }

}