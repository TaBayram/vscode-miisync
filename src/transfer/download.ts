import { outputFile, writeFile } from "fs-extra";
import * as path from 'path';
import { Uri } from "vscode";
import { System } from "../extension/system";
import { IsFatalResponse } from "../miiservice/abstract/filters";
import { File, Folder } from "../miiservice/abstract/responsetypes";
import { loadFilesInsideService } from "../miiservice/loadfilesinsideservice";
import { readFileService } from "../miiservice/readfileservice";
import { UserConfig } from "../modules/config";
import { GetRemotePath, PrepareUrisForService } from "../modules/file";
import { GetCurrentWorkspaceFolder, ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { remoteDirectoryTree } from "../ui/treeview/remotedirectorytree";
import { DoesFileExist, Validate } from "./gate";
import { DownloadComplexLimited } from "./limited/downloadcomplex";


export async function DownloadFile(uri: Uri, userConfig: UserConfig, system: System) {
    const filePath = uri.fsPath;
    if (!await Validate(userConfig, { system, localPath: filePath })) {
        return false;
    }
    const fileName = path.basename(filePath);
    const sourcePath = GetRemotePath(filePath, userConfig);
    if (!await DoesFileExist(sourcePath, system)) {
        logger.error("File doesn't exist");
        return;
    }

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });

    const file = await readFileService.call({ host: system.host, port: system.port }, sourcePath);
    if (!IsFatalResponse(file)) {
        const payload = file.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
        await writeFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })
    }

    statusBar.updateBar("Downloaded " + fileName, Icon.success, { duration: 3 });
    logger.infoplus(system.name, 'Download File', fileName + ": Finished.");
}


export async function DownloadFolder(folderUri: Uri | string, userConfig: UserConfig, system: System) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    if (!await Validate(userConfig, { system, localPath: folderPath })) {
        return false;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, "Download Folder", path.basename(folderPath) + ": Started");

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

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Download Folder", path.basename(folderPath) + ": Cancelled");
    }
    else {
        statusBar.updateBar('Downloaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Download Folder", path.basename(folderPath) + ": Completed");
    }
}

/**
 * Uses Limited
 */
export async function DownloadUris(uris: Uri[], userConfig: UserConfig, system: System, processName: string) {
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, processName, "Started");

    const folder = await PrepareUrisForService(uris);
    const folderPath = folder.path;
    const sourcePath = GetRemotePath(folderPath, userConfig);

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

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Cancelled");
    }
    else {
        statusBar.updateBar('Uploaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name, processName, "Completed");
    }
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
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, "Download Remote Folder", folderName + ": Started");
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

    const response = await DownloadComplexLimited({ files: [], folders: [], path: remoteFolderPath, isRemotePath: true }, getPath, userConfig, system);

    if (response.aborted) {
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Download Remote Folder", folderName + ": Cancelled");
    }
    else {
        statusBar.updateBar('Downloaded', Icon.success, { duration: 1 });
        logger.infoplus(system.name, "Download Remote Folder", folderName + ": Completed");
    }


}

export async function DownloadRemoteFile({ filePath, name }: { filePath: string, name: string }, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system })) {
        return false;
    }

    const chosenFilePath = await AskRemoteDownloadPathOptions(filePath, userConfig);
    if (chosenFilePath == null) return;

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;

    const localFilePath = path.join(workspaceFolder, chosenFilePath, name);
    const binary = await readFileService.call({ host: system.host, port: system.port }, filePath + '/' + name);
    if (!IsFatalResponse(binary)) {
        const payload = binary?.Rowsets?.Rowset?.Row.find((row) => row.Name == "Payload");
        if (payload) {
            await outputFile(localFilePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" });
        }
    }

    statusBar.updateBar('Downloaded', Icon.success, { duration: 1 });
    logger.infoplus(system.name, 'Download Remote File', name + ": Finished.");
}

export async function DownloadContextDirectory(userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, { system })) {
        return false;
    }
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.infoplus(system.name, "Download Context Directory", sourcePath + ": Started");

    const files = await loadFilesInsideService.call({ host: system.host, port: system.port }, sourcePath);
    if(!IsFatalResponse(files)){
        remoteDirectoryTree.generateItemsByFiles(files?.Rowsets?.Rowset?.Row);
    }
    statusBar.updateBar('Downloaded', Icon.success, { duration: 2 });
    logger.infoplus(system.name, "Download Context Directory", sourcePath + ": Completed");
}
