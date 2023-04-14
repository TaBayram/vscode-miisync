import { pathExists } from "fs-extra";
import { UploadFile } from "../extension/transfer";
import { LoadUserConfig, updateConfig } from "../modules/config";
import { GetCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";

export async function OnCommandEnableSyncSave() {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        userConfig.uploadOnSave = true;
        updateConfig(userConfig, GetCurrentWorkspaceFolderUri().fsPath);
        statusBar.Icon = Icon.syncEnabled
        statusBar.defaultIcon = Icon.syncEnabled;
    }
}

export async function OnCommandDisableSyncSave() {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        userConfig.uploadOnSave = false;
        updateConfig(userConfig, GetCurrentWorkspaceFolderUri().fsPath);
        statusBar.Icon = Icon.syncDisabled
        statusBar.defaultIcon = Icon.syncDisabled;
    }

}
