import { File } from "../../miiservice/listfilesservice";
import { Folder } from "../../miiservice/listfoldersservice";
import { TreeDataProvider, TreeItem } from "./tree";
import * as vscode from "vscode";

class RemoteDirectoryTree extends TreeDataProvider {
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
            const item = new TreeItem(file.ObjectName);
            item.iconPath = vscode.ThemeIcon.File;
            folder.children.push(item);
        }

        function findFolder(folderPath: string): TreeItem {
            for (const folder of folders) {
                if (folderPath == folder.data) {
                    return folder;
                }
            }

            const folderName = folderPath.substring(folderPath.lastIndexOf('/') + 1);
            let folder = new TreeItem(folderName, [])
            folder.iconPath = vscode.ThemeIcon.Folder;
            folder.data = folderPath;
            folder.contextValue = 'folder';
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
                    pFolder.iconPath = vscode.ThemeIcon.Folder;
                    pFolder.contextValue = 'folder';
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



export let remoteDirectoryTree: RemoteDirectoryTree = new RemoteDirectoryTree();