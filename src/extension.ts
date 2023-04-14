// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import statusBar, { Icon, activateBar } from './ui/statusbar';
import { OnDidSaveTextDocument } from './extension/events';
import { LoadUserConfig, UserConfig } from './modules/config';
import { OnCommandCreateConfig } from './commands/commandconfig';
import { OnCommandUploadFile } from './commands/commandupload';
import { OnCommandDisableSyncSave, OnCommandEnableSyncSave } from './commands/commandtogglesync';
import { OnCommandOpenScreen } from './commands/commandopenscreen';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);

	RegisterCommand('miisync.createconfig', OnCommandCreateConfig, context);
	RegisterCommand('miisync.disablesyncsave', OnCommandDisableSyncSave, context);
	RegisterCommand('miisync.enablesyncsave', OnCommandEnableSyncSave, context);
	RegisterCommand('miisync.uploadfile', OnCommandUploadFile, context);
	RegisterCommand('miisync.openscreen', OnCommandOpenScreen, context);

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument));	

	LoadUserConfig().then((value:UserConfig)=>{
		if(value && value.uploadOnSave){
			statusBar.Icon = Icon.syncEnabled
			statusBar.defaultIcon = Icon.syncEnabled;
		}
		else{
			statusBar.Icon = Icon.syncDisabled;
			statusBar.defaultIcon = Icon.syncDisabled;
		}
	});
}


export function deactivate() { 

	
}



function RegisterCommand(command: string, callback: (...args: any[])=>any, {subscriptions}: vscode.ExtensionContext){
	subscriptions.push(vscode.commands.registerCommand(command, callback));
}

