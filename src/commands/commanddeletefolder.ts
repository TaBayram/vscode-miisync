import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { DeleteFolder } from "../transfer/request.js";

export async function OnCommandDeleteFolder(...uris: any[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uris) {
        const uri: Uri = uris[0];
        DeleteFolder(uri, userConfig, configManager.CurrentSystem);
    }
}
