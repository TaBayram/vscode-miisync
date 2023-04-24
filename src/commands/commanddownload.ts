import { pathExists } from "fs-extra";
import { DownloadDirectory, DownloadFile, UploadFile } from "../extension/transfer.js";
import { getActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { GetRemotePath } from "../modules/file.js";
import path = require("path");
import { ValidateContext } from "../extension/gate.js";
import { loadFilesInsideService } from "../miiservice/loadfilesinsideservice.js";
import { Directory } from "../miiservice/responsetypes.js";
import statusBar, { Icon } from "../ui/statusbar.js";
import { remoteDirectoryTree } from "../ui/viewtree.js";
import { exportProjectService } from "../miiservice/exportprojectservice.js";


export async function OnCommandDownloadFile(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadFile(uri, userConfig);
        return;
    }
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then((exists) => {
            if (exists) {
                DownloadFile(uri, userConfig);
            }

        }).catch((error: Error) => {
            logger.error(error);
        })
    }
}

export async function OnCommandDownloadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadDirectory(uri, userConfig);
        return;
    }
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then((exists) => {
            if (exists) {
                DownloadDirectory(uri, userConfig);
            }

        }).catch((error: Error) => {
            logger.error(error);
        })
    }
}


export async function OnCommandDownloadProject(){
    const userConfig = await configManager.load();
    if (!userConfig) return;
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    exportProjectService.call({host: userConfig.host, port: userConfig.port, auth}, parentPath);
    return;
}