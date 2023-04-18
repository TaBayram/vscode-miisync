import { Root } from 'joi';
import logger from '../ui/logger';
import { Service, Request } from './miiservice';
import { Column, GeneralColumn2, MII, Row } from './responsetypes';


interface Folder extends Row {
    FolderName: string
    ParentFolderName: string
    Path: string
    ParentPath: string
    IsWebDir: boolean
    IsMetaDir: boolean
    IsMDODir: boolean
    ChildFolderCount: number
    ChildFileCount: number
    RemotePath: string
    ComponentName: string
    State: string
}

class ListFoldersService extends Service {
    name: string = "List Folders";
    mode: string = "XMII/Catalog?Mode=ListFolders&Session=true&DoStateCheck=true&Content-Type=text/xml";
    async call({ host, port, auth }: Request & { auth: string }, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(url, auth);
        let data: MII<Folder, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length);
        }
        return data;
    }

    get(host: string, port: number, folderPath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}

export const listFoldersService = new ListFoldersService();