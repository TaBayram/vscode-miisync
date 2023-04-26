import path = require("path");
import { listFoldersService } from "../../miiservice/listfoldersservice.js";
import { readFilePropertiesService } from "../../miiservice/readfilepropertiesservice.js";
import { UserConfig } from "../../modules/config.js";
import { GetRemotePath } from "../../modules/file.js";
import { ShowInputBox } from "../../modules/vscode.js";
import logger from "../../ui/logger.js";
import { Session } from "../session.js";

export async function ValidateContext(userConfig: UserConfig, auth: string) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port}, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFileExist(remoteFilePath: string, { host, port }: UserConfig, auth: string) {
    const file = await readFilePropertiesService.call({ host, port}, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function DoesFolderExist(remoteFilePath: string, { host, port }: UserConfig, auth: string) {
    const parentPath = path.dirname(remoteFilePath);
    const rootFolders = await listFoldersService.call({ host, port}, parentPath);
    const root = rootFolders.Rowsets.Rowset.Row.find((folder) => folder.Path == remoteFilePath);
    return root != null;
}


let gPassword: string;
export async function ValidatePassword(userConfig: UserConfig) {
    if(Session.Instance.HasMIICookies) return true;

    if (!userConfig.password?.trim().length && !gPassword) {
        const password = await ShowInputBox({ password: true, placeHolder: "Enter Password", title: "Password" });
        if (password) {
            userConfig.password = password;
            gPassword = password;
        }
        else {
            logger.info("No password given")
            return false;
        }
    }
    else if (userConfig.password == null && gPassword) {
        userConfig.password = gPassword;
    }
    return true;
}
