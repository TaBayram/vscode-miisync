import * as vscode from "vscode";
import { settingsManager } from "../extension/settings";


export function onDidChangeConfiguration(configEvent: vscode.ConfigurationChangeEvent){
    settingsManager.updateSettings(configEvent);
}