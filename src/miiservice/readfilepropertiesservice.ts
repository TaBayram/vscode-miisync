import { MIIServer } from '../extension/system';
import { Request, Service } from './abstract/miiservice';
import { FileProperties, GeneralColumn2, MIISafe } from './abstract/responsetypes';
  

class ReadFilePropertiesService extends Service {
    name: string = "File Properties";
    mode: string = "XMII/Catalog?Mode=ListFileProperties&Content-Type=text/xml";

    async call(request: Request, folderPath: string) {
        const url = this.get(request, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<FileProperties, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    /**
     * Needs WEB path!
     */
    get(server: MIIServer, filePath: string) {
        return this.generateURL(server) + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}



export const readFilePropertiesService = new ReadFilePropertiesService();