import { Uri } from "vscode";
import { TransferFolder } from "../extension/transfer/transfer";
import { configManager } from "../modules/config";


export async function OnCommandTransferFolder(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        TransferFolder(uri, userConfig);
        return;
    }
}