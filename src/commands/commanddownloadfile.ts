import { pathExists } from "fs-extra";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import { GetFileProperties } from "../transfer/misc.js";
import logger from "../ui/logger.js";

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