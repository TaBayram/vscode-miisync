import path = require("path");
import { TextDocument, Uri } from "vscode";
import { saveFileService } from "../../miiservice/savefileservice";
import { UserConfig, configManager } from "../../modules/config";
import { ValidatePath, GetRemotePath, GetAllFilesInDir } from "../../modules/file";
import { ShowConfirmMessage } from "../../modules/vscode";
import logger from "../../ui/logger";
import statusBar, { Icon } from "../../ui/statusbar";
import { ValidatePassword, ValidateContext, DoesFileExist, DoesFolderExist } from "./gate";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { outputFile, read, readFile } from "fs-extra";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { readFileService } from "../../miiservice/readfileservice";

export async function UploadFile(document: TextDocument, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const filePath = document.fileName;

    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }

    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);

    if (!ValidatePassword(userConfig)) return;

    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    if (!await DoesFileExist(sourcePath, userConfig, auth) &&
        !await ShowConfirmMessage("File does not exists. Do you want to create it?")) {
        return;
    }


    statusBar.updateBar('Sending', Icon.spinLoading);
    await saveFileService.call({ host: userConfig.host, port: userConfig.port, body: "Content=" + base64Content }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(folderPath, userConfig)) return;
    if (!ValidatePassword(userConfig)) return;
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    const sourcePath = GetRemotePath(folderPath, userConfig);
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    if (!await DoesFolderExist(sourcePath, userConfig, auth) &&
        !await ShowConfirmMessage("Folder does not exists. Do you want to create it?")) {
        return;
    }
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });

    const files = await GetAllFilesInDir(folderPath);

    for (const file of files) {
        let content = await readFile(file);
        const sourcePath = GetRemotePath(file, userConfig);
        const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
        await saveFileService.call({ host: userConfig.host, port: userConfig.port, body: "Content=" + base64Content }, sourcePath);
    }

    //UploadFiles(userConfig, auth, sourcePath)

    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}