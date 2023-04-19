import * as vscode from "vscode";
import { UploadFile } from "./transfer.js";
import logger from "../ui/logger.js";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import { fileProperties } from "../ui/viewtree.js";
import { configManager } from "../modules/config.js";


export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await configManager.load();
    if (userConfig) {
        if (userConfig.uploadOnSave)
            UploadFile(document, userConfig);
    }
    else {
        logger.warn('user config not available');
    }
}

export async function OnDidOpenTextDocument(document: vscode.TextDocument) {
    const userConfig = await configManager.load();
    if (userConfig) {
        if (!ValidatePath(document.fileName, userConfig)) return;
        const sourcePath = GetRemotePath(document.fileName, userConfig);
        const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
        const file = await readFilePropertiesService.call({ host: userConfig.host, port: userConfig.port, auth }, sourcePath);
        if(file?.Rowsets?.Rowset?.Row)
            fileProperties.generateItems(file.Rowsets.Rowset.Row[0]);

    }
}

export function OnDidChangeActiveTextEditor({document}: vscode.TextEditor) {
	OnDidOpenTextDocument(document);
}
