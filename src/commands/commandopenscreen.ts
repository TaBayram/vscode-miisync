import { pathExists } from "fs-extra";

import { FindFileInDir, GetRemotePath } from "../modules/file";
import { getCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode";
import * as vscode from 'vscode';
import path = require("path");
import { openScreenService } from "../miiservice/openscreenservice";
import { configManager } from "../modules/config";


export async function OnCommandOpenScreen() {
    const userConfig = await configManager.load();
    if (userConfig) {
        const workspaceUri = getCurrentWorkspaceFolderUri();
        const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
        if (!name) return;
        const remotePath = GetRemotePath(name, userConfig, false);
        openScreenService.call({ host: userConfig.host, port: userConfig.port }, remotePath);
    }

}
