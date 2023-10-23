import { lstat } from "fs-extra";
import { Uri } from "vscode";
import { configManager } from "../modules/config";
import { GetActiveTextEditor } from "../modules/vscode";
import { DownloadFile, DownloadFolder, DownloadUris } from "../transfer/download";
import { IEditorCommandsContext } from "../types/vscode";


export async function OnCommandDownloadBroad(mainUri: Uri, data: IEditorCommandsContext | Uri[]) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (!mainUri) {
        const textEditor = GetActiveTextEditor();
        if (textEditor?.document?.fileName) {
            DownloadFile(mainUri, userConfig, configManager.CurrentSystem);
        }
    }
    else if (Array.isArray(data) && data.length > 1) {
        DownloadUris(data, userConfig, configManager.CurrentSystem, "Download Files/Folders");
    }
    else {
        const stat = await lstat(mainUri.fsPath);
        if(stat.isDirectory()){
            DownloadFolder(mainUri.fsPath, userConfig, configManager.CurrentSystem)
        }
        else{
            DownloadFile(mainUri, userConfig, configManager.CurrentSystem);
        }
        
    }
}


