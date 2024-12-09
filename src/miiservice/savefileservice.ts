import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';

class SaveFileService extends Service {
    name: string = "Save File";
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";

    async call(request: Request & { body: string }, sourcePath: string) {
        const url = this.get(request, sourcePath);
        const { value, error, isError } = await this.fetch(new URL(url), { auth: false, body: request.body });
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(server: MIIServer, sourcePath: string) {
        return this.generateURL(server) + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const saveFileService = new SaveFileService();