import { configManager } from "../modules/config";
import { GetWorkspaceFolders } from "../modules/vscode";
import { UploadFolder } from "../transfer/upload";

export async function OnCommandUploadWorkspaceFolder() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    const workspaceFolders = GetWorkspaceFolders();

    if (workspaceFolders?.length != 0) {
        UploadFolder(workspaceFolders[0].uri, userConfig, configManager.CurrentSystem);
        return;
    }
}