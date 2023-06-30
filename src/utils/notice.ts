import { Notice } from "obsidian";

export const sendNotice = (message: string) => {
    return new Notice(message, 3000);
}
