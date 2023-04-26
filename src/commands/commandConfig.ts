import { NewConfig } from "../modules/config.js";
import * as vscode from 'vscode';
import { AddWorkspaceFolder, GetWorkspaceFolders, OpenFolder, ShowConfirmMessage, ShowOpenDialog } from "../modules/vscode.js";

export async function OnCommandCreateConfig() {
    const workspaceFolders = GetWorkspaceFolders();
    if (!workspaceFolders) {
        const result = await ShowConfirmMessage(
            'MIISYNC expects to work at a folder.',
            'Open Folder',
            'Ok'
        );
        if (!result) {
            return;
        }
        return OpenFolder();
    }
    if (workspaceFolders.length <= 0) {
        const result = await ShowConfirmMessage(
            'There are no available folders in current workspace.',
            'Add Folder to Workspace',
            'Ok'
        );
        if (!result) {
            return;
        }
        const resources = await ShowOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: true,
        });
        if (!resources) {
            return;
        }

        AddWorkspaceFolder(...resources.map(uri => ({ uri })));
        return;
    }

    if (workspaceFolders.length === 1) {
        NewConfig(workspaceFolders[0].uri.fsPath);
        return;
    }

    const initDirs = workspaceFolders.map(folder => ({
        value: folder.uri.fsPath,
        label: folder.name,
        description: folder.uri.fsPath,
    }));

    vscode.window
        .showQuickPick(initDirs, {
            placeHolder: 'Select a folder...',
        })
        .then(item => {
            if (item === undefined) {
                return;
            }
            NewConfig(item.value);
        });
}