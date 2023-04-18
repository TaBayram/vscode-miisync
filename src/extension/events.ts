import * as vscode from "vscode";
import { LoadUserConfig, tryLoadConfigs, updateConfig, UserConfig, validateConfig } from "../modules/config";
import { getActiveTextEditor, getCurrentWorkspaceFolderUri, getWorkspaceFolders, pathRelativeToWorkspace } from "../modules/vscode";
import { UploadFile } from "./transfer";
import logger from "../ui/logger";
import { access, pathExists } from "fs-extra";
import statusBar, { Icon } from "../ui/statusbar";
import { readFilePropertiesService } from "../miiservice/readfilepropertiesservice";
import { GetRemotePath, ValidatePath } from "../modules/file";
import fileProperties from "../ui/treeproperties";

export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        if (userConfig.uploadOnSave)
            UploadFile(document, userConfig);
    }
    else {
        logger.warn('user config not available');
    }
}

export async function OnDidOpenTextDocument(document: vscode.TextDocument) {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        if (!ValidatePath(document.fileName, userConfig)) return;
        const sourcePath = GetRemotePath(document.fileName, userConfig);
        const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
        const file = await readFilePropertiesService.call({ host: userConfig.host, port: userConfig.port, auth }, sourcePath);
        if(file?.Rowsets?.Rowset?.Row)
            fileProperties.generateItems(file.Rowsets.Rowset.Row[0]);

    }
}