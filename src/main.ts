import { Plugin, TFile } from 'obsidian';
import { ExcalidrawCnView, VIEW_TYPE_EXCALIDRAW_CN } from './view';
import { ICON_NAME, FILE_EXTENSION } from './constants';
import { ExcalidrawElement } from 'handraw-materials/es/ExcalidrawApp/types';
import { getLinkFileName } from './utils/file';
import { sendNotice } from './utils/notice';

export default class ExcalidrawCnPlugin extends Plugin {

	async onload() {
		this.registerView(
			VIEW_TYPE_EXCALIDRAW_CN,
			(leaf) => new ExcalidrawCnView(leaf)
		);

		this.registerExtensions([FILE_EXTENSION], VIEW_TYPE_EXCALIDRAW_CN);

		this.addRibbonIcon(ICON_NAME, "Create New Excalidraw File", async (e) => {

			this.createAndOpenDrawing();
		});

		this.addEventListeners();
	}

	async syncDoubleChainFileNameWhenRename(newName: string, oldName: string) {

		try {
			const files = this.app.vault.getFiles();
			const excalidrawCnFiles = files.filter(file => file.extension === FILE_EXTENSION);

			for await (const file of excalidrawCnFiles) {
				const fileData = await this.app.vault.read(file);
				const dataObj = JSON.parse(fileData);

				let matchCount = 0;

				dataObj.elements = dataObj.elements.map((element: ExcalidrawElement) => {
					// 此处 fileName 可能带后缀，可能不带后缀，需要做情况兼容，如果不带后缀，统一做 md 文件处理
					const fileName = element.link && getLinkFileName(element.link);

					if (fileName === oldName || `${fileName}.md` === oldName) {
						matchCount++;
						const link = `[[${newName}]]`
						return { ...element, link };
					}
					return element;
				});

				// 只有匹配到双链才重新存储文件数据
				if (matchCount) {
					const newFileData = JSON.stringify(dataObj);
					await this.app.vault.modify(file, newFileData);

					sendNotice(`Update ${matchCount} links in ${file.name}`)
				}

			}

		} catch (err) {
			console.warn('sync new file name failed', err)
		}

	}

	addEventListeners() {
		this.registerEvent(this.app.vault.on('rename', (file: TFile, oldPath: string) => {

			if (!(file instanceof TFile)) {
				return;
			}

			oldPath && this.syncDoubleChainFileNameWhenRename(file.name, oldPath);
		}));
	}

	public async createAndOpenDrawing(): Promise<string> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXCALIDRAW_CN);

		const file = await this.app.vault.create(`excalidraw ${window.moment().format('YY-MM-DD hh.mm.ss')}.${FILE_EXTENSION}`, '{}');

		const leaf = this.app.workspace.getLeaf('tab');

		await leaf.openFile(file, { active: true });

		leaf.setViewState({
			type: VIEW_TYPE_EXCALIDRAW_CN,
			state: leaf.view.getState(),
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_EXCALIDRAW_CN)[0]
		);

		return file.path;

	}

}

