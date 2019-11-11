// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { join } from 'path';
import * as fs from 'fs';
import { GenerateCore } from './generate/generate.core';
import { AngularGenerate } from './generate/angular.generate';
import { GCFileExplorer } from './files/file-explorer';
import { GCWebviewPanel } from './webview/webview-panel';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let generate: GenerateCore;
	
	let fileTreeExplore: GCFileExplorer = new GCFileExplorer(context);
	GCWebviewPanel.setContext(context);
	
	let setProjctConfig = vscode.commands.registerCommand('projects.setConfig', () => {
		GCWebviewPanel.createOrShow(context.extensionPath, '项目配置' ,'project_config.html');
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let generateAngularProject = vscode.commands.registerCommand('projects.create', () => {
		// The code you place here will be executed every time your command is executed
		// generate = new AngularGenerate()
		GCWebviewPanel.createOrShow(context.extensionPath, '创建项目', 'create_project.html');
	});

	context.subscriptions.push(setProjctConfig);
	context.subscriptions.push(generateAngularProject);
}

// this method is called when your extension is deactivated
export function deactivate() {
	
}