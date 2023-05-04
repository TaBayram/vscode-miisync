import path = require("path");
import { readFile } from "fs-extra";
import { Uri } from "vscode";
import { saveFileService } from "../../miiservice/savefileservice";
import { System, UserConfig } from "../../modules/config";
import { GetAllFilesInDir, GetRemotePath, ValidatePath } from "../../modules/file";
import { ShowConfirmMessage } from "../../modules/vscode";
import logger from "../../ui/logger";
import statusBar, { Icon } from "../../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";

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


    statusBar.updateBar('Sending', Icon.spinLoading, { duration: -1 });
    await saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig, system: System) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    if (!await Validate(userConfig, system, folderPath)) {
        return false;
    }
    const sourcePath = GetRemotePath(folderPath, userConfig);
    if (!await DoesFolderExist(sourcePath, system) &&
        !await ShowConfirmMessage("Folder does not exists. Do you want to create it?")) {
        return;
    }
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.info("Upload Folder Started");
    const files = await GetAllFilesInDir(folderPath);
    const promises: Promise<any>[] = [];

    for (const file of files) {
        if(!await ValidatePath(file, userConfig)) continue;
        promises.push(readFile(file).then((content)=>{
            const sourcePath = GetRemotePath(file, userConfig);
            const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
            return saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
        }));
    }
    await Promise.all(promises);
    logger.info("Upload Folder Completed");
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}