import * as vscode from "vscode";
import { LoadUserConfig, tryLoadConfigs, updateConfig, UserConfig, validateConfig } from "../modules/config";
import { getActiveTextEditor, GetCurrentWorkspaceFolderUri, getWorkspaceFolders, pathRelativeToWorkspace } from "../modules/vscode";
import { SyncFile } from "./transfer";
import logger from "../ui/logger";
import { access, pathExists } from "fs-extra";
import statusBar, { Icon } from "../ui/statusbar";

export async function OnDidSaveTextDocument(document: vscode.TextDocument) {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        if (userConfig.syncOnSave)
            SyncFile(document, userConfig);
    }
    else {
        logger.warn('user config not available');
    }
}

