import * as vscode from 'vscode';

class TransactionPropertiesVirtualDoc implements vscode.TextDocumentContentProvider {
    content: string;

    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
        return this.content;
    }
};

const transactionPropertiesVirtualDoc: TransactionPropertiesVirtualDoc = new TransactionPropertiesVirtualDoc();
export default transactionPropertiesVirtualDoc;