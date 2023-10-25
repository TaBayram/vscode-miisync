import { lstat } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { GetActiveTextEditor } from "../modules/vscode";
import { DeleteFile, DeleteFolder, DeleteUris } from "../transfer/delete";
import { IEditorCommandsContext } from "../types/vscode";


export async function OnCommandDeleteBroad(mainUri: Uri, data: IEditorCommandsContext | Uri[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (!mainUri) {
        const textEditor = GetActiveTextEditor();
        if (textEditor?.document?.fileName) {
            DeleteFile(textEditor.document.uri, userConfig, configManager.CurrentSystem);
        }
    }
    else if (Array.isArray(data) && data.length > 1) {
        DeleteUris(data, userConfig, configManager.CurrentSystem, "Delete Selection");
    }
    else {
        const stat = await lstat(mainUri.fsPath);
        if(stat.isDirectory()){
            DeleteFolder(mainUri, userConfig, configManager.CurrentSystem)
        }
        else{
            DeleteFile(mainUri, userConfig, configManager.CurrentSystem);
        }
        
    }
}


