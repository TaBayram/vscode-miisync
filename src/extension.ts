// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { config } from './commands/commandConfig';
import { activateBar } from './ui/statusbar';
import { BasicFetch } from './extension/transfer'


export function activate(context: vscode.ExtensionContext) {
	activateBar(context);

	//vscode.commands.executeCommand("identifier.miisync");
	let disposable = vscode.commands.registerCommand('miisync.createconfig', () => {
		config();
	});

	context.subscriptions.push(disposable);

	disposable = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		BasicFetch(document);
	});

	context.subscriptions.push(disposable);	
}


export function deactivate() { }
