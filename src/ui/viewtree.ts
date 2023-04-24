import * as vscode from 'vscode';
import { GeneralColumn2, Row } from '../miiservice/responsetypes.js';
import { FileProperties } from '../miiservice/readfilepropertiesservice.js';
import { File } from '../miiservice/listfilesservice.js';
import { Folder } from '../miiservice/listfoldersservice.js';


abstract class TreeDataProvider implements vscode.TreeDataProvider<TreeItem>{
    protected _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    protected items: TreeItem[];

    abstract generateItems(...args: any)

    refresh() {
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
    data: string;
    children: TreeItem[] | undefined;

    constructor(label: string, children?: TreeItem[]) {
        super(
            label,
            children === undefined ? vscode.TreeItemCollapsibleState.None :
                vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
    }
}

class FilePropertiesTree extends TreeDataProvider {
    private file: FileProperties;

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
}

class RemoteDirectoryPropertiesTree extends TreeDataProvider {
    private directory: (File | Folder)[];

    generateItems(directory: (File | Folder)[]) {
        const items: TreeItem[] = this.generate(directory, []);

        this.items = items;
        this.directory = directory;
        this.refresh();
    }

    generateItemsByFiles(files: File[]) {
        const folders: TreeItem[] = [];
        for (const file of files) {
            const folder = findFolder(file.FilePath);
            folder.children.push(new TreeItem(file.ObjectName));
        }

        function findFolder(folderPath: string): TreeItem {
            for (const folder of folders) {
                if (folderPath == folder.data) {
                    return folder;
                }
            }

            const folderName = folderPath.substring(folderPath.lastIndexOf('/') + 1);
            let folder = new TreeItem(folderName, []);
            folder.data = folderPath;
            folders.push(folder);

            const originalFolder = folder;


            const parentFolders = folderPath.split('/');
            for (let index = parentFolders.length - 2; index > -1; index--) {
                const pfolderName = parentFolders[index];
                const path = folderPath.substring(0, folderPath.lastIndexOf(pfolderName) + pfolderName.length);
                const exists = folders.find((item) => item.data == path);
                if (!exists) {
                    const pFolder = new TreeItem(pfolderName, [folder]);
                    pFolder.data = path;
                    folders.push(pFolder);
                    folder = pFolder;
                }
                else {
                    exists.children.push(folder);
                    break;
                }
            }


            return originalFolder;
        }

        let currentRoots: TreeItem[] = [];
        let currentDepth = 99;
        for (const folder of folders) {
            const depth = (folder.data?.match(new RegExp('/', "g")) || []).length;
            if (depth < currentDepth) {
                currentRoots = [folder];
                currentDepth = depth;
            }
            else if (depth == currentDepth) {
                currentRoots.push(folder);
            }

            folder.children.sort(function (a, b) {
                const isAFolder = a.children != null; const isBFolder = b.children != null;
                //console.log(a.hey+ isAFolder +" - "+b.hey+isBFolder)
                if (isAFolder == isBFolder) return a.label < b.label ? -1 : 1;
                if (!isAFolder && isBFolder) return 1;
                if (isAFolder && !isBFolder) return -1;
                return 0;
            });
        }

        this.items = currentRoots;
        this.refresh();
    }

    private generate(directory: (File | Folder)[], items: TreeItem[] = []): TreeItem[] {
        for (const item of directory) {
            if ('FolderName' in item) {
                const folder = new TreeItem(item.FolderName, []);
                if (item.children) {
                    folder.children = this.generate(item.children, folder.children)
                }
                items.push(folder);
            }
            else {
                const file = new TreeItem(item.ObjectName);
                items.push(file);
            }
        }
        return items;
    }
}





export let remoteDirectoryTree: RemoteDirectoryPropertiesTree = new RemoteDirectoryPropertiesTree();
export let fileProperties: FilePropertiesTree = new FilePropertiesTree();
export function activateTree({ subscriptions }: vscode.ExtensionContext) {
    subscriptions.push(vscode.window.registerTreeDataProvider('fileproperties', fileProperties));
    subscriptions.push(vscode.window.registerTreeDataProvider('remotedirectory', remoteDirectoryTree));
}