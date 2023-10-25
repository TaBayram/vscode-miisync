
import { configManager } from "../modules/config.js";
import { DownloadContextDirectory, DownloadRemoteFile, DownloadRemoteFolder } from "../transfer/download.js";
import { TreeItem } from "../ui/treeview/tree.js";


export async function OnCommandDownloadRemoteDirectory() {
    const userConfig = await configManager.load();
    if (!userConfig) return;
    DownloadContextDirectory(userConfig, configManager.CurrentSystem);
}

export async function OnCommandDownloadRemoteFolder(treeItem: TreeItem) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    DownloadRemoteFolder(treeItem.data, userConfig, configManager.CurrentSystem);
}

export async function OnCommandDownloadRemoteFile(treeItem: TreeItem) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    DownloadRemoteFile(treeItem.data, userConfig, configManager.CurrentSystem);
}

