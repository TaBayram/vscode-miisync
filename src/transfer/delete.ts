import * as path from 'path';
import { Uri } from "vscode";
import { System, UserConfig } from "../extension/system";
import { IsFatalResponse } from '../miiservice/abstract/filters';
import { blowoutService } from "../miiservice/blowoutservice";
import { deleteBatchService } from "../miiservice/deletebatchservice";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { CheckSeverity, CheckSeverityFile, CheckSeverityFolder, SeverityOperation } from '../modules/severity';
import { ActionReturn, ActionType, StartAction } from './action';
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import { DeleteComplexLimited } from './limited/deletecomplex';


export async function DeleteFile(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    const fileName = path.basename(uri.fsPath);
    const deleteR = async (): Promise<ActionReturn> => {
        const sourcePath = GetRemotePath(uri.fsPath, userConfig);
        if (!await DoesFileExist(sourcePath, system)) {
            return { aborted: true, error: true, message: fileName + " doesn't exist" };
        }
        if (!await CheckSeverityFile(uri, SeverityOperation.delete, userConfig, system)) return { aborted: true };

        const response = await deleteBatchService.call({ host: system.host, port: system.port }, sourcePath);
        if (!response) return { aborted: true };
        if (!IsFatalResponse(response)) {
            await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
            return { aborted: false };
        }
        return { aborted: true, error: true, message: response.Rowsets.FatalError };
    }
    StartAction(ActionType.delete, { name: "Delete File", resource: fileName, system }, { isSimple: true }, deleteR);
}
export async function DeleteFolder(uri: Uri, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    const folderName = path.basename(uri.fsPath);
    const deleteR = async (): Promise<ActionReturn> => {
        const sourcePath = GetRemotePath(uri.fsPath, userConfig);
        if (!await DoesFolderExist(sourcePath, system)) {
            return { aborted: true, error: true, message: folderName + " doesn't exist" };
        }
        if (!await CheckSeverityFolder(uri, SeverityOperation.delete, userConfig, system)) return { aborted: true };


        const response = await deleteBatchService.call({ host: system.host, port: system.port }, sourcePath);
        if (!response) return { aborted: true };
        if (!IsFatalResponse(response)) {
            await blowoutService.call({ host: system.host, port: system.port }, sourcePath);
            return { aborted: false };
        }
        return { aborted: true, error: true, message: response.Rowsets.FatalError };
    };
    StartAction(ActionType.delete, { name: "Delete Folder", resource: folderName, system }, { isSimple: false }, deleteR);
}

/**
 * Uses Limited
 */
export async function DeleteUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    const deleteR = async (): Promise<ActionReturn> => {
        const folder = await PrepareUrisForService(uris);
        if (!await CheckSeverity(folder, SeverityOperation.delete, userConfig, system)) return { aborted: true };;
        const response = await DeleteComplexLimited(folder, userConfig, system);
        return { aborted: response.aborted };
    };
    StartAction(ActionType.delete, { name: processName, system }, { isSimple: false }, deleteR);

}