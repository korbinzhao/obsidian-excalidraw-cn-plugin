import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ExcalidrawApp } from 'handraw-materials';
import { ExcalidrawDataSource } from 'handraw-materials/es/ExcalidrawApp/App';
import { sendNotice } from './utils/notice';
import { LibraryItems } from "@handraw/excalidraw/types/types";
import {
    NonDeletedExcalidrawElement,
    ExcalidrawElement
} from "@handraw/excalidraw/types/element/types";
import _ from 'lodash';
import { DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX, DOUBLE_CHAIN_LINK_AS_OBSIDIAN_LINK_REGEX, FILE_NAME_REGEX } from './utils/default';

export const VIEW_TYPE_EXCALIDRAW_CN = "excalidraw_cn";

const DEFAULT_DATA = '{}';

const FILE_BASENAME_REGEX = /file=(.+)/;

const LIBRARY_ITEMS_KEY = 'excalidraw_cn_library_items';

const VAULT_NAME = window.app.vault.getName();

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

    onLiraryChange(libraryItems: LibraryItems) {
        localStorage.setItem(LIBRARY_ITEMS_KEY, JSON.stringify(libraryItems))
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

        // 数据未发生变化不做存储
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

    async openFileInNewTab(linkText: string) {
        const basename = linkText.match(FILE_BASENAME_REGEX)?.[1];

        const files = this.app.vault.getFiles();
        const file = files.find(_file => _file.basename === basename);

        const leaf = this.app.workspace.getLeaf(true);

        if (file) {
            await leaf.openFile(file, { active: true });
        }
    }

    onLinkOpen(
        element: NonDeletedExcalidrawElement,
        event: CustomEvent<{
            nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
        }>
    ) {
        let link = element.link!;

        const isDoubleChainLink = DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX.test(link);

        if (isDoubleChainLink) {
            const fileName = link.match(DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX)?.[1];
            link = `obsidian://open?vault=${VAULT_NAME}&file=${fileName}`;
        }

        const { nativeEvent } = event.detail;
        const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
        const isNewWindow = nativeEvent.shiftKey;
        const isInternalLink =
            link.startsWith("/") ||
            link.includes(window.location.origin) ||
            link.startsWith("obsidian://");

        if (isInternalLink && (isNewTab || isNewWindow)) {
            // signal that we're handling the redirect ourselves
            event.preventDefault();
            // do a custom redirect, such as passing to react-router

            this.openFileInNewTab(link);

            return;
        }

        window.location.href = link;

    }

    async render(file: TFile) {

        this.root = this.root || createRoot(this.containerEl.children[1]);;

        let fileData = await this.app.vault.process(file, data => data);

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
        this.dataObj = {};
        this.root?.render(null);
    }

}