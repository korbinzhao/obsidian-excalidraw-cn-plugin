import { TFile } from "obsidian";
import { FILE_EXTENSION } from "src/constants";

export const VAULT_NAME = window.app.vault.adapter.getName();
export const DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX = /\[\[(.+)\]\]/;
export const DOUBLE_CHAIN_LINK_AS_OBSIDIAN_LINK_REGEX = /^obsidian:\/\/open\?vault=.+\&file=(.+)$/;
export const FILE_NAME_REGEX = /(.+)\.[^.]+$/;

export const debounce = (fn: Function, wait: number) => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return (...args: any[]) => {

        if (timer) {
            return;
        }

        timer = setTimeout(() => {
            timer && clearTimeout(timer);
            timer = null;

            fn(...args);
        }, wait)

    }
}

export const isExcalidrawCnFile = (file: TFile) => {
    return file?.extension === FILE_EXTENSION;
}

export const getLinkFileName = (linkText: string) => {
    return linkText?.match(DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX)?.[1] || linkText?.match(DOUBLE_CHAIN_LINK_AS_OBSIDIAN_LINK_REGEX)?.[1];
}
