import { Uri, FileType, ThemeIcon } from 'vscode';

export interface Entry {
	uri: Uri;
	type: FileType;
	iconPath?: string | Uri | ThemeIcon;
}