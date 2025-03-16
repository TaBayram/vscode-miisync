import { MIIServer } from '../extension/system';
import { Request, Service } from './abstract/miiservice';
import { FileBinary, GeneralColumn, MIISafe } from './abstract/responsetypes';

class ReadFileService extends Service  {
    name: string = "Get File";
    mode: string = "XMII/Catalog?Mode=LoadBinary&Class=Content&TemporaryFile=false&Content-Type=text/xml";

    async call(request: Request , filePath: string) {
        const url = this.get(request, filePath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<FileBinary, GeneralColumn> = null;
        if (!isError) {
            data = this.parseXML(value.replaceAll("&#13;",""));
        }
        return data;
    }
    /**
     * Needs WEB path!
     * Response is JSON and text is in base64
     */
    get(server: MIIServer, filePath: string) {
        return this.generateURL(server) + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}



export const readFileService = new ReadFileService();