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

export async function ShowConfirmPreviewMessage(
    message: string,
    confirmLabel: string = 'Yes',
    cancelLabel: string = 'No',
    previewLabel: string = 'Preview'
) {
    const result = await vscode.window.showInformationMessage(
        message,
        { title: confirmLabel },
        { title: cancelLabel },
        { title: previewLabel }
    );
    return result?.title === confirmLabel ? 1 : result?.title === previewLabel ? 2 : 0;

}

export async function ShowWarningMessage(
    message: string
) {
    const result = await vscode.window.showWarningMessage(
        message
    );

    return result;
}

export async function ShowQuickPick(items: any[], options?: vscode.QuickPickOptions, token?: vscode.CancellationToken) {
    return await vscode.window.showQuickPick(items, options, token);
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

export async function OpenTextDocument(content: string, language: string, focus: boolean, column?: vscode.ViewColumn) {
    const document = await vscode.workspace.openTextDocument({ content, language });
    if (focus)
        await vscode.window.showTextDocument(document,column );
    return document;
}

export async function CompareDocuments(uri1: vscode.Uri, uri2: vscode.Uri) {
    await vscode.commands.executeCommand("vscode.diff", uri1, uri2)
}

export async function ShowMarkdownPreview(uri: vscode.Uri, side: boolean = false) {
    if (side)
        await vscode.commands.executeCommand("markdown.showLockedPreviewToSide", uri);
    else
        await vscode.commands.executeCommand("markdown.showPreview", uri);
}


//https://stackoverflow.com/questions/44733028/how-to-close-textdocument-in-vs-code
export async function closeFileIfOpen(file:vscode.Uri) : Promise<void> {
    const tabs: vscode.Tab[] = vscode.window.tabGroups.all.map(tg => tg.tabs).flat();
    const index = tabs.findIndex(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.path === file.path);
    if (index !== -1) {
        await vscode.window.tabGroups.close(tabs[index]);
    }
}