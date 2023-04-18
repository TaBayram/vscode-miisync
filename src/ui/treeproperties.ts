import * as vscode from 'vscode';
import { GeneralColumn2, Row } from '../miiservice/responsetypes';
import { FileProperties } from '../miiservice/readfilepropertiesservice';


class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private items: TreeItem[];
    private file: FileProperties;

    constructor() {
    }


    generateItems(file: FileProperties) {
        const items: TreeItem[] = [];
        for (const key in file) {
            if (Object.prototype.hasOwnProperty.call(file, key)) {
                const value = file[key];
                items.push(new TreeItem(key + ": " + value));
            }
        }

        this.items = items;
        this.file = file;
        this.refresh();
    }

    refresh(){
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
        if (element === undefined) {
            return this.items;
        }
        return element.children;
    }
}

class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;

    constructor(label: string, children?: TreeItem[]) {
        super(
            label,
            children === undefined ? vscode.TreeItemCollapsibleState.None :
                vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
    }
}

let fileProperties: TreeDataProvider = new TreeDataProvider();
export function activateTree({subscriptions}: vscode.ExtensionContext) {
   subscriptions.push(vscode.window.registerTreeDataProvider('fileproperties', fileProperties));

}
export default fileProperties;