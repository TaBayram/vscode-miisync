// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { config } from './commands/commandConfig';
import statusBar, { Icon, activateBar } from './ui/statusbar';
import { OnCommandDisableSyncSave, OnCommandEnableSyncSave, OnCommandSyncFile, OnDidSaveTextDocument } from './extension/event';
import { LoadUserConfig, UserConfig } from './modules/config';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);

	let disposable = vscode.commands.registerCommand('miisync.createconfig', config);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('miisync.disablesyncsave', OnCommandDisableSyncSave);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('miisync.enablesyncsave', OnCommandEnableSyncSave);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('miisync.syncfile', OnCommandSyncFile);
	context.subscriptions.push(disposable);


	disposable = vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument);

	context.subscriptions.push(disposable);	

	LoadUserConfig().then((value:UserConfig)=>{
		if(value && value.syncOnSave){
			statusBar.Icon = Icon.syncEnabled
		}
		else{
			statusBar.Icon = Icon.syncDisabled;
		}
	});
}


export function deactivate() { 

	
}

