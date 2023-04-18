import { pathExists } from "fs-extra";
import { DownloadFile, UploadFile } from "../extension/transfer";
import { LoadUserConfig } from "../modules/config";
import { getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";
import { Uri } from "vscode";


export async function OnCommandDownloadFile(uri: Uri) {
    const userConfig = await LoadUserConfig();
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
    const userConfig = await LoadUserConfig();
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