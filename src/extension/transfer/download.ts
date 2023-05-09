import { mkdir, outputFile, writeFile } from "fs-extra";
import { Uri } from "vscode";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { loadFilesInsideService } from "../../miiservice/loadfilesinsideservice";
import { readFileService } from "../../miiservice/readfileservice";
import { System, UserConfig } from "../../modules/config";
import { GetRemotePath } from "../../modules/file";
import { GetCurrentWorkspaceFolder, ShowQuickPick } from "../../modules/vscode";
import { remoteDirectoryTree } from "../../ui/explorer/remotedirectorytree";
import logger from "../../ui/logger";
import statusBar, { Icon } from "../../ui/statusbar";
import { DoesFileExist, Validate } from "./gate";
import path = require("path");


export async function DownloadFile(uri: Uri, userConfig: UserConfig, system: System) {
    const filePath = uri.fsPath;
    if (!await Validate(userConfig, system, filePath)) {
        return false;
    }
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);
    if (!await DoesFileExist(sourcePath, system)) {
        logger.error("File doesn't exist");
        return;
    }

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download File Started");

    const file = await readFileService.call({ host: system.host, port: system.port }, sourcePath);
    const payload = file.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
    await writeFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })

    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
    logger.info("Download File Completed");
}


export async function DownloadFolder(folderUri: Uri | string, userConfig: UserConfig, system: System) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    if (! await Validate(userConfig, system, folderPath)) {
        return false;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Folder Started");

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
    await DownloadFiles(system, sourcePath, getPath);

    statusBar.updateBar('Done', Icon.success, { duration: 1 });
    logger.info("Download Folder Completed");

}


export async function DownloadRemoteFolder(remoteFolderPath: string, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system)) {
        return false;
    }
    const realPath = path.relative(userConfig.remotePath, remoteFolderPath.replace("/WEB", "")) || "";

    const result = realPath != "" && realPath != path.basename(remoteFolderPath) ? await ShowQuickPick([path.basename(remoteFolderPath), realPath], { title: "Download Where?" }) : null;
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Remote Folder Started");
    const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;
    const folderPath = (result == realPath ? realPath : path.basename(remoteFolderPath)) + path.sep;

    function getPath(item: File | Folder) {
        if ('FolderName' in item) {
            return workspaceFolder + path.sep + folderPath +
                (path.relative(remoteFolderPath, item.Path) != '' ? path.relative(remoteFolderPath, item.Path) : '');
        }
        else {
            return workspaceFolder + path.sep + folderPath +
                (path.relative(remoteFolderPath, item.FilePath) != '' ? path.relative(remoteFolderPath, item.FilePath) + path.sep : '') +
                item.ObjectName;
        }
    }

    await DownloadFiles(system, remoteFolderPath, getPath);
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
    logger.info("Download Remote Folder Completed");
}

async function DownloadFiles({ host, port }: System, sourcePath: string, getPath: (item: File | Folder) => string) {
    const directory: Directory = [];
    const parentPath = path.dirname(sourcePath) == "." ? "" : path.dirname(sourcePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);

    const root = rootFolders?.Rowsets?.Rowset?.Row?.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        directory.push(root);
        await Promise.all(await deep(root));
    }
    else{
        logger.error("Root folder doesn't exist.")
    }

    async function deep(mainFolder: Folder) {
        mainFolder.children = [];
        if (mainFolder.ChildFileCount == 0 && mainFolder.ChildFolderCount == 0) {
            mkdir(getPath(mainFolder), { recursive: true });
            return;
        }
        let promises: Promise<any>[] = [];
        if (mainFolder.ChildFileCount != 0) {
            const files = await listFilesService.call({ host, port }, mainFolder.Path);

            for (const file of files?.Rowsets?.Rowset?.Row || []) {
                mainFolder.children.push(file)
                promises.push(new Promise((resolve, reject) => {
                    const filePath = getPath(file);
                    readFileService.call({ host, port }, file.FilePath + "/" + file.ObjectName).then((binary) => {
                        const payload = binary?.Rowsets?.Rowset?.Row.find((row) => row.Name == "Payload");
                        if(payload){
                            outputFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" }).then(() => resolve('success')).catch((error) => reject(error));
                        }
                    });

                }));
            }
        }
        if (mainFolder.ChildFolderCount != 0) {
            const folders = await listFoldersService.call({ host: host, port: port }, mainFolder.Path);
            await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
                if(folder.IsWebDir){
                    mainFolder.children.push(folder);
                    return deep(folder)
                }
                return;
            }));
        }




        return (promises);
    }
}



export async function DownloadContextDirectory(userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system)) {
        return false;
    }
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Context Directory Started");

    const files = await loadFilesInsideService.call({ host: system.host, port: system.port }, sourcePath);
    remoteDirectoryTree.generateItemsByFiles(files?.Rowsets?.Rowset?.Row);
    statusBar.updateBar('Done', Icon.success, { duration: 2 });
    logger.info("Download Context Directory Completed");
    return;

}


async function DownloadDirDepth(mainFolder: Folder, system: System) {
    mainFolder.children = [];

    const folders = await listFoldersService.call({ host: system.host, port: system.port }, mainFolder.Path);
    if (mainFolder.ChildFolderCount != 0) {
        await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
            mainFolder.children.push(folder);
            return DownloadDirDepth(folder, system)
        }));
    }

    if (mainFolder.ChildFileCount != 0) {
        const files = await listFilesService.call({ host: system.host, port: system.port }, mainFolder.Path);
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)
        }
    }
    return;
}
