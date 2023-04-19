import logger from '../ui/logger.js';
import { Service, Request } from './miiservice';

class SaveFileService extends Service {
    name: string = "Save File";
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";

    async call({ host, port, auth, body }: Request & { auth: string, body: string }, sourcePath: string) {
        const url = this.get(host, port, sourcePath);
        const { value, error, isError } = await this.fetch(url, auth, body);
        if (!isError) {
            const data = this.parseXML(value);
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