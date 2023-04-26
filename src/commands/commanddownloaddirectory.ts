
import { DownloadContextDirectory, DownloadRemoteFolder } from "../extension/transfer/download.js";
import { configManager } from "../modules/config.js";
import { TreeItem } from "../ui/explorer/tree.js";
import path = require("path");


export async function OnCommandDownloadRemoteDirectory() {
    const userConfig = await configManager.load();
    if (!userConfig) return;
    DownloadContextDirectory(userConfig);
}

export async function OnCommandDownloadRemoteFolder(treeItem: TreeItem) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    DownloadRemoteFolder(treeItem.data, userConfig);
}

