import * as vscode from 'vscode';

export function getWorkspaceFolders() {
    return vscode.workspace.workspaceFolders;
}

export function openFolder(uri?: vscode.Uri, newWindow?: boolean) {
    vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
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

    return Boolean(result && result.title === confirmLabel);
}