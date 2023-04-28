import * as vscode from "vscode";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice.js";
import { configManager } from "../modules/config.js";
import { GetRemotePath, ValidatePath } from "../modules/file.js";
import { ShowConfirmMessage } from "../modules/vscode.js";
import { fileProperties } from "../ui/explorer/filepropertiestree.js";
import logger from "../ui/logger.js";
import { DownloadFile } from "./transfer/download.js";
import { UploadFile } from "./transfer/upload.js";


export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await configManager.load();
    if (userConfig) {
        if (userConfig.uploadOnSave)
            UploadFile(document.uri, document.getText(), userConfig);
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
        const files = await readFilePropertiesService.call({ host: userConfig.host, port: userConfig.port }, sourcePath);
        if (files?.Rowsets?.Rowset?.Row) {
            const file = files.Rowsets.Rowset.Row[0]
            fileProperties.generateItems(file);
            if (userConfig.downloadOnOpen) {
                DownloadFile(document.uri, userConfig);
            }
            else {
                const modifiedUser = file.ModifiedBy;
                if (userConfig.username != modifiedUser &&
                    await ShowConfirmMessage("This file has been modified by " + modifiedUser + " at " + file.Modified + ". Do you want to download it? File: " +file.ObjectName)) {
                    DownloadFile(document.uri, userConfig);
                }
            }
        }
        else{
            fileProperties.generateNotAvailable();
        }


    }


}

export function OnDidChangeActiveTextEditor({ document }: vscode.TextEditor) {
    OnDidOpenTextDocument(document);
}