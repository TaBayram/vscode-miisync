import * as vscode from 'vscode';
import { GeneralColumn2, Row } from '../../miiservice/responsetypes.js';
import { FileProperties } from '../../miiservice/readfilepropertiesservice.js';
import { File } from '../../miiservice/listfilesservice.js';
import { Folder } from '../../miiservice/listfoldersservice.js';
import { TreeDataProvider, TreeItem } from './tree.js';


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

export let fileProperties: FilePropertiesTree = new FilePropertiesTree();