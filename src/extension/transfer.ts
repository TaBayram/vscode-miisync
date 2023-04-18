import path = require("path");
import { TextDocument, Uri } from "vscode";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { UserConfig, validateConfig } from "../modules/config";
import { GetRemotePath, ValidatePath } from "../modules/file";
import { showConfirmMessage, showInputBox } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { listFoldersService } from "../miiservice/listfoldersservice";
import { saveFileService } from "../miiservice/savefileservice";
import { readFileService } from "../miiservice/readfileservice";
import { writeFile } from "fs-extra";

async function ValidateContext(userConfig: UserConfig, auth: string) {
    let folderPath = GetRemotePath("", userConfig);
    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, folderPath);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}

async function FileExists(remoteFilePath: string, { host, port }: UserConfig, auth: string) {
    const file = await readFilePropertiesService.call({ host, port, auth }, remoteFilePath);
    return file?.Rowsets?.Rowset?.Row?.length > 0;
}


let gPassword: string;
async function ValidatePassword(userConfig:UserConfig) {
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



export async function UploadFile(document: TextDocument, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading);
    const filePath = document.fileName;
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);

    if(!ValidatePassword(userConfig)) return;

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
    await saveFileService.call({ host: userConfig.host, port: userConfig.port, auth, body: "Content=" + base64Content }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function DownloadFile(uri: Uri, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading);
    const filePath = uri.fsPath;
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);

    if(!ValidatePassword(userConfig)) return;

    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Context doesn't exist");
        return;
    }
    if (!await FileExists(sourcePath, userConfig, auth)) {
        logger.error("File doesn't exist");
        return;
    }


    statusBar.updateBar('Downloading', Icon.spinLoading);
    const file = await readFileService.call({ host: userConfig.host, port: userConfig.port, auth }, sourcePath);
    const payload = file.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
    await writeFile(filePath, Buffer.from(payload.Value, 'base64'), {encoding:"utf8"})
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}
