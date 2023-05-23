import path = require("path");
import { listFoldersService } from "../miiservice/listfoldersservice.js";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice.js";
import { SystemConfig, UserConfig } from "../modules/config.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import logger from "../ui/logger.js";
import { GetUserManager } from "../user/usermanager.js";

export async function DoesRemotePathExist(userConfig: UserConfig, { host, port }: SystemConfig) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: host, port: port }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFileExist(remoteFilePath: string, { host, port }: SystemConfig) {
    const file = await readFilePropertiesService.call({ host, port }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFolderExist(remoteFilePath: string, { host, port }: SystemConfig) {
    const parentPath = path.dirname(remoteFilePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);
    const root = rootFolders.Rowsets.Rowset.Row.find((folder) => folder.Path == remoteFilePath);
    return root != null;
}

export async function DoesProjectExist({ remotePath }: UserConfig, { host, port }: SystemConfig) {
    const projectName = remotePath.split("/")[0].trim();
    if (projectName != "") {
        const folders = await listFoldersService.call({ host, port }, projectName);
        const hasWeb = folders?.Rowsets?.Rowset?.Row?.find((folder) => folder.IsWebDir);
        return hasWeb != null;
    }
    return false;
}


export async function ValidateLogin(system: SystemConfig) {
    const userManager = GetUserManager(system, false);
    if (!userManager) { return false; }
    return await userManager.login();
}


export async function Validate(config: UserConfig, system: SystemConfig, localPath?: string, ignore?: { login?: boolean, remotePath?: boolean, logged?: boolean }): Promise<boolean> {
    if (localPath && !await ValidatePath(localPath, config)) {
        logger.info(path.basename(localPath) + " local path is not valid.");
        return false;
    }
    if (!(ignore?.login) && !await ValidateLogin(system)) {
        logger.error("Session is not valid.");
        return false;
    }
    if (!(ignore?.remotePath) && !await DoesProjectExist(config, system)) {
        logger.error("Project " + config.remotePath.split("/")[0].trim() + " doesn't exist.");
        return false;
    }

    /* if (!(ignore?.remotePath) && !await DoesRemotePathExist(config, system)) {
        logger.error("Remote path doesn't exist.");
        return false;
    } */

    return true;
}