import path = require("path");
import { readFile } from "fs-extra";
import { Uri } from "vscode";
import { deleteBatchService } from "../miiservice/deletebatchservice";
import { saveFileService } from "../miiservice/savefileservice";
import { SystemConfig, UserConfig } from "../modules/config";
import { GetAllFilesInDirTree, GetRemotePath, SimpleFolder, ValidatePath } from "../modules/file";
import { ShowConfirmMessage } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { DoesFileExist, DoesFolderExist, Validate } from "./gate";
import pLimit = require("p-limit");

export async function UploadFile(uri: Uri, content: string, userConfig: UserConfig, system: SystemConfig) {
    if (!await Validate(userConfig, system, uri.fsPath)) {
        return false;
    }
    const fileName = uri.fsPath.substring(uri.fsPath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(uri.fsPath, userConfig);
    const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));
    if (!await DoesFileExist(sourcePath, system) &&
        !await ShowConfirmMessage("File does not exists. Do you want to create it? \nFile: " + path.basename(sourcePath))) {
        return false;
    }


    statusBar.updateBar('Sending', Icon.spinLoading, { duration: -1 });
    const response = await saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
    if (response) {
        logger.infos("Upload File", fileName + ": " + response?.Rowsets?.Messages?.Message);
    }
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}


export async function UploadFolder(folderUri: Uri | string, userConfig: UserConfig, system: SystemConfig) {
    const folderPath = typeof (folderUri) === "string" ? folderUri : folderUri.fsPath;
    if (!await Validate(userConfig, system, folderPath)) {
        return false;
    }
    const sourcePath = GetRemotePath(folderPath, userConfig);
    if (!await DoesFolderExist(sourcePath, system) &&
        !await ShowConfirmMessage("Folder does not exists. Do you want to create it?")) {
        return;
    }
    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.info("Upload Folder Started");

    await UploadFolderLimited(folderPath, userConfig, system);

    logger.info("Upload Folder Completed");
    statusBar.updateBar('Done', Icon.success, { duration: 1 });
}



export async function UploadFolderLimited(folderPath: string, userConfig: UserConfig, system: SystemConfig) {
    const limit = pLimit(30);

    const folder = await GetAllFilesInDirTree(folderPath);
    let promises: Promise<any>[] = [];
    const deletePaths = [];
    await deep(folder);

    async function deep(folder: SimpleFolder) {
        //todo: find a way to create a folder in the system instead of this.
        if (folder.files.length + folder.folders.length > 1) {
            const deletePath = path.join(folder.path, '.delete');
            await saveFile(deletePath, Buffer.from('delete'));
            deletePaths.push(deletePath);
        }


        for (let index = 0; index < folder.files.length; index++) {
            const file = folder.files[index];
            if (!await ValidatePath(file, userConfig)) continue;
            promises.push(limit(() =>
                readFile(file).then((content) => {
                    return saveFile(file, content);
                })
            ));

        }

        for (let index = 0; index < folder.folders.length; index++) {
            const cFolder = folder.folders[index];
            await deep(cFolder);
        }
    }

    async function saveFile(file: string, content: Buffer) {
        const sourcePath = GetRemotePath(file, userConfig);
        const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
        return saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
    }

    for (const path of deletePaths) {
        const sourcePath = GetRemotePath(path, userConfig);
        promises.push(limit(() => deleteBatchService.call({ host: system.host, port: system.port }, sourcePath)));
    }

    await Promise.all(promises);
}