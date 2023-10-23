import { pathExists, readFile } from 'fs-extra';
import * as path from 'path';
import { Uri } from "vscode";
import { System } from "../extension/system";
import { IsFatalResponse } from '../miiservice/abstract/filters';
import { saveFileService } from "../miiservice/savefileservice";
import { UserConfig } from "../modules/config";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import { UploadComplexLimited } from './limited/uploadcomplex';

export async function UploadFile(uri: Uri, userConfig: UserConfig, system: System, content?: string) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    if (!content) {
        const exists = await pathExists(uri.fsPath);
        if (!exists) {
            logger.error("Upload File: " + uri.fsPath + " doesn't exist");
            return false;
        }
        content = (await readFile(uri.fsPath)).toString();
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
    if (!IsFatalResponse(response) && response) {
        logger.infoplus(system.name, "Upload File", fileName + ": " + response?.Rowsets?.Messages?.Message);
    }
    statusBar.updateBar("Uploaded " + fileName, Icon.success, { duration: 3 });
}

/**
 * Uses Limited
 */
export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig, system: System, showConfirmation: boolean = false) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    const folderName = path.basename(folderPath);
    if (!await Validate(userConfig, { system, localPath: folderPath })) {
        return null;
    }
    const sourcePath = GetRemotePath(folderPath, userConfig);
    const folderExists = await DoesFolderExist(sourcePath, system);
    if (showConfirmation) {
        const message = folderExists ? 'Are you sure you want to upload ' + folderName + ' ?' : folderName + ' does not exists. Do you want to create it?';
        if (!await ShowConfirmMessage(message)) return null;
    }
    else if (!folderExists &&
        !await ShowConfirmMessage("Folder does not exists. Do you want to create it?")) {
        return null;
    }
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, "Upload Folder", folderName + ": Started");

    const response = await UploadComplexLimited({ path: folderPath, files: [], folders: [] }, userConfig, system);

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Upload Folder", folderName + ": Cancelled");
    }
    else {
        statusBar.updateBar('Uploaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Upload Folder", folderName + ": Completed");
    }

}

/**
 * Uses Limited
 */
export async function UploadUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, processName, "Started");

    const folder = await PrepareUrisForService(uris);
    const response = await UploadComplexLimited(folder, userConfig, system);

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Cancelled");
    }
    else {
        statusBar.updateBar('Uploaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Completed");
    }
}
