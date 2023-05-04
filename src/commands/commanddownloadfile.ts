import { lstat, pathExists } from "fs-extra";
import { Uri } from "vscode";
import { DownloadFile } from "../extension/transfer/download.js";
import { GetFileProperties } from "../extension/transfer/request.js";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";

export async function OnCommandDownloadFile(...uris: any[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uris && uris.length != 0) {
        const selectedUris: Uri[] = uris[1];
        for (let index = 0; index < selectedUris.length; index++) {
            const uri = selectedUris[index];
            lstat(uri.fsPath).then(stat => {
                if (!stat.isDirectory()) {
                    DownloadFile(uri, userConfig, configManager.CurrentSystem);
                }
            });

        }
        return;
    }
    const textEditor = GetActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then((exists) => {
            if (exists) {
                DownloadFile(uri, userConfig, configManager.CurrentSystem);
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
        await pathExists(uri.fsPath).then((exists) => {
            if (exists) {
                GetFileProperties(uri, userConfig,configManager.CurrentSystem);
            }

        }).catch((error: Error) => {
            logger.error(error);
        })
    }
}