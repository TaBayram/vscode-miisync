import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { TransferFile } from "../transfer/transfer";


export async function OnCommandTransferFile(uri: Uri) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (uri) {
        TransferFile(uri, userConfig);
        return;
    }
}