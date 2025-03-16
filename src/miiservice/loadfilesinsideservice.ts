import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { File, GeneralColumn2, MIISafe } from './abstract/responsetypes.js';


class LoadFilesInsideService extends Service {
    name: string = "Load Files Inside";
    mode: string = "XMII/Catalog?Mode=LoadFilesInsideFolderAndSubfolders&DoStateCheck=true&Content-Type=text/xml";
    async call(request: Request, folderPath: string) {
        const url = this.get(request, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<File, GeneralColumn2> = null;
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

export const loadFilesInsideService = new LoadFilesInsideService();