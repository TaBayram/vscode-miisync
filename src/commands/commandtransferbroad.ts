import { lstat } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { GetActiveTextEditor } from "../modules/vscode";
import { TransferFile, TransferFolder, TransferUris } from "../transfer/transfer";
import { IEditorCommandsContext } from "../types/vscode";


export async function OnCommandTransferBroad(mainUri: Uri, data: IEditorCommandsContext | Uri[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (!mainUri) {
        const textEditor = GetActiveTextEditor();
        if (textEditor?.document?.fileName) {
            TransferFile(textEditor.document.uri, userConfig);
        }
    }
    else if (Array.isArray(data) && data.length > 1) {
        TransferUris(data, userConfig, "Transfer Selection");
    }
    else {
        const stat = await lstat(mainUri.fsPath);
        if(stat.isDirectory()){
            TransferFolder(mainUri, userConfig)
        }
        else{
            TransferFile(mainUri, userConfig);
        }
        
    }
}


