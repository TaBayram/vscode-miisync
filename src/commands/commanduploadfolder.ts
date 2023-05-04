import { Uri } from "vscode";
import { UploadFolder } from "../extension/transfer/upload.js";
import { configManager } from "../modules/config.js";


export async function OnCommandUploadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        UploadFolder(uri, userConfig, configManager.CurrentSystem);
        return;
    }
}