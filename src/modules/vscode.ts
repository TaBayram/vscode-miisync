import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants';

export function getWorkspaceFolders() {
    return vscode.workspace.workspaceFolders;
}

export function getCurrentWorkspaceFolderUri() {
    return getWorkspaceFolders()[0].uri;
}

export function openFolder(uri?: vscode.Uri, newWindow?: boolean) {
    vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
}

export function openLink(url: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
}

export function addWorkspaceFolder(...workspaceFoldersToAdd: { uri: vscode.Uri; name?: string }[]) {
    return vscode.workspace.updateWorkspaceFolders(0, 0, ...workspaceFoldersToAdd);
}

export function showOpenDialog(options: vscode.OpenDialogOptions) {
    return vscode.window.showOpenDialog(options);
}

export function showTextDocument(uri: vscode.Uri, option?: vscode.TextDocumentShowOptions) {
    return vscode.window.showTextDocument(uri, option);
}

export function pathRelativeToWorkspace(localPath: string | vscode.Uri) {
    return vscode.workspace.asRelativePath(localPath);
}

export function getActiveTextEditor() {
    return vscode.window.activeTextEditor;
}

export function getOpenTextDocuments(): readonly vscode.TextDocument[] {
    return vscode.workspace.textDocuments;
}


export async function showConfirmMessage(
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

export async function showInputBox(
    options?: vscode.InputBoxOptions,
    token?: vscode.CancellationToken
) {
    return await vscode.window.showInputBox(options, token);
}


export function executeCommand(command: string, ...rest: any[]): Thenable<any> {
    return vscode.commands.executeCommand(command, ...rest);
}

export function setContextValue(key: string, value: any) {
    executeCommand('setContext', EXTENSION_NAME + '.' + key, value);
}


