import { lstat } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { GetActiveTextEditor } from "../modules/vscode";
import { UploadFile, UploadFolder, UploadUris } from "../transfer/upload";
import { IEditorCommandsContext } from "../types/vscode";


export async function OnCommandUploadBroad(mainUri: Uri, data: IEditorCommandsContext | Uri[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (!mainUri) {
        const textEditor = GetActiveTextEditor();
        if (textEditor?.document?.fileName) {
            UploadFile(mainUri, userConfig, configManager.CurrentSystem, textEditor.document.getText());
        }
    }
    else if (Array.isArray(data) && data.length > 1) {
        UploadUris(data, userConfig, configManager.CurrentSystem, "Upload Files/Folders");
    }
    else {
        const stat = await lstat(mainUri.fsPath);
        if(stat.isDirectory()){
            UploadFolder(mainUri.fsPath, userConfig, configManager.CurrentSystem)
        }
        else{
            UploadFile(mainUri, userConfig, configManager.CurrentSystem);
        }
        
    }
}


