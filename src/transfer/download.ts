import { outputFile, writeFile } from "fs-extra";
import * as path from 'path';
import { Uri } from "vscode";
import { System, UserConfig } from "../extension/system";
import { IsFatalResponse } from "../miiservice/abstract/filters";
import { File, Folder } from "../miiservice/abstract/responsetypes";
import { loadFilesInsideService } from "../miiservice/loadfilesinsideservice";
import { readFileService } from "../miiservice/readfileservice";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { CheckSeverity, CheckSeverityFile, CheckSeverityFolder, SeverityOperation } from "../modules/severity";
import { GetCurrentWorkspaceFolder, ShowQuickPick } from "../modules/vscode";
import { remoteDirectoryTree } from "../ui/treeview/remotedirectorytree";
import { ActionReturn, ActionType, StartAction } from "./action";
import { DoesFileExist, Validate } from "./gate";
import { DownloadComplexLimited } from "./limited/downloadcomplex";


export async function DownloadFile(uri: Uri, userConfig: UserConfig, system: System) {
    const filePath = uri.fsPath;
    if (!await Validate(userConfig, { system, localPath: filePath })) {
        return false;
    }
    const fileName = path.basename(filePath);
    const download = async (): Promise<ActionReturn> => {
        const sourcePath = GetRemotePath(filePath, userConfig);
        if (!await DoesFileExist(sourcePath, system)) {
            return { aborted: true, error: true, message: fileName + " doesn't exist" };
        }
        if (!await CheckSeverityFile(uri, SeverityOperation.download, userConfig, system)) return { aborted: true };


        const file = await readFileService.call({ host: system.host, port: system.port }, sourcePath);
        if (!file) return { aborted: true };
        if (!IsFatalResponse(file)) {
            const payload = file?.Rowsets?.Rowset?.Row?.find((row) => row.Name == "Payload");
            await writeFile(filePath, Buffer.from(payload!.Value, 'base64'), { encoding: "utf8" })

            return { aborted: false };
        }
        return { aborted: true, error: true, message: file.Rowsets.FatalError };
    };

    StartAction(ActionType.download, { name: "Download File", resource: fileName, system }, { isSimple: true }, download);
}


export async function DownloadFolder(uri: Uri, userConfig: UserConfig, system: System) {
    const folderPath = uri.fsPath;
    if (!await Validate(userConfig, { system, localPath: folderPath })) {
        return false;
    }
    const folderName = path.basename(folderPath);
    const download = async (): Promise<ActionReturn> => {
        if (!await CheckSeverityFolder(uri, SeverityOperation.download, userConfig, system)) return { aborted: true };

        function getPath(item: File | Folder) {
            if ('FolderName' in item) {
                return folderPath + path.sep +
                    (path.relative(sourcePath, item.Path) != '' ? path.relative(sourcePath, item.Path) : '');
            }
            else {
                return folderPath + path.sep +
                    (path.relative(sourcePath, item.FilePath) != '' ? path.relative(sourcePath, item.FilePath) + path.sep : '') +
                    item.ObjectName;
            }
        }

        const sourcePath = GetRemotePath(folderPath, userConfig);
        const response = await DownloadComplexLimited({ files: [], folders: [], path: folderPath }, getPath, userConfig, system);
        return { aborted: response.aborted };
    };
    StartAction(ActionType.download, { name: "Download Folder", resource: folderName, system }, { isSimple: false }, download);
}

/**
 * Uses Limited
 */
export async function DownloadUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    const download = async (): Promise<ActionReturn> => {
        const folder = await PrepareUrisForService(uris);
        const folderPath = folder.path;
        const sourcePath = GetRemotePath(folderPath, userConfig);
        if (!await CheckSeverity(folder, SeverityOperation.download, userConfig, system)) return { aborted: true };

        function getPath(item: File | Folder) {
            if ('FolderName' in item) {
                return folderPath + path.sep +
                    (path.relative(sourcePath, item.Path) != '' ? path.relative(sourcePath, item.Path) : '');
            }
            else {
                return folderPath + path.sep +
                    (path.relative(sourcePath, item.FilePath) != '' ? path.relative(sourcePath, item.FilePath) + path.sep : '') +
                    item.ObjectName;
            }
        }
        const response = await DownloadComplexLimited(folder, getPath, userConfig, system);
        return { aborted: response.aborted };
    };
    StartAction(ActionType.download, { name: processName, system }, { isSimple: false }, download);
}


// Without local file

async function AskRemoteDownloadPathOptions(remoteObjectPath: string, { remotePath }: UserConfig) {
    const absolutePath = remoteObjectPath.trim();
    const basename = path.basename(remoteObjectPath).trim();
    const realPath = (path.relative(remotePath, remoteObjectPath.replace("/WEB", "")) || "").trim().replaceAll(path.sep, '/');
    const realWebPath = (path.relative(remotePath, remoteObjectPath) || "").trim().replaceAll(path.sep, '/');

    let options = [basename];
    if (!options.find((value) => value === realPath) && realPath != "") options.push(realPath);
    if (!options.find((value) => value === realWebPath) && realWebPath != "") options.push(realWebPath);
    if (!options.find((value) => value === absolutePath) && absolutePath != "") options.push(absolutePath);

    const result = options.length > 1 ? await ShowQuickPick(options, { title: "Download Where?" }) : options[0];
    return result != null ? result + path.sep : null;
}

export async function DownloadRemoteFolder(remoteFolderPath: string, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system })) {
        return false;
    }
    const chosenfolderPath = await AskRemoteDownloadPathOptions(remoteFolderPath, userConfig);
    if (chosenfolderPath == null) return;

    const folderName = path.basename(remoteFolderPath);
    const download = async (): Promise<ActionReturn> => {
        const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;

        function getPath(item: File | Folder) {
            if ('FolderName' in item) {
                return workspaceFolder + path.sep + chosenfolderPath +
                    (path.relative(remoteFolderPath, item.Path) != '' ? path.relative(remoteFolderPath, item.Path) : '');
            }
            else {
                return workspaceFolder + path.sep + chosenfolderPath +
                    (path.relative(remoteFolderPath, item.FilePath) != '' ? path.relative(remoteFolderPath, item.FilePath) + path.sep : '') +
                    item.ObjectName;
            }
        }
        const folder = { files: [], folders: [], path: remoteFolderPath, isRemotePath: true };
        if (!await CheckSeverity(folder, SeverityOperation.download, userConfig, system)) return { aborted: true };
        const response = await DownloadComplexLimited(folder, getPath, userConfig, system);

        return { aborted: response.aborted };
    };
    StartAction(ActionType.download, { name: "Download Remote Folder", resource: folderName, system }, { isSimple: false }, download);
}

export async function DownloadRemoteFile({ filePath, name }: { filePath: string, name: string }, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system })) {
        return false;
    }
    const chosenFilePath = await AskRemoteDownloadPathOptions(filePath, userConfig);
    if (chosenFilePath == null) return;

    const download = async (): Promise<ActionReturn> => {
        const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;

        const localFilePath = path.join(workspaceFolder, chosenFilePath, name);
        const binary = await readFileService.call({ host: system.host, port: system.port }, filePath + '/' + name);
        if (!binary) return { aborted: true };
        if (!IsFatalResponse(binary)) {
            const payload = binary?.Rowsets?.Rowset?.Row?.find((row) => row.Name == "Payload");
            if (payload) {
                await outputFile(localFilePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" });
            }
            return { aborted: false };
        }
        return { aborted: true, error: true, message: binary.Rowsets.FatalError };
    }
    StartAction(ActionType.download, { name: "Download Remote File", resource: name, system }, { isSimple: true }, download);
}

export async function DownloadContextDirectory(userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system })) {
        return false;
    }
    const download = async (): Promise<ActionReturn> => {
        const sourcePath = GetRemotePath("", userConfig);
        const files = await loadFilesInsideService.call({ host: system.host, port: system.port }, sourcePath);
        if (!files) return { aborted: true };
        if (!IsFatalResponse(files)) {
            remoteDirectoryTree.generateItemsByFiles(files?.Rowsets?.Rowset?.Row || []);
            return { aborted: false };
        }
        return { aborted: true, error: true, message: files.Rowsets.FatalError };
    }
    StartAction(ActionType.download, { name: "Download Context Directory", system }, { isSimple: false }, download);
}
