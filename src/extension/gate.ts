import { listFoldersService } from "../miiservice/listfoldersservice.js";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice.js";
import { UserConfig } from "../modules/config.js";
import { GetRemotePath } from "../modules/file.js";
import { showInputBox } from "../modules/vscode.js";
import logger from "../ui/logger.js";

export async function ValidateContext(userConfig: UserConfig, auth: string) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

export async function FileExists(remoteFilePath: string, { host, port }: UserConfig, auth: string) {
    const file = await readFilePropertiesService.call({ host, port, auth }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}


let gPassword: string;
export async function ValidatePassword(userConfig: UserConfig) {
    if (!userConfig.password?.trim().length && !gPassword) {
        const password = await showInputBox({ password: true, placeHolder: "Enter Password", title: "Password" });
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
