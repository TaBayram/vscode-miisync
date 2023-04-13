import { pathExists } from "fs-extra";
import { LoadUserConfig } from "../modules/config";
import { FindFileInDir, GetRemotePath } from "../modules/file";
import { GetCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode";
import * as vscode from 'vscode';
import path = require("path");
import { openScreenService } from "../modules/miiservice";


export async function OnCommandOpenScreen() {
    const userConfig = await LoadUserConfig();
    if (userConfig) {
        const workspaceUri = GetCurrentWorkspaceFolderUri();
        const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
        if (!name) return;
        const remotePath = GetRemotePath(name, userConfig);
        const url = openScreenService.get(userConfig.host, userConfig.port, remotePath);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }

}
