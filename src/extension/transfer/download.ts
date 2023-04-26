import { outputFile, writeFile } from "fs-extra";
import { Uri } from "vscode";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { loadFilesInsideService } from "../../miiservice/loadfilesinsideservice";
import { readFileService } from "../../miiservice/readfileservice";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { UserConfig, configManager } from "../../modules/config";
import { GetRemotePath, ValidatePath } from "../../modules/file";
import { GetCurrentWorkspaceFolder } from "../../modules/vscode";
import { remoteDirectoryTree } from "../../ui/explorer/remotedirectorytree";
import logger from "../../ui/logger";
import statusBar, { Icon } from "../../ui/statusbar";
import { DoesFileExist, ValidateContext, ValidatePassword } from "./gate";
import path = require("path");

export async function DownloadFile(uri: Uri, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const filePath = uri.fsPath;
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);

    if (!ValidatePassword(userConfig)) return;
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    if (!await DoesFileExist(sourcePath, userConfig, auth)) {
        logger.error("File doesn't exist");
        return;
    }


    statusBar.updateBar('Downloading', Icon.spinLoading);
    const file = await readFileService.call({ host: userConfig.host, port: userConfig.port}, sourcePath);
    const payload = file.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
    await writeFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function DownloadFolder(folderUri: Uri | string, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(folderPath, userConfig)) return;
    if (!ValidatePassword(userConfig)) return;
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    const sourcePath = GetRemotePath(folderPath, userConfig);

    DownloadFiles(userConfig, auth, sourcePath, (file: File) => {
        return folderPath + path.sep +
            (path.relative(sourcePath, file.FilePath) != '' ? path.relative(sourcePath, file.FilePath) + path.sep : '') +
            file.ObjectName;
    })

    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}


export async function DownloadRemoteFolder(remoteFolderPath: string, userConfig: UserConfig,) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePassword(userConfig)) return;
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });

    const workspaceFolder = GetCurrentWorkspaceFolder().fsPath;

    DownloadFiles(userConfig, auth, remoteFolderPath, (file) => {
        return workspaceFolder + path.sep + path.basename(remoteFolderPath) + path.sep +
            (path.relative(remoteFolderPath, file.FilePath) != '' ? path.relative(remoteFolderPath, file.FilePath) + path.sep : '') +
            file.ObjectName;
    })
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}

async function DownloadFiles({ host, port }: UserConfig, auth: string, sourcePath: string, getFilePath: (file: File) => string) {
    const directory: Directory = [];

    const parentPath = path.dirname(sourcePath);

    const rootFolders = await listFoldersService.call({ host, port}, parentPath);

    const root = rootFolders.Rowsets.Rowset.Row.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        directory.push(root);
        await deep(root);
    }

    async function deep(mainFolder: Folder) {
        mainFolder.children = [];
        const files = await listFilesService.call({ host, port}, mainFolder.Path);
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)

            const filePath = getFilePath(file);
            const fileBinary = await readFileService.call({ host, port}, file.FilePath + "/" + file.ObjectName);
            const payload = fileBinary.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
            outputFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })
        }


        const folders = await listFoldersService.call({ host: host, port: port}, mainFolder.Path);
        for (const folder of folders?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(folder);
            await deep(folder);
        }
    }
}



export async function DownloadContextDirectory(userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    if (!userConfig.context) return;
    if (!ValidatePassword(userConfig)) return;
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });
    logger.info("Download Context Directory Starting")
    const directory: Directory = [];


    const files = await loadFilesInsideService.call({ host: userConfig.host, port: userConfig.port}, sourcePath);
    remoteDirectoryTree.generateItemsByFiles(files?.Rowsets?.Rowset?.Row);
    logger.info("Download Context Directory Done")
    return;

    //UPPER METHOD IS MUCH FASTER BUT DOESN'T GET THE EMPTY FOLDERS

    const rootFolders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port}, parentPath);

    const root = rootFolders.Rowsets.Rowset.Row.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        root.FolderName = userConfig.context;
        directory.push(root);
        Promise.resolve().then(function (n) {
            return DownloadDirDepth(root, userConfig, auth);
        }).then(function () {
            remoteDirectoryTree.generateItems(directory);
            logger.info("Download Context Directory Done")
            statusBar.updateBar('Done', Icon.success, { duration: 2 });
        });
    }
}


async function DownloadDirDepth(mainFolder: Folder, userConfig: UserConfig, auth: string, promises: Promise<any>[] = []) {
    mainFolder.children = [];

    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port}, mainFolder.Path);
    if (mainFolder.ChildFolderCount != 0) {
        await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
            mainFolder.children.push(folder);
            return DownloadDirDepth(folder, userConfig, auth, promises)
        }));
    }

    if (mainFolder.ChildFileCount != 0) {
        const files = await listFilesService.call({ host: userConfig.host, port: userConfig.port}, mainFolder.Path);
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)
        }
    }

    return promises;
}
