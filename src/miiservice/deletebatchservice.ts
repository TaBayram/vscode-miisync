import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';

class DeleteBatchService extends Service {
    name: string = "Save File";
    mode: string = "XMII/Catalog?Mode=BatchDelete&Class=Content&Content-Type=text/xml";
    optionals: string = "&TemporaryFile=false&Notify=true&Session=true"

    async call({ host, port, body }: Request & { body: string }, sourcePath: string) {
        const url = this.get(host, port, sourcePath);
        const { value, error, isError } = await this.fetch(url, true, body);
        if (!isError) {
            const data = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Messages?.Message);
        }
    }
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + this.optionals + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const deleteBatchService = new DeleteBatchService();