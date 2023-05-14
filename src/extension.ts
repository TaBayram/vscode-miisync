import * as vscode from 'vscode';
import { RegisterCommands, RegisterEvents, activateTree } from './extension/activation';
import { SetContextValue } from './modules/vscode';
import { activateBar } from './ui/statusbar';
import { Session } from './user/session';
import { InitiliazeMainUserManager } from './user/usermanager';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);
	activateTree(context);
	RegisterCommands(context);
	RegisterEvents(context);

	SetContextValue("enabled", true);
	Session.Context = context;
	InitiliazeMainUserManager(context);
}


export function deactivate() {
	SetContextValue("enabled", false);
}

