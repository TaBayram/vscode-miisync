// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import statusBar, { Icon, activateBar } from './ui/statusbar';
import { OnDidChangeActiveTextEditor, OnDidOpenTextDocument, OnDidSaveTextDocument } from './extension/events';
import { UserConfig, configManager } from './modules/config';
import { OnCommandCreateConfig } from './commands/commandconfig';
import { OnCommandUploadFile } from './commands/commandupload';
import { OnCommandDisableSyncSave, OnCommandEnableSyncSave } from './commands/commandtogglesync';
import { OnCommandOpenScreen } from './commands/commandopenscreen';
import { setContextValue } from './modules/vscode';
import { OnCommandDownloadFile, OnCommandDownloadFolder } from './commands/commanddownload';
import { activateTree } from './ui/viewtree';
import { DownloadContextDirectory, DownloadDirectory } from './extension/transfer';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);
	activateTree(context);
	setContextValue("enabled", true);
	RegisterCommand('miisync.createconfig', OnCommandCreateConfig, context);
	RegisterCommand('miisync.disablesyncsave', OnCommandDisableSyncSave, context);
	RegisterCommand('miisync.enablesyncsave', OnCommandEnableSyncSave, context);
	RegisterCommand('miisync.uploadfile', OnCommandUploadFile, context);
	RegisterCommand('miisync.downloadfile', OnCommandDownloadFile, context);
	RegisterCommand('miisync.downloadfolder', OnCommandDownloadFolder, context);
	RegisterCommand('miisync.openscreen', OnCommandOpenScreen, context);
	RegisterCommand('miisync.downloadremotedirectory', (e)=>{
		configManager.load().then((config)=>{
			//DownloadContextDirectory(config);
		});
	}, context);

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument));
	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(OnDidOpenTextDocument));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(OnDidChangeActiveTextEditor));

	configManager.load();
}


export function deactivate() { 

	
}



function RegisterCommand(command: string, callback: (...args: any[])=>any, {subscriptions}: vscode.ExtensionContext){
	subscriptions.push(vscode.commands.registerCommand(command, callback));
}


