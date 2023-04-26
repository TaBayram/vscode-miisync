import { configManager } from "../modules/config.js";

export async function OnCommandEnableSyncSave() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.uploadOnSave = true;
        configManager.update(userConfig);
    }
}

export async function OnCommandDisableSyncSave() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.uploadOnSave = false;
        configManager.update(userConfig);
    }

}


export async function OnCommandEnableDownloadOnOpen() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.downloadOnOpen = true;
        configManager.update(userConfig);
    }
}


export async function OnCommandDisableDownloadOnOpen() {
    const userConfig = await configManager.load();
    if (userConfig) {
        userConfig.downloadOnOpen = false;
        configManager.update(userConfig);
    }
}