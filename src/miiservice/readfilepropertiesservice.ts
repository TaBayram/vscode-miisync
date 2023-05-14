import { Request, Service } from './abstract/miiservice';
import { FileProperties, GeneralColumn2, MII } from './abstract/responsetypes';
  

class ReadFilePropertiesService extends Service {
    name: string = "File Properties";
    mode: string = "XMII/Catalog?Mode=ListFileProperties&Content-Type=text/xml";

    async call({ host, port }: Request, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MII<FileProperties, GeneralColumn2> = null
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    /**
     * Needs WEB path!
     */
    get(host: string, port: number, filePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}



export const readFilePropertiesService = new ReadFilePropertiesService();