
import { exists, lstat, readdir } from "fs-extra";
import ignore from "ignore";
import '../extends/string.js';
import { UserConfig, configManager } from "./config.js";
import path = require("path");
import micromatch = require("micromatch");

export function InsertWeb(path: string) {
    const web = "/WEB";
    const index = path.indexOf('/');
    return path.splice(index != -1 ? index : path.length, 0, web);
}

export function RemoveWeb(path: string, sep: string = '/') {
    const web = "WEB";
    let newPath = path.replace(sep + web, '');
    newPath = path == newPath ? path.replace(web + sep, '') : newPath;
    return newPath;
}


/**
 * Converts local file path to remote path using user config
 */

export function GetRemotePath(filePath: string, { remotePath, removeFromLocalPath }: UserConfig, addWeb = true) {
    const configPath = configManager.ConfigFilePath;

    let sourcePath = filePath != "" ? path.relative(configPath, filePath) : "";
    for (const remove of removeFromLocalPath || []) {
        sourcePath = sourcePath.replaceAll(path.sep + remove, '');
        sourcePath = sourcePath.replaceAll(remove + path.sep, '');
        sourcePath = sourcePath.replaceAll(remove, '');
    }
    sourcePath = sourcePath.length != 0 ? path.sep + sourcePath : sourcePath;
    const startPath = addWeb ? InsertWeb(remotePath) : remotePath;
    return (startPath + sourcePath).replaceAll(path.sep, '/');
}

export function IsSubDirectory(parent: string, child: string) {
    const relative = path.relative(parent, child);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Checks if the filepath is in the local path directory, folder starts with . and the file name is in ignore
 */
export async function ValidatePath(filePath: string, config: UserConfig): Promise<boolean> {
    //Outer file 
    if (!IsSubDirectory(configManager.ConfigFilePath, filePath)) return;
    let relativePath = path.relative(configManager.ConfigFilePath, filePath);
    if (config.include) {
        const include = ignore().add(config.include);
        if (include.ignores(relativePath))
            return true;
    }

    if (!config.ignore) return true;


    const ignor = ignore().add(config.ignore);
    return !ignor.ignores(relativePath);
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
        else {
            files.push(name);
        }
    }

    return files;
}

export interface SimpleFolder {
    path: string,
    files: string[],
    folders: SimpleFolder[],
}

export async function GetAllFilesInDirTree(startPath: string): Promise<SimpleFolder> {
    if (!await exists(startPath)) {
        return null;
    }
    const folder: SimpleFolder = { path: startPath, files: [], folders: [] };
    const directory = await readdir(startPath);
    const promises = [];
    for (const file of directory) {
        const name = path.join(startPath, file);
        const stat = await lstat(name);
        if (stat.isDirectory()) {
            promises.push(GetAllFilesInDirTree(name).then((cFolder) => {
                return folder.folders.push(cFolder);
            }));
        }
        else {
            folder.files.push(name);
        }
    }
    await Promise.all(promises);
    return folder;
}

