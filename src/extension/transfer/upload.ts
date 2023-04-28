import path = require("path");
import { readFile } from "fs-extra";
import { Uri } from "vscode";
import { saveFileService } from "../../miiservice/savefileservice";
import { UserConfig } from "../../modules/config";
import { GetAllFilesInDir, GetRemotePath } from "../../modules/file";
import { ShowConfirmMessage } from "../../modules/vscode";
import statusBar, { Icon } from "../../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";

export async function UploadFile(uri: Uri, content: string, userConfig: UserConfig) {
    if (!await Validate(userConfig, uri.fsPath)) {
        return false;
    }
    const fileName = uri.fsPath.substring(uri.fsPath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));
    if (!await DoesFileExist(sourcePath, userConfig) &&
        !await ShowConfirmMessage("File does not exists. Do you want to create it? \nFile: " + path.basename(sourcePath))) {
        return false;
    }


    statusBar.updateBar('Sending', Icon.spinLoading, { duration: -1 });
    await saveFileService.call({ host: userConfig.host, port: userConfig.port, body: "Content=" + base64Content }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    if (!await Validate(userConfig, folderPath)) {
        return false;
    }
    const sourcePath = GetRemotePath(folderPath, userConfig);
    if (!await DoesFolderExist(sourcePath, userConfig) &&
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
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}