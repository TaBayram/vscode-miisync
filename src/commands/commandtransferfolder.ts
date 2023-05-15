import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { TransferFolder } from "../transfer/transfer";


export async function OnCommandTransferFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        TransferFolder(uri, userConfig);
        return;
    }
}