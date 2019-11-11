import { IProjectConfig } from "../core/project-config-interface";
import * as fs from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';

/**
 * 项目生成基础类
 */
export abstract class GenerateCore {
    protected config: IProjectConfig;
    protected context: vscode.ExtensionContext;
    protected projectPath: string = '';

    constructor(config: IProjectConfig, context: vscode.ExtensionContext) {
        this.config = config;
        this.context = context;
    }

    private has(prop: string){
        return Reflect.has(this.config, prop);
    }

    verify(){
        if(!this.config || Object.keys(this.config).length === 0){
            vscode.window.showErrorMessage('Please configure project information first!');
            return false;
        }
        if(!this.has('name')){
            vscode.window.showErrorMessage('Project name cannot be empty!');
            return false;
        }
        if(!this.has('storagePath')){
            vscode.window.showErrorMessage('Project storage path cannot be empty!');
            return false;
        }
        if(!this.has('projectType')){
            vscode.window.showErrorMessage('Project type cannot be empty!');
            return false;
        }
    }

    mkdir(_path: string, isNew: boolean = true): string {
        _path = join(this.config.storagePath, _path);
        if(fs.existsSync(_path) && !isNew){//判断目录是否存在
            return _path;
        }
        fs.mkdirSync(_path);
        return _path;
    }

    /**
     * 初始化项目
     */
    init() {
        if (!this.verify()) {
            return false;
        }
        
        this.initProjectAllFolder();
    }

    getProjectFolder(){
        
    }

    protected initProjectAllFolder(): any | void {
        //生成项目目录
        this.projectPath = this.mkdir(this.config.name, false);
        
        const srcPath = this.mkdir(join(this.projectPath, 'src'));

        return {
            srcPath
        };
    }
}