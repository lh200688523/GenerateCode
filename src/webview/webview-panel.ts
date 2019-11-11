import { ExtensionContext, WebviewPanel, window, ViewColumn, Uri, Disposable, Webview, commands } from 'vscode';
import { join } from 'path';
import * as _ from '../files/file-utils';
import { GCWebviewMessage } from './webview-message';

export class GCWebviewPanel {
    
    public static webviewPanels: GCWebviewPanel[] = [];
    private _panel: WebviewPanel;
    private _extensionPath: string;
    private _disposables: Disposable[] = [];
    private _fileName: string;
    private readonly _gcWebviewMsg: GCWebviewMessage;
    private static context: ExtensionContext;
    
    public static setContext(_context: ExtensionContext){
        GCWebviewPanel.context = _context;
    }

    public static createOrShow(extensionPath: string, title: string, fileName: string){
        const column = window.activeTextEditor
        ? window.activeTextEditor.viewColumn
        : undefined;

        const webPanel = GCWebviewPanel.hasOpenWeb(fileName);
        if(webPanel){
            webPanel._panel.reveal(column);
            return;
        }
        
        // Otherwise, create a new panel.
		const panel = window.createWebviewPanel(
			`${fileName.substring(0, fileName.lastIndexOf('.'))}_panel`,
			title,
			column || ViewColumn.One,
			{
				// Enable javascript in the webview
                enableScripts: true,
                

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [Uri.file(join(extensionPath, 'public', 'webview'))]
			}
		);

		GCWebviewPanel.webviewPanels.push(new GCWebviewPanel(panel, extensionPath, fileName));
    }

    constructor(panel: WebviewPanel, extensionPath: string, fileName: string) {
        this._panel = panel;
        this._extensionPath = extensionPath;
        this._fileName = fileName;
        
        this._gcWebviewMsg = GCWebviewMessage.getInstance({
            webview: this._panel.webview,
            context: GCWebviewPanel.context
        });
        this._gcWebviewMsg.initListens();
        this._gcWebviewMsg.initProjectInfo();

        this.update(fileName);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.onDidChangeViewState((state) => {
            if (this._panel.visible) {
                this.update(fileName);
            }
        }, null, this._disposables);

        this._panel.webview.onDidReceiveMessage((msg) => {
            const data = msg.data;
            this._gcWebviewMsg.trigger(msg.command, data);
        }, null, this._disposables);
    }

    public update(fileName: string) {
        this.getHtmlForWebview(this._panel.webview, fileName);
    }

    public dispose() {
        GCWebviewPanel.webviewPanels.forEach((_webPanel, ind) => {
            if (_webPanel._fileName === this._fileName) {
                _webPanel._panel.dispose();
                GCWebviewPanel.webviewPanels.splice(ind, 1);
            }
        });// = [];
        // GCWebviewPanel.webviewPanels = [];
        // this._panel.dispose();

        while (this._disposables.length) {
            const ind = this._disposables.pop();
            if (ind) {
                ind.dispose();
            }
        }
    }

    private getHtmlForWebview(webview: Webview, fileName: string) {
        const webPath = join(this._extensionPath, 'public', 'webview', fileName);
        _.readFileline(webPath, (contents: string[]) => {
            contents.forEach((line, ind) => {
                let regRes = /\{\{(.*)\}\}|(?=(.*-src.*\{\{(.*)\}\}))/ig.exec(line);
                if (regRes) {
                    let fileName = regRes.find((_tmp) => {
                        return _tmp !== undefined && _tmp !== '' && /^\w+/ig.test(_tmp);
                    }) || '';
                    if (fileName === 'webview.cspSource') {
                        const cspSourceReg = new RegExp(`{{${fileName}}}`, 'g');
                        contents[ind] = contents[ind].replace(cspSourceReg, `${webview.cspSource}`);
                    } else if(fileName === 'nonce') {
                        contents[ind] = contents[ind].replace(`{{${fileName}}}`, `${this.getNonce()}`);
                    } else {
                        let fileUri = Uri.file(join(this._extensionPath, 'public', 'webview', fileName));
                        let webviewUri = webview.asWebviewUri(fileUri);
                        contents[ind] = contents[ind].replace(`{{${fileName}}}`, `${webviewUri}`);
                    }
                }
            });
            webview.html = contents.join('');
        });
    }

    private static hasOpenWeb(fileName: string) {
        return GCWebviewPanel.webviewPanels.find((panel) => {
            return panel._fileName === fileName;
        });
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}