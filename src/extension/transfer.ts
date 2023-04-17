import path = require("path");
import { TextDocument } from "vscode";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { UserConfig, validateConfig } from "../modules/config";
import { GetRemotePath, ValidatePath } from "../modules/file";
import { showConfirmMessage, showInputBox } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { listFoldersService } from "../miiservice/listfoldersservice";
import { saveFileService } from "../miiservice/savefileservice";

async function ValidateContext(userConfig: UserConfig, auth: string) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, options: { auth: auth } }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

async function FileExists(remoteFilePath: string, { host, port }: UserConfig, auth: string) {
    const file = await readFilePropertiesService.call({ host: host, port: port, options: { auth: auth } }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}

let gPassword: string;

export async function UploadFile(document: TextDocument, userConfig: UserConfig) {
    const filePath = document.fileName;
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);

    if (!userConfig.password?.trim().length && !gPassword) {
        const password = await showInputBox({ password: true, placeHolder: "Enter Password", title: "Password" });
        if (password) {
            userConfig.password = password;
            gPassword = password;
        }
        else {
            logger.info("No password given")
            return;
        }
    }
    else if(gPassword){
        userConfig.password = gPassword;
    }


    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Context doesn't exist");
        return;
    }
    if (!await FileExists(sourcePath, userConfig, auth) &&
        !await showConfirmMessage("File does not exists. Do you want to create it?")) {
        return;
    }


    statusBar.updateBar('Sending', Icon.spinLoading);
    await saveFileService.call({ host: userConfig.host, port: userConfig.port, options: { auth: auth, body: "Content=" + base64Content } }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}
