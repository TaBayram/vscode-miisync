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
    immediate?: boolean,
    /**
     * -1 if you want it to be replaced when other status comes
     */
    duration?: number
}

class StatusBar {
    private bar: vscode.StatusBarItem;
    private text: string = EXTENSION_NAME;
    private icon: Icon = Icon.testingUnset;

    public defaultIcon: Icon = Icon.testingUnset;

    private readonly minDuration = 1;
    private timeout: NodeJS.Timeout;
    private stack: { text: string, icon: Icon, duration: number }[] = [];

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
        let dur = 0;
        if (options) {
            if (options.immediate) {
                clearTimeout(this.timeout);
                this.timeout = null;
                this.stack = [];
            }
            dur = options.duration || 0;
        }

        this.stack.push({ text: text.trim(), icon: icon, duration: dur });
        if (!this.timeout) this.popStack();
    }

    private popStack() {
        if (this.stack.length == 0) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.default();
            return;
        }
        const item = this.stack.splice(0, 1)[0];
        this.text = item.text;
        this.Icon = item.icon;
        if(item.duration != -1){
            this.timeout = setTimeout(() => this.popStack(), Math.max(this.minDuration * 1000 * (1 - this.stack.length / 50), item.duration))
        }
        else{
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    private default() {
        this.Text = EXTENSION_NAME;
        this.Icon = this.defaultIcon;
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