import { pathExists } from "fs-extra";
import { Uri } from "vscode";
import { DownloadFile } from "../extension/transfer/download.js";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice.js";
import { configManager } from "../modules/config.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import { fileProperties } from "../ui/explorer/filepropertiestree.js";
import logger from "../ui/logger.js";
import path = require("path");


export async function OnCommandDownloadFile(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadFile(uri, userConfig);
        return;
    }
    const textEditor = GetActiveTextEditor();
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

export async function OnCommandDownloadFileProperties() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    const textEditor = GetActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then(async (exists) => {
            if (exists) {
                if (userConfig) {
                    if (!ValidatePath(textEditor.document.fileName, userConfig)) return;
                    const sourcePath = GetRemotePath(textEditor.document.fileName, userConfig);
                    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
                    const file = await readFilePropertiesService.call({ host: userConfig.host, port: userConfig.port }, sourcePath);
                    if (file?.Rowsets?.Rowset?.Row)
                        fileProperties.generateItems(file.Rowsets.Rowset.Row[0]);
                }
            }

        }).catch((error: Error) => {
            logger.error(error);
        })
    }
}