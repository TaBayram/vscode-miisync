import logger from '../ui/logger.js';
import { Service, Request } from './miiservice';
import { GeneralColumn, MII, Row } from './responsetypes';

interface FileBinary extends Row {
    Name: string
    Value: string
}

class ReadFileService extends Service {
    name: string = "Get File";
    mode: string = "XMII/Catalog?Mode=LoadBinary&Class=Content&TemporaryFile=false&Content-Type=text/xml";

    async call({ host, port, auth }: Request & { auth: string }, filePath: string) {
        const url = this.get(host, port, filePath);
        const { value, error, isError } = await this.fetch(url, auth);
        let data: MII<FileBinary, GeneralColumn> = null;
        if (!isError) {
            data = this.parseXML(value.replaceAll("&#13;",""));
            logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length);
        }
        return data;
    }
    /**
     * Needs WEB path!
     * Response is JSON and text is in base64
     */
    get(host: string, port: number, filePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}



export const readFileService = new ReadFileService();