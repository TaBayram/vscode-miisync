// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EXTENSION_NAME } from './constants';
import { config } from './commands/commandConfig';
import { UserConfig, tryLoadConfigs } from './modules/config';
import { getWorkspaceFolders } from './modules/vscode';
import * as path from 'path';
import { Icon, activateBar, updateIcon, updateState, updateText } from './ui/statusbar';
import('node-fetch');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "miisync" is now active!');

	/* vscode.commands.executeCommand("identifier.miisync"); */


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('miisync.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from MIISync!');
		config();

		/* vscode.commands.executeCommand('workbench.action.openSettings'); */
		/* vscode.commands.executeCommand( 'workbench.action.openSettings', "@ext:"+EXTENSION_NAME ); */

	});


	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		BasicFetch(document);
	});

	context.subscriptions.push(disposable);

	activateBar(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }


function IsNonPassableFile(fileName: string) {
	fileName = fileName.toLocaleLowerCase();
	return fileName == 'package.json' ||
		fileName == 'package-lock.json' ||
		fileName == 'tsconfig.json';

}

async function BasicFetch(document: vscode.TextDocument) {
	const filePath = document.fileName;
	const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
	const firstFolderName = filePath.substring(filePath.lastIndexOf(path.sep, filePath.lastIndexOf(path.sep) - 1), filePath.lastIndexOf(path.sep)).replace(path.sep, '');
	if (firstFolderName[0] == '.' || fileName[0] == '.' || IsNonPassableFile(fileName)) {
		return;
	}


	const configs = await tryLoadConfigs(getWorkspaceFolders()[0].uri.fsPath);
	if (configs && configs.length != 0) {
		const userConfig: UserConfig = configs[0];
		let sourcePath = filePath.substring(filePath.indexOf(userConfig.context));
		for (const remove of userConfig.removeFromContext) {
			sourcePath = sourcePath.replace(remove + path.sep, '');
		}
		sourcePath = (userConfig.remotePath + path.sep + sourcePath).replaceAll(path.sep, '/');


		const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

		const url = `http://${userConfig.host}:${userConfig.port}/XMII/Catalog?Mode=SaveBinary&Class=Content&ObjectName=${sourcePath}&__=${new Date().getTime()}`;
		const Authorization = `Basic ${auth}`;

		const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
		updateState('Sending', Icon.loading);

		await fetch(url, {
			method: "POST",
			body: `Content=${base64Content}`,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization
			}
		})
			.then((response) => {
				console.log(response.status + "-" + response.statusText);
				return response.text()
			}).then((data) => {
				console.log('data: ' + (data));
			})
			.catch((error) => {
				console.log("Sync Fetch Error:" + error);
			});
		updateState(EXTENSION_NAME, Icon.success);

	}
	console.log(configs);


}