import { lstat, pathExists, readFile } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import { UploadFile } from "../transfer/upload.js";
import logger from "../ui/logger.js";



export async function OnCommandUploadFile(...uris: any[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    if (uris && uris[0] && uris.length != 0) {
        const selectedUris: Uri[] = uris[1];
        for (let index = 0; index < selectedUris.length; index++) {
            const uri = selectedUris[index];
            lstat(uri.fsPath).then(stat => {
                if (!stat.isDirectory()) {
                    readFile(uri.fsPath).then((value) => {
                        UploadFile(uri, value.toString(), userConfig, configManager.CurrentSystem);
                    })
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
                UploadFile(textEditor.document.uri, textEditor.document.getText(), userConfig, configManager.CurrentSystem);

            }
        }).catch((error: Error) => {
            logger.error(error);
        });
    }
}