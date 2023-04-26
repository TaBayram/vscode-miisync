import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants.js';
import { UserConfig, configManager } from '../modules/config.js';
import { Session } from '../user/session.js';

export enum Icon {
    loading = 'loading',
    success = 'notebook-state-success',
    syncDisabled = 'extensions-sync-ignored',
    syncEnabled = 'extensions-sync-enabled',
    testingUnset = 'testing-unset-icon',
    spinSync = "sync~spin",
    spinLoading = "loading~spin",
    spinGear = "gear~spin",
    itemChecked = "pass-filled",
    itemUnchecked = "circle-large-outline"
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
    private mainIcon: Icon = Icon.itemUnchecked;
    private subIcon: Icon = Icon.testingUnset;

    public defaultIcon: Icon = Icon.testingUnset;

    private readonly minDuration = 1;
    private timeout: NodeJS.Timeout;
    private stack: { text: string, icon: Icon, duration: number }[] = [];

    public set Text(text: string) {
        this.text = text.trim();
        this.update();
    }

    public set Icon(icon: Icon) {
        this.subIcon = icon;
        this.update();
    }

    constructor() { }

    public initiliaze({ subscriptions }: vscode.ExtensionContext) {
        this.bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        this.update();
        subscriptions.push(this.bar);
        configManager.onConfigChange.event(this.onConfigChanged);
        Session.Instance.onLogStateChange.event(this.onLogStateChange,this);
    }


    private async onConfigChanged({ uploadOnSave }: UserConfig) {
        if (uploadOnSave) {
            statusBar.Icon = Icon.syncEnabled
            statusBar.defaultIcon = Icon.syncEnabled;
        }
        else {
            statusBar.Icon = Icon.syncDisabled;
            statusBar.defaultIcon = Icon.syncDisabled;
        }
    }

    private onLogStateChange(loggedIn: boolean) {
        this.mainIcon = loggedIn ? Icon.itemChecked : Icon.itemUnchecked;
        this.update();
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
        if (item.duration != -1) {
            this.timeout = setTimeout(() => this.popStack(), Math.max(this.minDuration * 1000 * (1 - this.stack.length / 50), item.duration))
        }
        else {
            if (this.stack.length == 0) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            else {
                this.timeout = setTimeout(() => this.popStack(), this.minDuration * 0.10);
            }
        }
    }

    private default() {
        this.Text = EXTENSION_NAME;
        this.Icon = this.defaultIcon;
    }

    private update() {
        if (!this.bar) return;
        this.bar.text = '$(' + this.mainIcon + ') ' + '$(' + this.subIcon + ')' + this.text;
        this.bar.show();

    }
}



let statusBar: StatusBar = new StatusBar();
export function activateBar(context: vscode.ExtensionContext) {
    statusBar.initiliaze(context);
}
export default statusBar;