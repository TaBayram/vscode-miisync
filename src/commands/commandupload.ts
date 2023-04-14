import { pathExists } from "fs-extra";
import { UploadFile } from "../extension/transfer";
import { LoadUserConfig } from "../modules/config";
import { getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";


export async function OnCommandUploadFile() {
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const userConfig = await LoadUserConfig();
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