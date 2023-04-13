import { pathExists } from "fs-extra";
import { SyncFile } from "../extension/transfer";
import { LoadUserConfig } from "../modules/config";
import { getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";


export async function OnCommandSyncFile() {
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const userConfig = await LoadUserConfig();
        if (userConfig) {
            const uri = textEditor.document.uri;
            await pathExists(uri.fsPath).then((exists) => {
                if (exists)
                    SyncFile(textEditor.document, userConfig);
            }).catch((error: Error) => {
                logger.error(error);
            })
        }
    }
}