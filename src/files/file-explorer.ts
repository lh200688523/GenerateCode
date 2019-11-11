import * as vscode from 'vscode';
import { GCFileSystemTreeProvider } from './file-system-tree-provider';
import { Entry } from './file-entry';
/**
 * 文件指令注册类
 */
export class GCFileExplorer {

	private fileExplorer: vscode.TreeView<Entry>;

	constructor(context: vscode.ExtensionContext) {
		const treeDataProvider = new GCFileSystemTreeProvider();
		this.fileExplorer = vscode.window.createTreeView('fileExplorer', { treeDataProvider });
		vscode.commands.registerCommand('fileExplorer.openFile', (resource) => this.openResource(resource));
	}

	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
}