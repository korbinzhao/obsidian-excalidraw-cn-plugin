import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import ExcalidrawCnApp from './excalidraw-app/src/App';
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

    excalidrawCnAppRef: any;

    getViewType() {
        return VIEW_TYPE_EXCALIDRAW_CN;
    }

    sequelize(data: ExcalidrawDataSource) {
        return JSON.stringify(data);
    }

    onChange(data: ExcalidrawDataSource) {

        // console.log('--- onChange ---', data);

        const dataStr = this.sequelize(data);

        if (this.data !== dataStr) {
            this.data = dataStr;
        }

        // this.requestSave();
    }

    async onLoadFile(file: TFile): Promise<void> {

        console.log('--- onLoadFile ---', file.path);

        this.file = file;

        this.render(file);
    }

    async onUnloadFile(file: TFile): Promise<void> {

        console.log('--- onUnloadFile ---', JSON.parse(this.data).elements?.length, file.path);

        this.setViewData(this.data, true);

        console.log('----------------------------');
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

        console.log('--- setViewData --', data.length, JSON.parse(data).files);

        if (clear) {
            this.clear();
        }
    }

    async save() {
        await this.setViewData(this.data, false);

        console.log('saved excalidrawCnAppRef', this.excalidrawCnAppRef);

        await this.excalidrawCnAppRef.message('Saved!');
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

        this.data = fileData || DEFAULT_DATA;

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
        this.root?.render(null);
    }

}