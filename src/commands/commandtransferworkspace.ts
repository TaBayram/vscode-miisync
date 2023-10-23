import { configManager } from "../modules/config";
import { GetWorkspaceFolders } from "../modules/vscode";
import { TransferFolder } from "../transfer/transfer";
import logger from "../ui/logger";

export async function OnCommandTransferWorkspace() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    const workspaceFolders = GetWorkspaceFolders();

    if (workspaceFolders?.length != 0) {
        TransferFolder(workspaceFolders[0].uri, userConfig);
        return;
    }
    else{
        logger.warn("No workspace available");
    }
}