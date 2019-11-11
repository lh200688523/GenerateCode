import * as vscode from 'vscode';
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import { join } from 'path';
import * as readline from 'readline';

function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
    if (error) {
        reject(massageError(error));
    } else {
        resolve(result);
    }
}

function massageError(error: Error & { code?: string }): Error {
    if (error.code === 'ENOENT') {
        return vscode.FileSystemError.FileNotFound();
    }

    if (error.code === 'EISDIR') {
        return vscode.FileSystemError.FileIsADirectory();
    }

    if (error.code === 'EEXIST') {
        return vscode.FileSystemError.FileExists();
    }

    if (error.code === 'EPERM' || error.code === 'EACCESS') {
        return vscode.FileSystemError.NoPermissions();
    }

    return error;
}

export function checkCancellation(token: vscode.CancellationToken): void {
    if (token.isCancellationRequested) {
        throw new Error('Operation cancelled');
    }
}

export function normalizeNFC(items: string): string;
export function normalizeNFC(items: string[]): string[];
export function normalizeNFC(items: string | string[]): string | string[] {
    if (process.platform !== 'darwin') {
        return items;
    }

    if (Array.isArray(items)) {
        return items.map(item => item.normalize('NFC'));
    }

    return items.normalize('NFC');
}

export function readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
    });
}

export function stat(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
        fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
    });
}

export function readfile(path: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        fs.readFile(path, (error, buffer) => handleResult(resolve, reject, error, buffer));
    });
}

export function readFileSync(path: string, encoding: string = 'utf-8'){
    return fs.readFileSync(path, encoding);
}

export function writefile(path: string, content: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(path, content, error => handleResult(resolve, reject, error, void 0));
    });
}

export function writeFileSync(path: string, content: Buffer, encoding: string = 'utf-8'){
    return fs.writeFileSync(path, content, encoding);
}

export function exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.exists(path, exists => handleResult(resolve, reject, null, exists));
    });
}

export function existsSync(path: string){
    return fs.existsSync(path);
}

export function rmrf(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        rimraf(path, error => handleResult(resolve, reject, error, void 0));
    });
}

export function mkdir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        mkdirp(path, error => handleResult(resolve, reject, error, void 0));
    });
}

export function rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.rename(oldPath, newPath, error => handleResult(resolve, reject, error, void 0));
    });
}

export function unlink(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
    });
}

export function isProjectType(path: string): string| void{
    const projectTypes =  /(angular|nodejs|react|vue)/ig;//['angular', 'nodejs', 'react', 'vue'];
    const packagePath = join(path, 'package.json');
    const isPackage = fs.existsSync(packagePath);
    if (isPackage) {
        const content = fs.readFileSync(packagePath, 'utf8');
        const match = content.match(projectTypes);
        if (match) {
            return match[0];
        } else {
            return 'nodejs';
        }
    } else {
        // throw new Error('No package.json file found.');
    }
}

export function readFileline(path: string, callback: Function): void{
    let readStream = fs.createReadStream(path);
    let line = readline.createInterface(readStream);
    let lines: string[] = [];
    line.on('line', (_line) => {
        lines.push(_line);
    });
    line.on('close', () => {
        callback(lines);
    });
}

export function forEachDir(path: string): string[] | string{
    const isDir = fs.existsSync(path);
    
    if (!isDir) {
        return "目录不存在";
    }
    const subDirs: string[] = fs.readdirSync(path);
    let subDirsRes: string[] = [];
    subDirs.forEach((subDir) => {
        const subDirPath = join(path, subDir);
        const stat = fs.statSync(subDirPath);
        if(stat.isDirectory()){
            subDirsRes.push(subDir);
        }
    });
    
    return subDirsRes;
}
