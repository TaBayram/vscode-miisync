/* For non file transfers */

import { Uri } from "vscode";
import { readFilePropertiesService } from "../../miiservice/readfilepropertiesservice";
import { ValidatePath, GetRemotePath } from "../../modules/file";
import { fileProperties } from "../../ui/explorer/filepropertiestree";
import { UserConfig } from "../../modules/config";
import statusBar, { Icon } from "../../ui/statusbar";
import { DoesFileExist, Validate } from "./gate";
import { ShowConfirmMessage } from "../../modules/vscode";
import logger from "../../ui/logger";
import { deleteBatchService } from "../../miiservice/deletebatchservice";



export async function DeleteFile(uri: Uri, userConfig: UserConfig) {
    if (!await Validate(userConfig, uri.fsPath)) {
        return false;
    }
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    if (!await DoesFileExist(sourcePath, userConfig)) {
        logger.error('File does not exist.');
        return false;
    }

    if (!await ShowConfirmMessage('Are you sure you want to delete this file from the server? You can\'t undo this action.\nFile: ' + sourcePath)) {
        return;
    }

    statusBar.updateBar('Deleting', Icon.spinLoading, { duration: -1 });
    await deleteBatchService.call({ host: userConfig.host, port: userConfig.port }, sourcePath);
    statusBar.updateBar('Deleted', Icon.success, { duration: 1 })

}


export async function GetFileProperties(uri: Uri, userConfig: UserConfig) {
    if (!ValidatePath(uri.fsPath, userConfig)) return null;
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const file = await readFilePropertiesService.call({ host: userConfig.host, port: userConfig.port }, sourcePath);
    if (file?.Rowsets?.Rowset?.Row) {
        fileProperties.generateItems(file.Rowsets.Rowset.Row[0]);
        return file;
    }
    return null;
}