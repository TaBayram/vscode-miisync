import * as vscode from 'vscode';
import { OnDidChangeActiveTextEditor } from './events/changeactivettexteditor';
import { RegisterCommands, RegisterEvents, activateTree } from './extension/activation';
import { GetActiveTextEditor, SetContextValue } from './modules/vscode';
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

	
	Session.onLogStateChange.event((session) => {
		if (session.system.isMain && session.IsLoggedin)
			OnDidChangeActiveTextEditor(GetActiveTextEditor());
	})
}


export function deactivate() {
	SetContextValue("enabled", false);
}

