import * as vscode from 'vscode';

export interface QuickPickItem<T> extends vscode.QuickPickItem{
    object: T
}