import { outputFile, writeFile } from "fs-extra";
import { Uri } from "vscode";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { loadFilesInsideService } from "../../miiservice/loadfilesinsideservice";
import { readFileService } from "../../miiservice/readfileservice";
import { System, UserConfig } from "../../modules/config";
import { GetRemotePath } from "../../modules/file";
import { GetCurrentWorkspaceFolder } from "../../modules/vscode";
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

    const sourcePath = GetRemotePath(folderPath, userConfig);
    await DownloadFiles(system, sourcePath, (file: File) => {
        return folderPath + path.sep +
            (path.relative(sourcePath, file.FilePath) != '' ? path.relative(sourcePath, file.FilePath) + path.sep : '') +
            file.ObjectName;
    })

    statusBar.updateBar('Done', Icon.success, { duration: 1 });
    logger.info("Download Folder Completed");

}


export async function DownloadRemoteFolder(remoteFolderPath: string, userConfig: UserConfig, system: System) {
    if (!await Validate(userConfig, system)) {
        return false;
    }

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Remote Folder Started");
    const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;

    await DownloadFiles(system, remoteFolderPath, (file) => {
        return workspaceFolder + path.sep + path.basename(remoteFolderPath) + path.sep +
            (path.relative(remoteFolderPath, file.FilePath) != '' ? path.relative(remoteFolderPath, file.FilePath) + path.sep : '') +
            file.ObjectName;
    })
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
    logger.info("Download Remote Folder Completed");
}

async function DownloadFiles({ host, port }: System, sourcePath: string, getFilePath: (file: File) => string) {
    const directory: Directory = [];
    const parentPath = path.dirname(sourcePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);

    const root = rootFolders.Rowsets.Rowset.Row.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        directory.push(root);
        await Promise.all(await deep(root));
    }

    async function deep(mainFolder: Folder) {
        mainFolder.children = [];
        const files = await listFilesService.call({ host, port }, mainFolder.Path);

        let promises: Promise<any>[] = [];
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)
            promises.push(new Promise((resolve,reject)=>{
                const filePath = getFilePath(file);
                readFileService.call({ host, port }, file.FilePath + "/" + file.ObjectName).then((binary)=>{
                    const payload = binary.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
                    outputFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" }).then(()=>resolve('success')).catch((error)=> reject(error));
                });
                
            }));            
        }

        const folders = await listFoldersService.call({ host: host, port: port }, mainFolder.Path);
        await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
            mainFolder.children.push(folder);
            return deep(folder)
        }));

        return (promises);
    }
}



export async function DownloadContextDirectory(userConfig: UserConfig, system: System) {
    if (!userConfig.context) return;
    if (!await Validate(userConfig, system)) {
        return false;
    }
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");

    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Context Directory Started");
    const directory: Directory = [];


    const files = await loadFilesInsideService.call({ host: system.host, port: system.port }, sourcePath);
    remoteDirectoryTree.generateItemsByFiles(files?.Rowsets?.Rowset?.Row);
    statusBar.updateBar('Done', Icon.success, { duration: 2 });
    logger.info("Download Context Directory Completed");
    return;

    //UPPER METHOD IS MUCH FASTER BUT DOESN'T GET THE EMPTY FOLDERS

    const rootFolders = await listFoldersService.call({ host: system.host, port: system.port }, parentPath);

    const root = rootFolders.Rowsets.Rowset.Row.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        root.FolderName = userConfig.context;
        directory.push(root);
        Promise.resolve().then(function (n) {
            return DownloadDirDepth(root, system);
        }).then(function () {
            remoteDirectoryTree.generateItems(directory);
            logger.info("Download Context Directory Done")
            statusBar.updateBar('Done', Icon.success, { duration: 2 });
        });
    }
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
