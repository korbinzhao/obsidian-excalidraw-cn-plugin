import { Plugin } from 'obsidian';
import { ExcalidrawCnView, VIEW_TYPE_EXCALIDRAW_CN } from './view';
import { ICON_NAME } from './constants';

export default class ExcalidrawCnPlugin extends Plugin {

	async onload() {

		this.registerView(
			VIEW_TYPE_EXCALIDRAW_CN,
			(leaf) => new ExcalidrawCnView(leaf)
		);

		this.registerExtensions(["exc"], VIEW_TYPE_EXCALIDRAW_CN);

		this.addRibbonIcon(ICON_NAME, "Create New Excalidraw File", async (e) => {

			this.createAndOpenDrawing();

			console.log("Hello, you!");

		});

		this.addCommands();
	}

	addCommands() {
		this.addCommand({
			id: "save",
			hotkeys: [{ modifiers: ["Ctrl"], key: "s" }], //See also Poposcope
			name: 'Save',
			checkCallback: (checking: boolean) => this.saveActiveView(checking),
		});
	}

	private saveActiveView(checking: boolean = false): boolean {
		if (checking) {
			return Boolean(this.app.workspace.getActiveViewOfType(ExcalidrawCnView));
		}
		const view = this.app.workspace.getActiveViewOfType(ExcalidrawCnView);
		if (view) {
			view.save();
			return true;
		}
		return false;
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXCALIDRAW_CN);
	}

	public async createAndOpenDrawing(): Promise<string> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXCALIDRAW_CN);

		const file = await this.app.vault.create(`excalidraw ${window.moment().format('YY-MM-DD hh.mm.ss')}.exc`, '{}');

		const leaf = this.app.workspace.getLeaf(true);

		await leaf.openFile(file, { active: false });

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

