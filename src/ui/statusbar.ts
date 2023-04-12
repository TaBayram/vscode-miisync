import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants';

export enum Icon {
    loading = 'loading',
    success = 'notebook-state-success',
    syncDisabled = 'extensions-sync-ignored',
    syncEnabled = 'extensions-sync-enabled',
    testingUnset = 'testing-unset-icon',
    spinSync = "sync~spin",
    spinLoading = "loading~spin",
    spinGear = "gear~spin",
}

export interface StatusOptions {
    duration?: number
}

class StatusBar {

    private bar: vscode.StatusBarItem;
    private text: string = EXTENSION_NAME;
    private icon: Icon = Icon.testingUnset;


    public set Text(text: string) {
        this.text = text.trim();
        this.update();
    }

    public set Icon(icon: Icon) {
        this.icon = icon;
        this.update();
    }

    constructor() { }

    public initiliaze({ subscriptions }: vscode.ExtensionContext) {
        this.bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        this.update();
        subscriptions.push(this.bar);
    }


    public updateBar(text: string, icon: Icon, options?: StatusOptions) {
        this.Text = text;
        this.Icon = icon;
        if (options) {
            if (options.duration) {
                setTimeout(()=> this.default(), options.duration * 1000)
            }
        }
    }


    private default() {
        this.Text = EXTENSION_NAME;
        this.Icon = Icon.syncEnabled;
    }

    private update() {
        if (!this.bar) return;
        if (this.text.length != 0) {
            this.bar.text = '$(' + this.icon + ')' + this.text;
            this.bar.show();
        }
        else {
            this.bar.hide();
        }
    }
}



let statusBar: StatusBar = new StatusBar();
export function activateBar(context: vscode.ExtensionContext) {
    statusBar.initiliaze(context);
}
export default statusBar;