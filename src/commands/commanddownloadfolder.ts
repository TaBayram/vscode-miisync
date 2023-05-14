import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { DownloadFolder } from "../transfer/download.js";


export async function OnCommandDownloadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadFolder(uri, userConfig,configManager.CurrentSystem);
        return;
    }
}