import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ExcalidrawApp } from 'handraw-materials';
import { ExcalidrawDataSource, NonDeletedExcalidrawElement } from 'handraw-materials/es/ExcalidrawApp/types';
import { sendNotice } from './utils/notice';
import { getLinkFileName } from './utils/file';

export const VIEW_TYPE_EXCALIDRAW_CN = "excalidraw_cn";

const DEFAULT_DATA = '{}';
const DEFAULT_DATA_OBJ = {};

export class ExcalidrawCnView extends TextFileView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    root: Root;

    data: string = DEFAULT_DATA;

    dataObj: ExcalidrawDataSource | {};

    file: TFile;

    excalidrawCnAppRef: any;

    timer: NodeJS.Timeout | null;

    debounceSave = () => {
        this.timer && clearTimeout(this.timer);

        this.timer = setTimeout(() => {
            this.timer && clearTimeout(this.timer);
            this.timer = null;
            this.save();
        }, 200);
    }

    getViewType() {
        return VIEW_TYPE_EXCALIDRAW_CN;
    }

    sequelize(data: ExcalidrawDataSource | {}) {
        return JSON.stringify(data);
    }

    onChange(data: ExcalidrawDataSource | {}) {
        this.dataObj = data;

        this.debounceSave();
    }

    async onLoadFile(file: TFile): Promise<void> {
        this.file = file;

        this.render(file);
    }

    async onUnloadFile(file: TFile): Promise<void> {
        this.clear();
    }

    onunload() {
        this.clear();

        this.root?.unmount();
    }

    async onClose() {
        this.root?.unmount();
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string = DEFAULT_DATA, clear: boolean = false): void {
        this.data = data;

        if (clear) {
            this.clear();
        }
    }

    async save(clear: boolean = false) {

        const data = this.sequelize(this.dataObj);

        // no nothing when data not changed
        if (data === this.data) {
            return;
        }

        try {
            this.setViewData(data);

            this.app.vault.modify(this.file, this.data);

            if (clear) {
                this.clear();
            }
        } catch (err) {
            console.error('Save failed:', err);
            sendNotice('Save failed!')
        }


    }

    onLinkOpen(
        element: NonDeletedExcalidrawElement,
        event: CustomEvent<{
            nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
        }>
    ) {
        const fileName = getLinkFileName(element.link);

        fileName && this.app.workspace.openLinkText(decodeURIComponent(fileName), '', 'tab');

    }

    async render(file: TFile) {

        this.root = this.root || createRoot(this.containerEl.children[1]);;

        let fileData = await this.app.vault.read(file);

        if (!fileData) {
            return;
        }

        this.setViewData(fileData);

        this.root?.render(
            <React.StrictMode>
                <ExcalidrawApp
                    onChange={this.onChange.bind(this)}
                    dataSource={fileData}
                    canvasName={this.file.name}
                    onLinkOpen={this.onLinkOpen.bind(this)}
                />
            </React.StrictMode>
        );
    }

    clear(): void {
        this.timer && clearTimeout(this.timer);
        this.timer = null;

        this.setViewData(DEFAULT_DATA);
        this.dataObj = DEFAULT_DATA_OBJ;
        this.root?.render(null);
    }

}