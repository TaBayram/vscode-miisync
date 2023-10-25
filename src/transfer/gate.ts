import * as path from 'path';
import { UserConfig } from "../extension/system";
import { System } from "../extension/system.js";
import { IsFatalResponse } from '../miiservice/abstract/filters.js';
import { existsService } from '../miiservice/existsservice.js';
import { listFoldersService } from "../miiservice/listfoldersservice.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import logger from "../ui/logger.js";
import { GetUserManager } from "../user/usermanager.js";

export async function DoesRemotePathExist(userConfig: UserConfig, { host, port }: System) {
    let folderPath = GetRemotePath("", userConfig);
    const response = await listFoldersService.call({ host: host, port: port }, folderPath);
    return response && !IsFatalResponse(response) ? response?.Rowsets?.Rowset?.Row?.length > 0 : false;
}

export async function DoesFileExist(remoteFilePath: string, { host, port }: System) {
    const response = await existsService.call({ host, port }, remoteFilePath);
    return response && !IsFatalResponse(response) ?  response?.Rowsets?.Messages?.Message == "1" : false;
}

export async function DoesFolderExist(remoteFilePath: string, { host, port }: System) {
    const response = await existsService.call({ host, port }, remoteFilePath);
    return response && !IsFatalResponse(response) ? response?.Rowsets?.Messages?.Message == "2": false;
}

export async function DoesProjectExist({ remotePath }: UserConfig, { host, port }: System) {
    const projectName = remotePath.split("/")[0].trim();
    if (projectName != "") {
        const response = await listFoldersService.call({ host, port }, projectName);
        if(response && !IsFatalResponse(response)){
            const hasWeb = response?.Rowsets?.Rowset?.Row?.find((folder) => folder.IsWebDir);
            return hasWeb != null;
        }
    }
    return false;
}


export async function ValidateLogin(system: System) {
    const userManager = GetUserManager(system, false);
    if (!userManager) { return false; }
    return await userManager.login();
}

/**
 * @param check 
 * @param check.login needs system 
 * @param check.project needs system
 * @returns 
 */
export async function Validate(config: UserConfig, { system, localPath }: { system?: System, localPath?: string }, check?: { login?: boolean, project?: boolean }): Promise<boolean> {
    const { login, project } = { ...{ login: true, project: true }, ...check };

    if (localPath && !await ValidatePath(localPath, config)) {
        logger.info(path.basename(localPath) + ": path is ignored.");
        return false;
    }
    if (login && system && !await ValidateLogin(system)) {
        logger.error("Session is not valid.");
        return false;
    }
    if (project && system && !await DoesProjectExist(config, system)) {
        logger.error("Project " + config.remotePath.split("/")[0].trim() + " doesn't exist.");
        return false;
    }

    return true;
}