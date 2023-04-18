import { pathExists } from "fs-extra";
import { UploadFile } from "../extension/transfer";

import { getCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";
import { configManager } from "../modules/config";

export async function OnCommandEnableSyncSave() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.uploadOnSave = true;
        configManager.update(userConfig);
        statusBar.Icon = Icon.syncEnabled
        statusBar.defaultIcon = Icon.syncEnabled;
    }
}

export async function OnCommandDisableSyncSave() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.uploadOnSave = false;
        configManager.update(userConfig);
        statusBar.Icon = Icon.syncDisabled
        statusBar.defaultIcon = Icon.syncDisabled;
    }

}
