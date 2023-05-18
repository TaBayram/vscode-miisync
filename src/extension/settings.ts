import { ConfigurationChangeEvent, EventEmitter, workspace } from "vscode";
import { EXTENSION_SETTINGS } from "../constants";

interface ExtensionSettings {
    sessionDuration: number,
    refreshSession: boolean
}

const defaultSettings: ExtensionSettings = {
    sessionDuration: 60,
    refreshSession: true
}

class SettingsManager {
    private currentSettings: ExtensionSettings;
    public onSettingsChange: EventEmitter<ExtensionSettings> = new EventEmitter();
    
    public get CurrentSettings() {
        return { ...this.currentSettings };
    }

    constructor() {
        const config = workspace.getConfiguration(EXTENSION_SETTINGS);

        this.currentSettings = {
            ...defaultSettings,
            ...{
                sessionDuration: config.get('sessionDuration'),
                refreshSession: config.get('refreshSession'),
            }
        }
    }

    updateSettings(event: ConfigurationChangeEvent) {
        const config = workspace.getConfiguration(EXTENSION_SETTINGS);

        let changed = false;
        for (const key in this.currentSettings) {
            if (event.affectsConfiguration(EXTENSION_SETTINGS + "." + key) && Object.prototype.hasOwnProperty.call(this.currentSettings, key)) {
                this.currentSettings[key] = config.get(key, defaultSettings[key]);
                changed = true;
            }
        }
        if(changed){
            this.onSettingsChange.fire(this.CurrentSettings);
        }
    }
}



export const settingsManager = new SettingsManager();