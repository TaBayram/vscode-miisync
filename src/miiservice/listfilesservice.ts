import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';
import { File, GeneralColumn2, MII, Row } from './abstract/responsetypes.js';



class ListFilesService extends Service {
    name: string = "List Files";
    mode: string = "XMII/Catalog?Mode=List&Session=true&DoStateCheck=true&Content-Type=text/xml";

    async call({ host, port }: Request, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch({ host, port }, url);
        let data: MII<File, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
            /* logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length); */
        }
        return data;
    }
    get(host: string, port: number, folderPath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}

export const listFilesService = new ListFilesService();