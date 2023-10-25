import { pathExists, readFile } from 'fs-extra';
import * as path from 'path';
import { Uri } from "vscode";
import { System, UserConfig } from "../extension/system";
import { saveFileService } from "../miiservice/savefileservice";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { CheckSeverity, CheckSeverityFile, CheckSeverityFolder, SeverityOperation } from '../modules/severity';
import { ActionReturn, ActionType, StartAction } from './action';
import { Validate } from "./gate";
import { UploadComplexLimited } from './limited/uploadcomplex';

export async function UploadFile(uri: Uri, userConfig: UserConfig, system: System, content?: string) {
    if (!await Validate(userConfig, { system, localPath: uri.fsPath })) {
        return false;
    }
    const fileName = path.basename(uri.fsPath);
    const upload = async () => {
        if (!content) {
            const exists = await pathExists(uri.fsPath);
            if (!exists) {
                return { aborted: true, error: true, message: fileName + " doesn't exist" };
            }
            content = (await readFile(uri.fsPath)).toString();
        }
        if (!await CheckSeverityFile(uri, SeverityOperation.upload, userConfig, system)) return { aborted: true };

        const sourcePath = GetRemotePath(uri.fsPath, userConfig);
        const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));

        const response = await saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
        return { aborted: response == null };
    }
    StartAction(ActionType.upload, { name: "Upload File", resource: fileName, system }, { isSimple: true }, upload);
}

/**
 * Uses Limited
 */
export async function UploadFolder(folderUri: Uri, userConfig: UserConfig, system: System) {
    const folderPath = folderUri.fsPath;
    const folderName = path.basename(folderPath);
    if (!await Validate(userConfig, { system, localPath: folderPath })) { return null; }
    const upload = async () => {
        if (!await CheckSeverityFolder(folderUri, SeverityOperation.upload, userConfig, system)) return { aborted: true };

        const response = await UploadComplexLimited({ path: folderPath, files: [], folders: [] }, userConfig, system);
        return { aborted: response.aborted };
    }
    StartAction(ActionType.upload, { name: "Upload Folder", resource: folderName, system }, { isSimple: false }, upload);
}

/**
 * Uses Limited
 */
export async function UploadUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    const upload = async (): Promise<ActionReturn> => {
        const folder = await PrepareUrisForService(uris);

        if (!await CheckSeverity(folder, SeverityOperation.upload, userConfig, system)) return { aborted: true };

        const response = await UploadComplexLimited(folder, userConfig, system);
        return { aborted: response.aborted };
    }

    StartAction(ActionType.upload, { name: processName, system }, { isSimple: false }, upload);
}
