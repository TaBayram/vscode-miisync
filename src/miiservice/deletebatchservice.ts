import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';

class DeleteBatchService extends Service {
    name: string = "Delete Batch";
    mode: string = "XMII/Catalog?Mode=BatchDelete&Class=Content&Content-Type=text/xml";
    optionals: string = "&TemporaryFile=false&Notify=true"

    async call(request: Request, sourcePath: string) {
        const url = this.get(request, sourcePath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(server: MIIServer, sourcePath: string) {
        return this.generateURL(server) + this.optionals + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const deleteBatchService = new DeleteBatchService();