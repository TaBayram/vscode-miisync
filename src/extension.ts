import * as vscode from 'vscode';
import { OnCommandCreateConfig } from './commands/commandconfig';
import { OnCommandDownloadRemoteDirectory, OnCommandDownloadRemoteFolder } from './commands/commanddownloaddirectory';
import { OnCommandDownloadFile, OnCommandDownloadFileProperties, } from './commands/commanddownloadfile';
import { OnCommandDownloadFolder } from './commands/commanddownloadfolder';
import { OnCommandDownloadProject } from './commands/commanddownloadproject';
import { OnCommandOpenScreen } from './commands/commandopenscreen';
import { OnCommandEndSession } from './commands/commandsession';
import { OnCommandDisableDownloadOnOpen, OnCommandDisableSyncSave, OnCommandEnableDownloadOnOpen, OnCommandEnableSyncSave } from './commands/commandtogglesync';
import { OnCommandUploadFile } from './commands/commanduploadfile';
import { OnDidChangeActiveTextEditor, OnDidOpenTextDocument, OnDidSaveTextDocument } from './extension/events';
import { Session } from './extension/session';
import { currentUsersService } from './miiservice/currentuserservice';
import { configManager } from './modules/config';
import { SetContextValue } from './modules/vscode';
import { activateBar } from './ui/statusbar';
import { fileProperties } from './ui/explorer/filepropertiestree';
import { remoteDirectoryTree } from './ui/explorer/remotedirectorytree';
import { OnCommandUploadFolder } from './commands/commanduploadfolder';
import { logInService } from './miiservice/loginservice';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);
	activateTree(context);
	RegisterCommands(context);



	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument));
	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(OnDidOpenTextDocument));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(OnDidChangeActiveTextEditor));

	Session.Instance.Context = context;
	configManager.load().then(async ({ host, port, username, password }) => {
		await Session.Instance.setAuth({ username, password }, true);
		const response = await logInService.call({ host, port });
		Session.Instance.login(response);
	});

	SetContextValue("enabled", true);
}


export function deactivate() {


}

function RegisterCommands(context: vscode.ExtensionContext ){
	RegisterCommand('miisync.createconfig', OnCommandCreateConfig, context);
	RegisterCommand('miisync.disablesyncsave', OnCommandDisableSyncSave, context);
	RegisterCommand('miisync.enablesyncsave', OnCommandEnableSyncSave, context);
	RegisterCommand('miisync.uploadfile', OnCommandUploadFile, context);
	RegisterCommand('miisync.downloadfile', OnCommandDownloadFile, context);
	RegisterCommand('miisync.downloadfolder', OnCommandDownloadFolder, context);
	RegisterCommand('miisync.openscreen', OnCommandOpenScreen, context);
	RegisterCommand('miisync.endcurrentsession', OnCommandEndSession, context);
	RegisterCommand('miisync.downloadproject', OnCommandDownloadProject, context);
	RegisterCommand('miisync.downloadremotefolder', OnCommandDownloadRemoteFolder, context);
	RegisterCommand('miisync.downloadremotedirectory', OnCommandDownloadRemoteDirectory, context);
	RegisterCommand('miisync.downloadfileproperties', OnCommandDownloadFileProperties, context);
	RegisterCommand('miisync.uploadfolder', OnCommandUploadFolder, context);
	RegisterCommand('miisync.disabledownloadonopen', OnCommandDisableDownloadOnOpen, context);
	RegisterCommand('miisync.enabledownloadonopen', OnCommandEnableDownloadOnOpen, context);

}


function RegisterCommand(command: string, callback: (...args: any[]) => any, { subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.commands.registerCommand(command, callback));
}

/*
 * Find a better place for this
 */
export function activateTree({ subscriptions }: vscode.ExtensionContext) {
    subscriptions.push(vscode.window.registerTreeDataProvider('fileproperties', fileProperties));
    subscriptions.push(vscode.window.registerTreeDataProvider('remotedirectory', remoteDirectoryTree));
}
