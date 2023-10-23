import * as path from 'path';
import { Uri } from "vscode";
import { System } from "../extension/system";
import { IsFatalResponse } from '../miiservice/abstract/filters';
import { blowoutService } from "../miiservice/blowoutservice";
import { deleteBatchService } from "../miiservice/deletebatchservice";
import { UserConfig } from "../modules/config";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import { DeleteComplexLimited } from './limited/deletecomplex';


export async function DeleteFile(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    if (!await DoesFileExist(sourcePath, system)) {
        logger.error('File does not exist.');
        return false;
    }

    if (!await ShowConfirmMessage('Are you sure you want to delete this file from the server? You can\'t undo this action.\nFile: ' + sourcePath)) {
        return;
    }

    statusBar.updateBar('Deleting', Icon.spinLoading, { duration: -1 });
    const response = await deleteBatchService.call({ host: system.host, port: system.port }, sourcePath);
    if (response && !IsFatalResponse(response)) {
        const fileName = path.basename(sourcePath);
        logger.infoplus(system.name, "Delete File", fileName + ": " + response?.Rowsets?.Messages?.Message);
        await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
    }
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}
export async function DeleteFolder(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    if (!await DoesFolderExist(sourcePath, system)) {
        logger.error('Folder does not exist.');
        return false;
    }

    if (!await ShowConfirmMessage('Are you sure you want to delete this folder from the server? You can\'t undo this action.\nFolder: ' + sourcePath)) {
        return;
    }

    statusBar.updateBar('Deleting', Icon.spinLoading, { duration: -1 });
    const response = await deleteBatchService.call({ host: system.host, port: system.port }, sourcePath);
    if (response && !IsFatalResponse(response)) {
        const folderName = path.basename(sourcePath);
        logger.infoplus(system.name, "Delete Folder", folderName + ": " + response?.Rowsets?.Messages?.Message);
        await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
    }
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}

/**
 * Uses Limited
 */
export async function DeleteUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    statusBar.updateBar('Deleting', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, processName, "Started");

    const folder = await PrepareUrisForService(uris);
    const response = await DeleteComplexLimited(folder, userConfig, system);

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Cancelled");
    }
    else {
        statusBar.updateBar('Deleted', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Completed");
    }
}