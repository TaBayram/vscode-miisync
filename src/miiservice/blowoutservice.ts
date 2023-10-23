import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';

class BlowoutService extends Service {
    name: string = "Delete Batch";
    mode: string = "XMII/Catalog?Mode=Blowout&Class=Content&Content-Type=text/xml";

    async call({ host, port }: Request, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}


export const blowoutService = new BlowoutService();