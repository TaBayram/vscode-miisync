import { MIIServer } from '../extension/system';
import { Request, Service } from './abstract/miiservice';
import { Folder, GeneralColumn2, MIISafe } from './abstract/responsetypes';


class ListFoldersService extends Service {
    name: string = "List Folders";
    mode: string = "XMII/Catalog?Mode=ListFolders&DoStateCheck=true&Content-Type=text/xml";
    async call(request: Request, folderPath: string) {
        const url = this.get(request, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<Folder, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }

    get(server: MIIServer, folderPath: string) {
        return this.generateURL(server) + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}

export const listFoldersService = new ListFoldersService();