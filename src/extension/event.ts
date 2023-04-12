import * as vscode from "vscode";
import { LoadUserConfig, tryLoadConfigs, updateConfig, UserConfig, validateConfig } from "../modules/config";
import { getActiveTextEditor, GetCurrentWorkspaceFolderUri, getWorkspaceFolders, pathRelativeToWorkspace } from "../modules/vscode";
import { BasicFetch } from "./transfer";
import logger from "../ui/logger";
import { access, pathExists } from "fs-extra";
import statusBar, { Icon } from "../ui/statusbar";

export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        if (userConfig.syncOnSave)
            BasicFetch(document, userConfig);
    }
    else {
        logger.warn('user config not available');
    }
}


export async function OnCommandEnableSyncSave() {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        userConfig.syncOnSave = true;
        updateConfig(userConfig, GetCurrentWorkspaceFolderUri().fsPath);
        statusBar.Icon = Icon.syncEnabled
    }
}

export async function OnCommandDisableSyncSave() {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        userConfig.syncOnSave = false;
        updateConfig(userConfig, GetCurrentWorkspaceFolderUri().fsPath);
        statusBar.Icon = Icon.syncDisabled
    }

}


export async function OnCommandSyncFile() {
    const textEditor = getActiveTextEditor();
    if (textEditor && textEditor.document && textEditor.document.fileName) {
        const userConfig = await LoadUserConfig();
        if (userConfig) {
            const uri = textEditor.document.uri;
            await pathExists(uri.fsPath).then((exists) => {
                if (exists)
                    BasicFetch(textEditor.document, userConfig);
            }).catch((error: Error) => {
                logger.error(error);
            })
        }
    }
}