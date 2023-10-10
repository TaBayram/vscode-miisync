
import * as vscode from 'vscode';
import { OnCommandCreateConfig } from '../commands/commandconfig';
import { OnCommandDeleteFile } from '../commands/commanddeletefile';
import { OnCommandDeleteFolder } from '../commands/commanddeletefolder';
import { OnCommandDownloadRemoteDirectory, OnCommandDownloadRemoteFile, OnCommandDownloadRemoteFolder } from '../commands/commanddownloaddirectory';
import { OnCommandDownloadFile, OnCommandDownloadFileProperties } from '../commands/commanddownloadfile';
import { OnCommandDownloadFolder } from '../commands/commanddownloadfolder';
import { OnCommandDownloadProject } from '../commands/commanddownloadproject';
import { OnCommandDownloadTransactionProperties } from '../commands/commanddownloadtransaction';
import { OnCommandDownloadWorkspaceFolder } from '../commands/commanddownloadworkspace';
import { OnCommandUploadGitChanges } from '../commands/commandgitchanges';
import { OnCommandOpenRootConfig } from '../commands/commandopenrootconfig';
import { OnCommandOpenScreen } from '../commands/commandopenscreen';
import { OnCommandLogin, OnCommandLogout, OnCommandSwitchSystem } from '../commands/commandsession';
import { OnCommandDisableDownloadOnOpen, OnCommandDisableSyncSave, OnCommandEnableDownloadOnOpen, OnCommandEnableSyncSave } from '../commands/commandtogglesync';
import { OnCommandTransferFile } from '../commands/commandtransferfile';
import { OnCommandTransferFolder } from '../commands/commandtransferfolder';
import { OnCommandUploadFile } from '../commands/commanduploadfile';
import { OnCommandUploadFolder } from '../commands/commanduploadfolder';
import { OnCommandUploadWorkspaceFolder } from '../commands/commanduploadworkspace';
import { OnDidChangeActiveTextEditor } from '../events/changeactivettexteditor';
import { onDidChangeConfiguration } from '../events/changeconfiguration';
import { OnDidOpenTextDocument } from '../events/opentextdocument';
import { OnDidSaveTextDocument } from '../events/savetextdocument';
import { filePropertiesTree } from '../ui/treeview/filepropertiestree';
import { remoteDirectoryTree } from '../ui/treeview/remotedirectorytree';
import transactionPropertiesVirtualDoc from '../ui/virtualdocument/transactionproperties';


export function RegisterEvents({ subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.workspace.onDidSaveTextDocument(OnDidSaveTextDocument));
	subscriptions.push(vscode.workspace.onDidOpenTextDocument(OnDidOpenTextDocument));
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(OnDidChangeActiveTextEditor));
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(onDidChangeConfiguration));
}

export function RegisterCommands(context: vscode.ExtensionContext) {
	RegisterCommand('miisync.createconfig', OnCommandCreateConfig, context);
	RegisterCommand('miisync.disableuploadonsave', OnCommandDisableSyncSave, context);
	RegisterCommand('miisync.enableuploadonsave', OnCommandEnableSyncSave, context);
	RegisterCommand('miisync.uploadfile', OnCommandUploadFile, context);
	RegisterCommand('miisync.downloadfile', OnCommandDownloadFile, context);
	RegisterCommand('miisync.downloadfolder', OnCommandDownloadFolder, context);
	RegisterCommand('miisync.openscreen', OnCommandOpenScreen, context);
	RegisterCommand('miisync.login', OnCommandLogin, context);
	RegisterCommand('miisync.logout', OnCommandLogout, context);
	RegisterCommand('miisync.switchsystem', OnCommandSwitchSystem, context);
	RegisterCommand('miisync.downloadproject', OnCommandDownloadProject, context);
	RegisterCommand('miisync.downloadremotefolder', OnCommandDownloadRemoteFolder, context);
	RegisterCommand('miisync.downloadremotefile', OnCommandDownloadRemoteFile, context);
	RegisterCommand('miisync.downloadremotedirectory', OnCommandDownloadRemoteDirectory, context);
	RegisterCommand('miisync.downloadfileproperties', OnCommandDownloadFileProperties, context);
	RegisterCommand('miisync.uploadfolder', OnCommandUploadFolder, context);
	RegisterCommand('miisync.transferfolder', OnCommandTransferFolder, context);
	RegisterCommand('miisync.transferfile', OnCommandTransferFile, context);
	RegisterCommand('miisync.disabledownloadonopen', OnCommandDisableDownloadOnOpen, context);
	RegisterCommand('miisync.enabledownloadonopen', OnCommandEnableDownloadOnOpen, context);
	RegisterCommand('miisync.deletefile', OnCommandDeleteFile, context);
	RegisterCommand('miisync.deletefolder', OnCommandDeleteFolder, context);
	RegisterCommand('miisync.openrootconfig', OnCommandOpenRootConfig, context);
	RegisterCommand('miisync.uploadworkspace', OnCommandUploadWorkspaceFolder, context);
	RegisterCommand('miisync.downloadworkspace', OnCommandDownloadWorkspaceFolder, context);
	RegisterCommand('miisync.uploadgitchanges', OnCommandUploadGitChanges, context);
	RegisterCommand('miisync.downloadtransactionproperties', OnCommandDownloadTransactionProperties, context);

}


export function activateTree({ subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.window.registerTreeDataProvider('fileproperties', filePropertiesTree));
	subscriptions.push(vscode.window.registerTreeDataProvider('remotedirectory', remoteDirectoryTree));
	subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('transactionproperties', transactionPropertiesVirtualDoc));
}



function RegisterCommand(command: string, callback: (...args: any[]) => any, { subscriptions }: vscode.ExtensionContext) {
	subscriptions.push(vscode.commands.registerCommand(command, callback));
}
