import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { UploadFolder } from "../extension/transfer/upload.js";


export async function OnCommandUploadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        UploadFolder(uri, userConfig);
        return;
    }
}