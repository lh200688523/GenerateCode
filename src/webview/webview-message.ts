import { Webview, ExtensionContext, window, workspace } from "vscode";
import { join } from 'path';
import { Config } from '../core/config';
import * as _ from '../files/file-utils';

export interface MessageParams{
    webview: Webview;
    context: ExtensionContext;
}

export class GCWebviewMessage {

    private static instance: GCWebviewMessage;
    private globalParams: MessageParams;
    private messageListen: Map<string, Function> = new Map<string, Function>();
    private readonly _projectCfgFileName: string = 'project.json';
    private readonly _projectCfgPath: string;
    private readonly _extensionPath: string;

    constructor(globalParams: MessageParams) {
        this.globalParams = globalParams;
        this._extensionPath = this.globalParams.context.extensionPath;
        this._projectCfgPath = this._projectCfgPath = join(this._extensionPath, 'public', 'config', this._projectCfgFileName);
    }

    /**
     * 初始化消息监听
     */
    public initListens() {
        this.listens('createProject', this.createProject);
        this.listens('projectType', this.projectType);
    }

    /**
     * 注册消息监听
     * @param command 消息类型
     * @param fn 消息处理方法
     */
    public listens(command: string, fn: Function) {
        if (!this.messageListen.has(command)) {
            this.messageListen.set(command, fn);
        }
    }

    /**
     * webview消息接收处理方法
     * @param command 消息类型
     * @param params 消息参数
     */
    public trigger(command: string, params: any) {
        if (!this.messageListen.has(command)) {
            return false;
        }
        const fn: Function | undefined = this.messageListen.get(command);
        if (fn instanceof Function) {
            fn.apply(this, [params]);
        }
    }

    /**
     * getInstance
     */
    public static getInstance(params: MessageParams): GCWebviewMessage {
        if (!this.instance) {
            this.instance = new GCWebviewMessage(params);
        } else {
            this.instance.globalParams = params;
        }
        return this.instance;
    }
    
    public initProjectInfo(){
        const workspaceFolder = workspace.workspaceFolders && workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
        const config = this.getConfig();
        this.postMessage({command: 'init', data:{
            projectPath: workspaceFolder ? workspaceFolder.uri.fsPath : '',
            projectTypes: config['projectTypes'] || ["angular", "react", "vue", "nodejs"]
        }});
    }

    public createProject(data: any): void {
        console.log('createProject::',data);
    }

    public projectType(data: any): void {
        const tmpls = this.getProjectTmpl(data);
        console.log('projectType:', data, tmpls);
        if (tmpls && tmpls.length > 0) {
            this.postMessage({command: 'tmpls', data: tmpls});
        }
    }

    private getConfig() {
        return Config.readCfg(this._projectCfgPath);
    }

    private getProjectTmpl(projectType: string = '') {
        const config = this.getConfig();
        if (!config) {
            window.showErrorMessage('配置项不存在，请先配置项目基础配置');
            return [];
        }

        if (!config['tmplPath']) {
            window.showErrorMessage('模板地址配置不存在');
            return [];
        }

        const tmplPath = config['tmplPath'];
        const tmplSubDirPath = join(this._extensionPath, tmplPath, projectType);
        const subDirs = _.forEachDir(tmplSubDirPath);
        
        if (typeof subDirs === 'string') {
            window.showErrorMessage(subDirs);
            return [];
        }
        return subDirs;
    }

    private postMessage(message: any) {
        if (this.globalParams.webview) {
            console.log('postMessage:', this.globalParams.webview, message);
            this.globalParams.webview.postMessage(message);
        }
    }
}
