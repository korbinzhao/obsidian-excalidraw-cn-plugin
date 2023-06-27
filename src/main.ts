import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ExcalidrawCnView, VIEW_TYPE_EXCALIDRAW_CN } from './view';
import { ICON_NAME } from './constants';

interface ExcalidrawCnPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ExcalidrawCnPluginSettings = {
	mySetting: 'default'
}

/**
 * @public
 */
export interface ViewState {

	/**
	 * @public
	 */
	type: string;
	/**
	 * @public
	 */
	state?: any;
	/**
	 * @public
	 */
	active?: boolean;
	/**
	 * @public
	 */
	pinned?: boolean;
	/**
	 * @public
	 */
	group?: WorkspaceLeaf;
}

export default class ExcalidrawCnPlugin extends Plugin {
	settings: ExcalidrawCnPluginSettings;

	async onload() {

		this.registerView(
			VIEW_TYPE_EXCALIDRAW_CN,
			(leaf) => new ExcalidrawCnView(leaf)
		);

		this.registerExtensions(["excalidrawcn"], VIEW_TYPE_EXCALIDRAW_CN);

		this.addRibbonIcon(ICON_NAME, "Create New Excalidraw File", async (e) => {

			this.createAndOpenDrawing();

			console.log("Hello, you!");

		});

	}

	onunload() {

	}


	public async createAndOpenDrawing(): Promise<string> {

		const file = await this.app.vault.create(`excalidraw ${window.moment().format('YY-MM-DD hh.mm.ss')}.excalidrawcn`, 'hello world');

		const leaf = this.app.workspace.getLeaf(false);

		await this.app.workspace.openLinkText(file.path, file.path, true);

		leaf.setViewState({
			type: VIEW_TYPE_EXCALIDRAW_CN,
			state: leaf.view.getState(),
		});


		return file.path;

	}

}

