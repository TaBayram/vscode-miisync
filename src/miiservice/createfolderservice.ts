import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';

class CreateFolderService extends Service {
    name: string = "Create Folder";
    mode: string = "XMII/Catalog?Mode=CreateFolder&Notify=true";

    async call(request: Request, foldePath: string) {
        const url = this.get(request, foldePath);
        const { value, error, isError } = await this.fetch(new URL(url), { auth: false });
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(server: MIIServer, sourcePath: string) {
        return this.generateURL(server) + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folderPath: string) {
        return "Folder=" + folderPath;
    }
}


export const createFolderService = new CreateFolderService();