import { pathExists } from "fs-extra";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import { UploadFile } from "../extension/transfer/upload.js";
import { Uri } from "vscode";



export async function OnCommandUploadFile(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    /* if (uri) {
        UploadFile(uri, userConfig);
        return;
    } */
    const textEditor = GetActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then((exists) => {
            if (exists)
                UploadFile(textEditor.document, userConfig);
        }).catch((error: Error) => {
            logger.error(error);
        });
    }
}