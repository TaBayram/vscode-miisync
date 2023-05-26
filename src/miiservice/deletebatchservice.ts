import { Request, Service } from './abstract/miiservice.js';
import { MII, RowsetsMessage } from './abstract/responsetypes.js';

class DeleteBatchService extends Service {
    name: string = "Delete Batch";
    mode: string = "XMII/Catalog?Mode=BatchDelete&Class=Content&Content-Type=text/xml";
    optionals: string = "&TemporaryFile=false&Notify=true&Session=true"

    async call({ host, port }: Request, sourcePath: string) {
        const url = this.get(host, port, sourcePath);
        const { value, error, isError } = await this.fetch(new URL(url), false);
        let data: MII<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + this.optionals + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const deleteBatchService = new DeleteBatchService();