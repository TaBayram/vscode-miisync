/* For non file transfers */

import { Uri } from "vscode";
import { System } from "../extension/system";
import { blowoutService } from "../miiservice/blowoutservice";
import { deleteBatchService } from "../miiservice/deletebatchservice";
import { loadFileService } from "../miiservice/loadfileservice";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { UserConfig } from "../modules/config";
import { GetRemotePath, ValidatePath } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import logger from "../ui/logger";
import { CreateTransactionMarkdown } from "../ui/markdown/transactionproperties";
import statusBar, { Icon } from "../ui/statusbar";
import { filePropertiesTree } from "../ui/treeview/filepropertiestree";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import path = require("path");



export async function DeleteFile(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system, uri.fsPath)) {
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
    if (response) {
        const fileName = path.basename(sourcePath);
        logger.infoplus(system.name, "Delete File", fileName + ": " + response?.Rowsets?.Messages?.Message);
        await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
    }
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}
export async function DeleteFolder(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system, uri.fsPath)) {
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
    if (response) {
        const folderName = path.basename(sourcePath);
        logger.infoplus(system.name, "Delete Folder", folderName + ": " + response?.Rowsets?.Messages?.Message);
        await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
    }
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}

export async function GetFileProperties(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await ValidatePath(uri.fsPath, userConfig)) return null;
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const file = await readFilePropertiesService.call({ host: system.host, port: system.port }, sourcePath);
    if (file?.Rowsets?.Rowset?.Row) {
        filePropertiesTree.generateItems(file.Rowsets.Rowset.Row[0]);
        return file;
    }
    return null;
}

export async function GetTransactionProperties(path: string, system: System) {

    const response = await loadFileService.call({ host: system.host, port: system.port }, path);
    if ('Transaction' in response && response?.Transaction) {
        CreateTransactionMarkdown(response.Transaction);
    }
    else if ('Rowsets' in response) {
        logger.errorPlus(system.name, 'Transaction Properties', response.Rowsets.FatalError);
    }

    return null;
}