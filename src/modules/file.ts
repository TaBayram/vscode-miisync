import path = require("path");
import { UserConfig } from "./config";
import { exists, existsSync, lstat, lstatSync, readdir, readdirSync } from "fs-extra";
import logger from "../ui/logger";


export function GetRemotePath(filePath: string, userConfig: UserConfig) {
    let sourcePath = filePath.substring(filePath.indexOf(userConfig.context));
    for (const remove of userConfig.removeFromContext) {
        sourcePath = sourcePath.replace(remove + path.sep, '');
    }
    return (userConfig.remotePath + path.sep + sourcePath).replaceAll(path.sep, '/');
}

export function ValidatePath(filePath: string, userConfig: UserConfig): boolean {
    const firstFolderName = filePath.substring(filePath.lastIndexOf(path.sep, filePath.lastIndexOf(path.sep) - 1), filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');

    if (filePath.indexOf(userConfig.context) == -1 ||
        userConfig.ignore.findIndex((value) => value.toLocaleLowerCase() == fileName.toLocaleLowerCase()) != -1 ||
        firstFolderName.startsWith('.'))
        return false;


    logger.info('path validated');
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