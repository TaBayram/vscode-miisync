import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';
import { MII, RowsetsMessage } from './abstract/responsetypes.js';

class SaveFileService extends Service {
    name: string = "Save File";
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";

    async call({ host, port, body }: Request & { body: string }, sourcePath: string) {
        const url = this.get(host, port, sourcePath);
        const { value, error, isError } = await this.fetch(url, true, body);
        if (!isError) {
            const data: MII<null,null,RowsetsMessage> = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Messages?.Message);
        }
    }
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const saveFileService = new SaveFileService();