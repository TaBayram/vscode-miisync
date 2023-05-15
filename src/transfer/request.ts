/* For non file transfers */

import { Uri } from "vscode";
import { deleteBatchService } from "../miiservice/deletebatchservice";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { SystemConfig, UserConfig } from "../modules/config";
import { GetRemotePath, ValidatePath } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import { filePropertiesTree } from "../ui/explorer/filepropertiestree";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { DoesFileExist, Validate } from "./gate";
import path = require("path");



export async function DeleteFile(uri: Uri, userConfig: UserConfig, system: SystemConfig) {
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
        logger.infos("Delete File", fileName + " : " + response?.Rowsets?.Messages?.Message);
    }
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}


export async function GetFileProperties(uri: Uri, userConfig: UserConfig, system: SystemConfig) {
    if (!await ValidatePath(uri.fsPath, userConfig)) return null;
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const file = await readFilePropertiesService.call({ host: system.host, port: system.port }, sourcePath);
    if (file?.Rowsets?.Rowset?.Row) {
        filePropertiesTree.generateItems(file.Rowsets.Rowset.Row[0]);
        return file;
    }
    return null;
}