import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants';

let statusBar: vscode.StatusBarItem;

let statusText: string = EXTENSION_NAME;
let statusIcon: string = "notebook-state-success";

export enum Icon{
    loading = 'loading',
    success = 'notebook-state-success'
}

export function activateBar({ subscriptions }: vscode.ExtensionContext) {
    // create a new status bar item that we can now manage
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    subscriptions.push(statusBar);

    // update status bar item once at start
    update();
}

export function updateState(text: string, icon: Icon){
    
}

export function updateText(text: string): void {
    statusText = text;
    update();
}

export function updateIcon(icon: Icon) {
    statusIcon = icon.toString();
    update();
}

function update() {
    if(statusText.trim().length != 0){
        statusBar.text = '$('+statusIcon+'~spin)' + statusText;
        statusBar.show();
    }
    else{
        statusBar.hide();
    }
}