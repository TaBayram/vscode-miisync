import { configManager } from "../modules/config";
import { GetWorkspaceFolders } from "../modules/vscode";
import { DeleteFolder } from "../transfer/delete";
import logger from "../ui/logger";

export async function OnCommandDeleteWorkspace() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    const workspaceFolders = GetWorkspaceFolders();

    if (workspaceFolders?.length != 0) {
        DeleteFolder(workspaceFolders[0].uri, userConfig, configManager.CurrentSystem);
        return;
    }
    else{
        logger.warn("No workspace available");
    }
}