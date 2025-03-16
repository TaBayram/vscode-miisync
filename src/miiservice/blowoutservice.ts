import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';

class BlowoutService extends Service {
    name: string = "Delete Batch";
    mode: string = "XMII/Catalog?Mode=Blowout&Class=Content&Content-Type=text/xml";

    async call(request: Request, folderPath: string) {
        const url = this.get(request, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(server: MIIServer, sourcePath: string) {
        return this.generateURL(server) + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}


export const blowoutService = new BlowoutService();