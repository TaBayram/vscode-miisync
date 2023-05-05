
import { exists, lstat, readdir } from "fs-extra";
import '../extends/string.js';
import { UserConfig, configManager } from "./config.js";
import path = require("path");
import micromatch = require("micromatch");

export function InsertWeb(path: string) {
    const web = "/WEB";
    const index = path.indexOf('/');
    return path.splice(index != -1 ? index : path.length, 0, web);
}

/**
 * Converts local file path to remote path using user config
 */

//C:\Users\10121950\Desktop\Projects\MES\BABY\adminPanel\webapp\ts.js
export function GetRemotePath(filePath: string, { remotePath, removeFromLocalPath: removeFromContext }: UserConfig, addWeb = true) {
    const configPath = configManager.ConfigFilePath;

    let sourcePath = filePath != "" ?  path.relative(configPath, filePath) : "";
    for (const remove of removeFromContext || []) {
        sourcePath = sourcePath.replace(path.sep + remove, '');
        sourcePath = sourcePath.replace(remove + path.sep, '');
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
    //Outer file || dot check
    if (!IsSubDirectory(configManager.ConfigFilePath, filePath) || !micromatch.isMatch(filePath, "**")) return false;
    if (!config.ignore) {
        return true;
    }
    const stat = await lstat(filePath);
    if (stat.isDirectory()) {
        return !micromatch.isMatch(filePath, config.ignore);
    }
    else {
        return !micromatch.isMatch(filePath, config.ignore, { basename: true }) || micromatch.isMatch(filePath, config.ignore);
    }
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