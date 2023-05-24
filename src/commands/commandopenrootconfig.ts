import { Uri } from "vscode";
import { CONFIG_PATH } from "../constants.js";
import { configManager } from "../modules/config.js";
import { GetCurrentWorkspaceFolder, ShowTextDocument } from "../modules/vscode.js";
import path = require("path");


export async function OnCommandOpenRootConfig(uri: Uri) {
    const userConfig = configManager.SelfConfig;
    if (userConfig && userConfig.rootConfig) {
        const workspaceUri = GetCurrentWorkspaceFolder();

        if(path.isAbsolute(userConfig.rootConfig)){
            ShowTextDocument(Uri.file(path.join(userConfig.rootConfig, CONFIG_PATH)));
        }
        else{
            const rootPath = path.join(workspaceUri.fsPath, userConfig.rootConfig);
            ShowTextDocument(Uri.file(path.join(rootPath, CONFIG_PATH)));
        }
    }

}
