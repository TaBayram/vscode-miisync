import { writeFile } from "fs-extra";
import * as vscode from "vscode";
import { settingsManager } from "../extension/settings.js";
import { System } from "../extension/system.js";
import { FileProperties } from "../miiservice/abstract/responsetypes.js";
import { readFileService } from "../miiservice/readfileservice.js";
import { UserConfig, configManager } from "../modules/config.js";
import { GetRemotePath } from "../modules/file.js";
import { CompareDocuments, OpenTextDocument, ShowConfirmPreviewMessage } from "../modules/vscode.js";
import { DownloadFile } from "../transfer/download.js";
import { GetFileProperties } from "../transfer/request.js";
import { filePropertiesTree } from "../ui/explorer/filepropertiestree.js";
import logger from "../ui/logger.js";
import statusBar, { Icon } from "../ui/statusbar.js";
import { GetMainUserManager } from "../user/usermanager.js";
import path = require("path");


export async function OnDidChangeActiveTextEditor(textEditor: vscode.TextEditor) {
    if (!textEditor) return;
    const document = textEditor.document;
    const userConfig = await configManager.load();
    if (userConfig && GetMainUserManager()?.IsLoggedin) {
        const system = configManager.CurrentSystem;
        const files = await GetFileProperties(document.uri, userConfig, system);
        if (files?.Rowsets?.Rowset?.Row) {
            const fileProp = files.Rowsets.Rowset.Row[0];
            if (userConfig.downloadOnOpen) {
                DownloadFile(document.uri, userConfig, system);
            }
            else if (settingsManager.Settings.showDiffNotification) {
                CheckFileDifference(document, fileProp, userConfig, system);
            }
        }
        else {
            filePropertiesTree.generateNotAvailable();
        }
    }
}


let saidNoToTheseDocuments: { fsPath: string, modifiedUser: string, modifiedTime: string }[] = [];
async function CheckFileDifference(document: vscode.TextDocument, fileProp: FileProperties, userConfig: UserConfig, system: System) {
    const sourcePath = GetRemotePath(document.fileName, userConfig);
    const modifiedUser = fileProp.ModifiedBy;
    if (system.username != modifiedUser) {
        if (saidNoToTheseDocuments.find((no) => no.fsPath === document.uri.fsPath && no.modifiedTime == fileProp.Modified && no.modifiedUser == fileProp.ModifiedBy)) return;

        const file = await readFileService.call({ host: system.host, port: system.port }, sourcePath);
        const payload = file?.Rowsets?.Rowset?.Row?.find((row) => row.Name == "Payload");
        if (!payload) return;

        const remoteContent = Buffer.from(payload.Value, 'base64').toString();
        if (remoteContent != document.getText()) {
            const response = await ShowConfirmPreviewMessage("This file has been modified by " + modifiedUser + " at " + fileProp.Modified + ". Do you want to download it? File: " + fileProp.ObjectName);
            if (response === 1) {
                await writeFile(document.fileName, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" });
                statusBar.updateBar("Downloaded " + path.basename(document.fileName), Icon.success, { duration: 3 });
                logger.infoplus(system.name,'Download File', path.basename(document.fileName) + ": Finished.");
            }
            else if (response === 2) {
                const extension = path.extname(document.fileName).substring(1);
                let language = extension == "js" ? "javascript" : extension;
                const newDocument = OpenTextDocument(remoteContent, language, true);
                CompareDocuments(document.uri, (await newDocument).uri);
            }
            else if (response === 0) {
                saidNoToTheseDocuments.push({
                    fsPath: document.uri.fsPath,
                    modifiedTime: fileProp.Modified,
                    modifiedUser: fileProp.ModifiedBy
                })
            }
        }
    }
}

