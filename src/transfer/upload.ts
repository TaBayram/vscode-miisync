import path = require("path");
import { Uri } from "vscode";
import { System } from "../extension/system";
import { saveFileService } from "../miiservice/savefileservice";
import { UserConfig } from "../modules/config";
import { GetRemotePath } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import { UploadFolderLimited } from "./limited/upload";

export async function UploadFile(uri: Uri, content: string, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system, uri.fsPath)) {
        return false;
    }
    const fileName = uri.fsPath.substring(uri.fsPath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));
    if (!await DoesFileExist(sourcePath, system) &&
        !await ShowConfirmMessage("File does not exists. Do you want to create it? \nFile: " + path.basename(sourcePath))) {
        return false;
    }


    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    const response = await saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
    if (response) {
        logger.infoplus(system.name,"Upload File", fileName + ": " + response?.Rowsets?.Messages?.Message);
    }
    statusBar.updateBar("Uploaded " + fileName, Icon.success, { duration: 3 });
}


export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig, system: System, showConfirmation: boolean = false) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    const folderName = path.basename(folderPath);
    if (!await Validate(userConfig, system, folderPath)) {
        return false;
    }
    const sourcePath = GetRemotePath(folderPath, userConfig);
    const folderExists = await DoesFolderExist(sourcePath, system);
    if (showConfirmation) {
        const message = folderExists ? 'Are you sure you want to upload ' + folderName + ' ?' : folderName + ' does not exists. Do you want to create it?';
        if(!await ShowConfirmMessage(message)) return;
    }
    else if (!folderExists && 
        !await ShowConfirmMessage("Folder does not exists. Do you want to create it?")) {
        return;
    }
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name,"Upload Folder", folderName + ": Started");

    const response = await UploadFolderLimited(folderPath, userConfig, system);

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name,"Upload Folder", folderName + ": Cancelled");
    }
    else {
        statusBar.updateBar('Uploaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name,"Upload Folder", folderName + ": Completed");
    }


}

