
import { TextDocument, Uri } from "vscode";
import { UserConfig, configManager } from "../modules/config.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import { showConfirmMessage } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import statusBar, { Icon } from "../ui/statusbar.js";
import { saveFileService } from "../miiservice/savefileservice.js";
import { readFileService } from "../miiservice/readfileservice.js";
import { writeFile } from "fs-extra";
import { ValidatePassword, ValidateContext, FileExists } from "./gate.js";
import { Folder, listFoldersService } from "../miiservice/listfoldersservice.js";
import { listFilesService } from "../miiservice/listfilesservice.js";
import { Directory } from "../miiservice/responsetypes.js";
import { remoteDirectoryTree } from "../ui/viewtree.js";
import path = require("path");


export async function UploadFile(document: TextDocument, userConfig: UserConfig) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const filePath = document.fileName;
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
    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    if (!await FileExists(sourcePath, userConfig, auth) &&
        !await showConfirmMessage("File does not exists. Do you want to create it?")) {
        return;
    }


    statusBar.updateBar('Sending', Icon.spinLoading);
    await saveFileService.call({ host: userConfig.host, port: userConfig.port, auth, body: "Content=" + base64Content }, sourcePath);
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


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
    if (!await FileExists(sourcePath, userConfig, auth)) {
        logger.error("File doesn't exist");
        return;
    }


    statusBar.updateBar('Downloading', Icon.spinLoading);
    const file = await readFileService.call({ host: userConfig.host, port: userConfig.port, auth }, sourcePath);
    const payload = file.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
    await writeFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function DownloadDirectory(folderUri: Uri | string, userConfig: UserConfig, getFileContents: boolean = false) {
    statusBar.updateBar('Checking', Icon.spinLoading, { duration: -1 });
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    const validationError = configManager.validate();
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(folderPath, userConfig)) return;
    if (!ValidatePassword(userConfig)) return;

    const sourcePath = GetRemotePath(folderPath, userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    statusBar.updateBar('Downloading', Icon.spinLoading, { duration: -1 });

    const directory: Directory = [];

    const rootFolders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, parentPath);

    const root = rootFolders.Rowsets.Rowset.Row.find((folder: Folder) => folder.Path == sourcePath);
    if (root) {
        directory.push(root);
        await deep(root);
    }

    async function deep(mainFolder: Folder) {
        mainFolder.children = [];
        const files = await listFilesService.call({ host: userConfig.host, port: userConfig.port, auth }, mainFolder.Path);
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)

            const filePath = folderPath + path.sep +
                (path.relative(sourcePath, file.FilePath) != '' ? path.relative(sourcePath, file.FilePath) + path.sep : '') +
                file.ObjectName
            const fileBinary = await readFileService.call({ host: userConfig.host, port: userConfig.port, auth }, file.FilePath + "/" + file.ObjectName);
            const payload = fileBinary.Rowsets.Rowset.Row.find((row) => row.Name == "Payload");
            writeFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" })
        }


        const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, mainFolder.Path);
        for (const folder of folders?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(folder);
            await deep(folder);
        }
    }
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}


/**
 * 
 * needs threads
 */
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

    const rootFolders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, parentPath);

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







// I am the recursive function, factored-out into its own function.
async function DownloadDirDepth(mainFolder: Folder, userConfig: UserConfig, auth: string, promises: Promise<any>[] = []) {
    mainFolder.children = [];

    const folders = await listFoldersService.call({ host: userConfig.host, port: userConfig.port, auth }, mainFolder.Path);
    /*20+ sec
    for (const folder of (folders?.Rowsets?.Rowset?.Row || [])) {
        mainFolder.children.push(folder);
        promises.push(DownloadDirDepth(folder, userConfig, auth, promises));
    } */
    /* 2min30sec
    for (const folder of folders?.Rowsets?.Rowset?.Row || []) {
        mainFolder.children.push(folder);
        await DownloadDirDepth(folder, userConfig, auth, promises);
    } */

    if (mainFolder.ChildFolderCount != 0) {
        await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
            mainFolder.children.push(folder);
            return DownloadDirDepth(folder, userConfig, auth, promises)
        }));
    }

    if (mainFolder.ChildFileCount != 0) {
        const files = await listFilesService.call({ host: userConfig.host, port: userConfig.port, auth }, mainFolder.Path);
        for (const file of files?.Rowsets?.Rowset?.Row || []) {
            mainFolder.children.push(file)
        }
    }

    return promises;
}
