import { lstat } from "fs-extra";
import { Uri } from "vscode";
import { DownloadFile } from "../extension/transfer/download.js";
import { configManager } from "../modules/config.js";
import { DeleteFile } from "../extension/transfer/request.js";

export async function OnCommandDeleteFile(...uris: any[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uris) {
        const uri: Uri = uris[0];
        lstat(uri.fsPath).then(stat => {
            if (!stat.isDirectory()) {
                DeleteFile(uri, userConfig);
            }
        });
    }
}
