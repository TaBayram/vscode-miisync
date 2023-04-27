import path = require("path");
import { listFoldersService } from "../../miiservice/listfoldersservice.js";
import { readFilePropertiesService } from "../../miiservice/readfilepropertiesservice.js";
import { UserConfig, configManager } from "../../modules/config.js";
import { GetRemotePath, ValidatePath } from "../../modules/file.js";
import logger from "../../ui/logger.js";
import { Session } from "../../user/session.js";
import { userManager } from "../../user/usermanager.js";

export async function DoesRemotePathExist(userConfig: UserConfig) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFileExist(remoteFilePath: string, { host, port }: UserConfig) {
    const file = await readFilePropertiesService.call({ host, port }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFolderExist(remoteFilePath: string, { host, port }: UserConfig) {
    const parentPath = path.dirname(remoteFilePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);
    const root = rootFolders.Rowsets.Rowset.Row.find((folder) => folder.Path == remoteFilePath);
    return root != null;
}


export async function ValidatePassword(userConfig: UserConfig) {
    if (Session.Instance.IsLoggedin) return true;
    return await userManager.login();
}


export async function Validate(userConfig: UserConfig, localPath?: string, ignore?: { password?: boolean, remotePath?: boolean }): Promise<boolean> {
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError);
        return false;
    }
    if (localPath && !ValidatePath(localPath, userConfig)) {
        return false;
    }
    if (!await ValidatePassword(userConfig) && !(ignore?.password)) {
        return false;
    }

    if (!await DoesRemotePathExist(userConfig) && !(ignore?.remotePath)) {
        logger.error("Remote path doesn't exist.");
        return false;
    }

    return true;
}