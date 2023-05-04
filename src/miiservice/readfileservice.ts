import { Request, Service } from './abstract/miiservice';
import { FileBinary, GeneralColumn, MII } from './abstract/responsetypes';

class ReadFileService extends Service {
    name: string = "Get File";
    mode: string = "XMII/Catalog?Mode=LoadBinary&Class=Content&TemporaryFile=false&Content-Type=text/xml";

    async call({ host, port }: Request , filePath: string) {
        const url = this.get(host, port, filePath);
        const { value, error, isError } = await this.fetch({host,port},url);
        let data: MII<FileBinary, GeneralColumn> = null;
        if (!isError) {
            data = this.parseXML(value.replaceAll("&#13;",""));
           /*  logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length); */
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