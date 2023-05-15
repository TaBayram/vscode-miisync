import * as vscode from "vscode";
import { configManager } from "../modules/config.js";
import { UploadFile } from "../transfer/upload.js";


export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await configManager.load();    
    if (userConfig?.uploadOnSave) { 
        UploadFile(document.uri, document.getText(), userConfig, configManager.CurrentSystem); 
    }

}
