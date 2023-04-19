import { pathExists } from "fs-extra";
import { UploadFile } from "../extension/transfer.js";
import { getActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import { configManager } from "../modules/config.js";


export async function OnCommandUploadFile() {
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const userConfig = await configManager.load();
        if (userConfig) {
            const uri = textEditor.document.uri;
            await pathExists(uri.fsPath).then((exists) => {
                if (exists)
                    UploadFile(textEditor.document, userConfig);
            }).catch((error: Error) => {
                logger.error(error);
            })
        }
    }
}