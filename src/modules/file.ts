
import { exists, lstat, readdir } from "fs-extra";
import ignore from "ignore";
import * as path from 'path';
import { Uri } from "vscode";
import '../extends/string.js';
import { UserConfig } from "../extension/system.js";
import { SimpleFolder, SimplePreFolder } from "../types/miisync.js";
import { configManager } from "./config.js";

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
    return (relative != '' && !relative.startsWith('..') && !path.isAbsolute(relative));
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
            folder.files.push({path: name});
        }
    }
    await Promise.all(promises);
    return folder;
}



export async function PrepareUrisForService(uris: Uri[]): Promise<SimpleFolder> {

    /**
     * filters child paths (example: if /Folder and /Folder/file is present, we do not need /Folder/file since /Folder will include it anyway)
     * puts uris inside their parent folder.
     * finds the root folder path
     */
    const uriFolders: { uris: Uri[], path: string }[] = [];
    let rootFolderPath: string = uris[0].fsPath;
    for (let x = 0; x < uris.length; x++) {
        const uriX = uris[x];
        let hasParent = false;
        for (let y = 0; y < uris.length; y++) {
            const uriY = uris[y];
            if (uriX == uriY) continue;
            hasParent = IsSubDirectory(uriY.fsPath, uriX.fsPath);
            if (hasParent) break;
        }
        if (!hasParent) {
            const directoryName = path.dirname(uriX.fsPath);
            if (IsSubDirectory(directoryName, path.dirname(rootFolderPath))) {
                rootFolderPath = uriX.fsPath;
            }

            const folder = uriFolders.find((folder) => folder.path == directoryName);
            if (folder)
                folder.uris.push(uriX);
            else {
                uriFolders.push({ path: directoryName, uris: [uriX] })
            }
        }
    }


    /**
     * creates simplefolder tree structure and pushes the uris inside for processing 
     */
    const rootFolder: SimplePreFolder = { folders: [], files: [], uris: [], path: path.dirname(rootFolderPath) };
    for (let index = 0; index < uriFolders.length; index++) {
        const uriFolder = uriFolders[index];
        const folders = path.relative(rootFolder.path, uriFolder.path).split(path.sep);
        let depthFolder = rootFolder;
        if (folders.length != 1 || folders[0] != '') {
            for (let depth = 0; depth < folders.length; depth++) {
                const folder = folders[depth];
                const folderPath = path.join(depthFolder.path, folder);
                const index = depthFolder.folders.findIndex((fFolder) => fFolder.path == folderPath);
                if (index != -1) {
                    depthFolder = depthFolder.folders[index];
                }
                else {
                    const newFolder = { files: [], folders: [], path: folderPath, uris: [] };
                    depthFolder.folders.push(newFolder);
                    depthFolder = newFolder;
                }
            }
        }
        depthFolder.uris.push(...uriFolder.uris)
    }

    /**
     * changes uris to file or folder type
     */
    await findAllTypes(rootFolder);
    async function findAllTypes(mainFolder: SimplePreFolder) {
        const promises: Promise<any>[] = [];
        for (const folder of mainFolder.folders) {
            promises.push(findType(folder));
        }
        promises.push(findType(mainFolder));
        await Promise.all(promises);
    }
    async function findType(folder: SimplePreFolder) {
        if (!folder.uris) return 0;
        for (const uri of folder.uris) {
            try {
                const stat = await lstat(uri.fsPath);
                if (stat.isDirectory()) {
                    folder.folders.push({ files: [], folders: [], path: uri.fsPath });
                }
                else {
                    folder.files.push({path: uri.fsPath});
                }
            } catch (error) {
                
            }
        }
        folder.uris = undefined;
        return folder.files.length + folder.folders.length;
    }




    return rootFolder;
}