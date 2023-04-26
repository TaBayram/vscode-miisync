import { pathExists, readFile } from "fs-extra";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import { UploadFile } from "../extension/transfer/upload.js";
import { Uri } from "vscode";



export async function OnCommandUploadFile(...uris: any[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    if (uris) {
        const selectedUris: Uri[] = uris[1];
        for (let index = 0; index < selectedUris.length; index++) {
            const uri = selectedUris[index];
            readFile(uri.fsPath).then((value) => {
                UploadFile(uri.fsPath, value.toString(), userConfig);
            })
        }
        return;
    }
    const textEditor = GetActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const uri = textEditor.document.uri;
        await pathExists(uri.fsPath).then((exists) => {
            if (exists) {
                UploadFile(textEditor.document.fileName, textEditor.document.getText(), userConfig);

            }
        }).catch((error: Error) => {
            logger.error(error);
        });
    }
}