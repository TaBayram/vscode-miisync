import { Request, Service } from './abstract/miiservice.js';
import { MII, RowsetsMessage } from './abstract/responsetypes.js';

class SaveFileService extends Service {
    name: string = "Save File";
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";

    async call({ host, port, body }: Request & { body: string }, sourcePath: string) {
        const url = this.get(host, port, sourcePath);
        const { value, error, isError } = await this.fetch(new URL(url), { auth: false, body });
        let data: MII<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const saveFileService = new SaveFileService();