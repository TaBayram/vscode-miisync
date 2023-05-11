import path = require("path");
import { listFoldersService } from "../../miiservice/listfoldersservice.js";
import { readFilePropertiesService } from "../../miiservice/readfilepropertiesservice.js";
import { System, UserConfig } from "../../modules/config.js";
import { GetRemotePath, ValidatePath } from "../../modules/file.js";
import logger from "../../ui/logger.js";
import { GetUserManager } from "../../user/usermanager.js";

export async function DoesRemotePathExist(userConfig: UserConfig, { host, port }: System) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: host, port: port }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFileExist(remoteFilePath: string, { host, port }: System) {
    const file = await readFilePropertiesService.call({ host, port }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFolderExist(remoteFilePath: string, { host, port }: System) {
    const parentPath = path.dirname(remoteFilePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);
    const root = rootFolders.Rowsets.Rowset.Row.find((folder) => folder.Path == remoteFilePath);
    return root != null;
}


export async function ValidatePassword(system: System) {
    const userManager = GetUserManager(system, false);
    if (!userManager) {return;}
    if (userManager.Session.IsLoggedin) {return true;}
    return await userManager.login();
}


export async function Validate(config: UserConfig, system: System, localPath?: string, ignore?: { password?: boolean, remotePath?: boolean }): Promise<boolean> {
    if (localPath && !await ValidatePath(localPath, config)) {
        logger.info(path.basename(localPath) + " local path is not valid.");
        return false;
    }
    if (!await ValidatePassword(system) && !(ignore?.password)) {
        logger.error("Password is not valid.");
        return false;
    }

    if (!await DoesRemotePathExist(config, system) && !(ignore?.remotePath)) {
        logger.error("Remote path doesn't exist.");
        return false;
    }

    return true;
}