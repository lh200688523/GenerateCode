import { 
    TreeDataProvider, 
    FileSystemProvider, 
    FileChangeType, 
    EventEmitter, 
    FileChangeEvent, 
    Event, 
    Uri, 
    Disposable, 
    FileStat, 
    FileType,
    FileSystemError,
    workspace,
    TreeItemCollapsibleState,
    TreeItem
} from 'vscode';
import * as fs from 'fs';
import { join, dirname, resolve } from 'path';
import { Entry } from './file-entry';
import { GCFileStat } from './file-stat';
import * as _ from './file-utils';

/**
 * 文件系统树型数据提供类
 */
export class GCFileSystemTreeProvider implements TreeDataProvider<Entry>, FileSystemProvider {

	private _onDidChangeFile: EventEmitter<FileChangeEvent[]>;

	constructor() {
		this._onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
	}

	get onDidChangeFile(): Event<FileChangeEvent[]> {
		return this._onDidChangeFile.event;
	}

	watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
		const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, async (event: string, filename: string | Buffer) => {
			const filepath = join(uri.fsPath, _.normalizeNFC(filename.toString()));

			// TODO support excludes (using minimatch library?)

			this._onDidChangeFile.fire([{
				type: event === 'change' ? FileChangeType.Changed : await _.exists(filepath) ? FileChangeType.Created : FileChangeType.Deleted,
				uri: uri.with({ path: filepath })
			} as FileChangeEvent]);
		});

		return { dispose: () => watcher.close() };
	}

	stat(uri: Uri): FileStat | Thenable<FileStat> {
		return this._stat(uri.fsPath);
	}

	async _stat(path: string): Promise<FileStat> {
		return new GCFileStat(await _.stat(path));
	}

	readDirectory(uri: Uri, flag: boolean = false): [string, FileType][] | Thenable<[string, FileType][]> {
		return this._readDirectory(uri, flag);
	}

	async _readDirectory(uri: Uri, flag: boolean): Promise<[string, FileType][]> {
		const _path = flag ? resolve(uri.fsPath, '../') : uri.fsPath;
		const children = await _.readdir(_path);

		const result: [string, FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this._stat(join(_path, child));
			result.push([child, stat.type]);
		}

		return Promise.resolve(result);
	}

	createDirectory(uri: Uri): void | Thenable<void> {
		return _.mkdir(uri.fsPath);
	}

	readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
		return _.readfile(uri.fsPath);
	}

	writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
		return this._writeFile(uri, content, options);
	}

	async _writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(uri.fsPath);
		if (!exists) {
			if (!options.create) {
				throw FileSystemError.FileNotFound();
			}

			await _.mkdir(dirname(uri.fsPath));
		} else {
			if (!options.overwrite) {
				throw FileSystemError.FileExists();
			}
		}

		return _.writefile(uri.fsPath, content as Buffer);
	}

	delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
		if (options.recursive) {
			return _.rmrf(uri.fsPath);
		}

		return _.unlink(uri.fsPath);
	}

	rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
		return this._rename(oldUri, newUri, options);
	}

	async _rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(newUri.fsPath);
		if (exists) {
			if (!options.overwrite) {
				throw FileSystemError.FileExists();
			} else {
				await _.rmrf(newUri.fsPath);
			}
		}

		const parentExists = await _.exists(dirname(newUri.fsPath));
		if (!parentExists) {
			await _.mkdir(dirname(newUri.fsPath));
		}

		return _.rename(oldUri.fsPath, newUri.fsPath);
	}

	// tree data provider

	async getChildren(element?: Entry): Promise<Entry[]> {
		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({ uri: Uri.file(join(element.uri.fsPath, name)), type }));
        }

		const workspaceFolder = workspace.workspaceFolders && workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
		if (workspaceFolder) {
			const children = await this.readDirectory(workspaceFolder.uri, true);
			children.sort((a, b) => {
				if (a[1] === b[1]) {
					return a[0].localeCompare(b[0]);
				}
				return a[1] === FileType.Directory ? -1 : 1;
			});
			return children.map(([name, type]) => ({ uri: Uri.file(join(resolve(workspaceFolder.uri.fsPath, '../'), name)), type }));
		}

		return [];
	}

	getTreeItem(element: Entry): TreeItem {
		
		const pType = _.isProjectType(element.uri.fsPath);
		const treeItem = new TreeItem(element.uri, element.type === FileType.Directory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
		if (pType) {
			treeItem.iconPath = join(__filename, '../../../public/webview/images/',`${pType}.svg`);
		}
		if (element.type === FileType.File) {
			treeItem.command = { command: 'fileExplorer.openFile', title: "Open File", arguments: [element.uri], };
			treeItem.contextValue = 'file';
		}
		return treeItem;
	}
}