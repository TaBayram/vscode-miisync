import { pathExists } from "fs-extra";
import { SyncFile } from "../extension/transfer";
import { LoadUserConfig, updateConfig } from "../modules/config";
import { GetCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";

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
