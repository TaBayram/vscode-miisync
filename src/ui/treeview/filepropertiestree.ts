import { FileProperties } from '../../miiservice/abstract/responsetypes.js';
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

    generateNotAvailable(){
        this.items = [new TreeItem('File not available')];
        this.refresh();
    }
}

export const filePropertiesTree: FilePropertiesTree = new FilePropertiesTree();