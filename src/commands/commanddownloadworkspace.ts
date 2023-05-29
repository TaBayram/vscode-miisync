import { configManager } from "../modules/config";
import { GetWorkspaceFolders } from "../modules/vscode";
import { DownloadFolder } from "../transfer/download";

export async function OnCommandDownloadWorkspaceFolder() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    const workspaceFolders = GetWorkspaceFolders();

    if (workspaceFolders?.length != 0) {
        DownloadFolder(workspaceFolders[0].uri, userConfig, configManager.CurrentSystem);
        return;
    }
}