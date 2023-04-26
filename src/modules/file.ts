
import { UserConfig } from "./config.js";
import { exists, lstat, readdir } from "fs-extra";
import '../extends/string.js';
import path = require("path");

export function InsertWeb(path: string) {
    const web = "/WEB";
    const index = path.indexOf('/');
    return path.splice(index != -1 ? index : path.length, 0, web);
}

/**
 * Converts local file path to remote path using user config
 */
export function GetRemotePath(filePath: string, { remotePath, context, removeFromContext }: UserConfig, addWeb = true) {
    let sourcePath = filePath.substring(filePath.indexOf(context));
    for (const remove of removeFromContext) {
        sourcePath = sourcePath.replace(path.sep + remove, '');
        sourcePath = sourcePath.replace(remove + path.sep, '');
    }
    sourcePath = sourcePath.length != 0 ? path.sep + sourcePath : sourcePath;
    const startPath = addWeb ? InsertWeb(remotePath) : remotePath;
    return (startPath + sourcePath).replaceAll(path.sep, '/');
}

/**
 * Checks if the filepath is in the context directory, folder starts with . and the file name is in ignore
 */
export function ValidatePath(filePath: string, userConfig: UserConfig): boolean {
    const firstFolderName = filePath.substring(filePath.lastIndexOf(path.sep, filePath.lastIndexOf(path.sep) - 1), filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');

    if (filePath.indexOf(userConfig.context) == -1 ||
        userConfig.ignore.findIndex((value) => value.toLocaleLowerCase() == fileName.toLocaleLowerCase()) != -1 ||
        firstFolderName.startsWith('.')) {
        return false;
    }
    return true;
}


export async function FindFileInDir(startPath: string, filter: string): Promise<string> {
    if (!await exists(startPath)) {
        return null;
    }
    const files = await readdir(startPath);
    for (const file of files) {
        const name = path.join(startPath, file);
        const stat = await lstat(name);
        if (stat.isDirectory()) {
            const nameInDir = await FindFileInDir(name, filter)
            if (nameInDir) {
                return nameInDir;
            }
        }
        else if (name.endsWith(filter)) {
            return name;
        }
    }
}


export async function GetAllFilesInDir(startPath: string): Promise<string[]> {
    if (!await exists(startPath)) {
        return null;
    }
    const files = [];
    const directory = await readdir(startPath);
    for (const file of directory) {
        const name = path.join(startPath, file);
        const stat = await lstat(name);
        if (stat.isDirectory()) {
            files.push(...await GetAllFilesInDir(name));  
        }
        else{
            files.push(name);
        }
    }

    return files;
}