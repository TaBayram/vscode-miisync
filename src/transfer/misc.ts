import { Uri } from "vscode";
import { System, UserConfig } from "../extension/system";
import { IsFatalResponse } from "../miiservice/abstract/filters";
import { loadFileService } from "../miiservice/loadfileservice";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { GetRemotePath, ValidatePath } from "../modules/file";
import logger from "../ui/logger";
import { CreateTransactionMarkdown } from "../ui/markdown/transactionproperties";
import { filePropertiesTree } from "../ui/treeview/filepropertiestree";


export async function GetFileProperties(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await ValidatePath(uri.fsPath, userConfig)) return null;
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const response = await readFilePropertiesService.call(system, sourcePath);
    if (response && !IsFatalResponse(response) && response?.Rowsets?.Rowset?.Row) {
        filePropertiesTree.generateItems(response.Rowsets.Rowset.Row[0]);
        return response;
    }
    return null;
}

export async function GetTransactionProperties(path: string, system: System) {

    const response = await loadFileService.call(system, path);
    if ('Transaction' in response && response?.Transaction) {
        CreateTransactionMarkdown(response.Transaction);
    }
    else if ('Rowsets' in response) {
        logger.errorPlus(system.name, 'Transaction Properties', response.Rowsets.FatalError);
    }

    return null;
}