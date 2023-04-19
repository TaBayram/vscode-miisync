
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
