import { pathExists } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor } from "../modules/vscode.js";
import logger from "../ui/logger.js";
import path = require("path");
import { DownloadFolder } from "../extension/transfer/download.js";


export async function OnCommandDownloadFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        DownloadFolder(uri, userConfig);
        return;
    }
}