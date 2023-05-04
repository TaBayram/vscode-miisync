import * as vscode from 'vscode';
import { OnCommandCreateConfig } from './commands/commandconfig';
import { OnCommandDeleteFile } from './commands/commanddeletefile';
import { OnCommandDownloadRemoteDirectory, OnCommandDownloadRemoteFolder } from './commands/commanddownloaddirectory';
import { OnCommandDownloadFile, OnCommandDownloadFileProperties, } from './commands/commanddownloadfile';
import { OnCommandDownloadFolder } from './commands/commanddownloadfolder';
import { OnCommandDownloadProject } from './commands/commanddownloadproject';
import { OnCommandOpenScreen } from './commands/commandopenscreen';
import { OnCommandLogin, OnCommandLogout } from './commands/commandsession';
import { OnCommandDisableDownloadOnOpen, OnCommandDisableSyncSave, OnCommandEnableDownloadOnOpen, OnCommandEnableSyncSave } from './commands/commandtogglesync';
import { OnCommandTransferFolder } from './commands/commandtransferfolder';
import { OnCommandUploadFile } from './commands/commanduploadfile';
import { OnCommandUploadFolder } from './commands/commanduploadfolder';
import { OnDidChangeActiveTextEditor, OnDidOpenTextDocument, OnDidSaveTextDocument } from './extension/events';
import { SetContextValue } from './modules/vscode';
import { filePropertiesTree } from './ui/explorer/filepropertiestree';
import { remoteDirectoryTree } from './ui/explorer/remotedirectorytree';
import { activateBar } from './ui/statusbar';
import { Session } from './user/session';
import { CreateMainUserManager } from './user/usermanager';


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);
	activateTree(context);
	RegisterCommands(context);
	RegisterEvents(context)

	SetContextValue("enabled", true);
	Session.Context = context;
	CreateMainUserManager(context).then((user) => user.login());
}


export function deactivate() {
	SetContextValue("enabled", false);
}

function RegisterEvents({ subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument));
	subscriptions.push(vscode.workspace.onDidOpenTextDocument(OnDidOpenTextDocument));
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(OnDidChangeActiveTextEditor));
}

function RegisterCommands(context: vscode.ExtensionContext) {
	RegisterCommand('miisync.createconfig', OnCommandCreateConfig, context);
	RegisterCommand('miisync.disableuploadonsave', OnCommandDisableSyncSave, context);
	RegisterCommand('miisync.enableuploadonsave', OnCommandEnableSyncSave, context);
	RegisterCommand('miisync.uploadfile', OnCommandUploadFile, context);
	RegisterCommand('miisync.downloadfile', OnCommandDownloadFile, context);
	RegisterCommand('miisync.downloadfolder', OnCommandDownloadFolder, context);
	RegisterCommand('miisync.openscreen', OnCommandOpenScreen, context);
	RegisterCommand('miisync.login', OnCommandLogin, context);
	RegisterCommand('miisync.logout', OnCommandLogout, context);
	RegisterCommand('miisync.downloadproject', OnCommandDownloadProject, context);
	RegisterCommand('miisync.downloadremotefolder', OnCommandDownloadRemoteFolder, context);
	RegisterCommand('miisync.downloadremotedirectory', OnCommandDownloadRemoteDirectory, context);
	RegisterCommand('miisync.downloadfileproperties', OnCommandDownloadFileProperties, context);
	RegisterCommand('miisync.uploadfolder', OnCommandUploadFolder, context);
	RegisterCommand('miisync.transferfolder', OnCommandTransferFolder, context);
	RegisterCommand('miisync.disabledownloadonopen', OnCommandDisableDownloadOnOpen, context);
	RegisterCommand('miisync.enabledownloadonopen', OnCommandEnableDownloadOnOpen, context);
	RegisterCommand('miisync.deletefile', OnCommandDeleteFile, context);

}


function RegisterCommand(command: string, callback: (...args: any[]) => any, { subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.commands.registerCommand(command, callback));
}

/*
 * Find a better place for this
 */
export function activateTree({ subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.window.registerTreeDataProvider('fileproperties', filePropertiesTree));
	subscriptions.push(vscode.window.registerTreeDataProvider('remotedirectory', remoteDirectoryTree));
}
