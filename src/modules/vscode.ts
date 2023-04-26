import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants.js';

export function GetWorkspaceFolders() {
    return vscode.workspace.workspaceFolders;
}

export function GetCurrentWorkspaceFolder() {
    return GetWorkspaceFolders()[0].uri;
}

export function OpenFolder(uri?: vscode.Uri, newWindow?: boolean) {
    vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
}

export function OpenLink(url: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
}

export function AddWorkspaceFolder(...workspaceFoldersToAdd: { uri: vscode.Uri; name?: string }[]) {
    return vscode.workspace.updateWorkspaceFolders(0, 0, ...workspaceFoldersToAdd);
}

export function ShowOpenDialog(options: vscode.OpenDialogOptions) {
    return vscode.window.showOpenDialog(options);
}

export function ShowTextDocument(uri: vscode.Uri, option?: vscode.TextDocumentShowOptions) {
    return vscode.window.showTextDocument(uri, option);
}

export function PathRelativeToWorkspace(localPath: string | vscode.Uri) {
    return vscode.workspace.asRelativePath(localPath);
}

export function GetActiveTextEditor() {
    return vscode.window.activeTextEditor;
}

export function GetOpenTextDocuments(): readonly vscode.TextDocument[] {
    return vscode.workspace.textDocuments;
}


export async function ShowConfirmMessage(
    message: string,
    confirmLabel: string = 'Yes',
    cancelLabel: string = 'No'
) {
    const result = await vscode.window.showInformationMessage(
        message,
        { title: confirmLabel },
        { title: cancelLabel }
    );

    return (result && result.title === confirmLabel);
}

export async function ShowInputBox(
    options?: vscode.InputBoxOptions,
    token?: vscode.CancellationToken
) {
    return await vscode.window.showInputBox(options, token);
}


export function ExecuteCommand(command: string, ...rest: any[]): Thenable<any> {
    return vscode.commands.executeCommand(command, ...rest);
}

export function SetContextValue(key: string, value: any) {
    ExecuteCommand('setContext', EXTENSION_NAME + '.' + key, value);
}


