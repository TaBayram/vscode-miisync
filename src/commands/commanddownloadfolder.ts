import { Uri } from "vscode";
import { DownloadFolder } from "../extension/transfer/download.js";
import { configManager } from "../modules/config.js";


export async function OnCommandDownloadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadFolder(uri, userConfig,configManager.CurrentSystem);
        return;
    }
}