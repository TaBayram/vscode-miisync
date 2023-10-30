import { Request, Service } from './abstract/miiservice.js';
import { MIISafe, RowsetsMessage } from './abstract/responsetypes.js';



class ExistsService extends Service {
    name: string = "Exists";
    mode: string = "/XMII/Catalog?Mode=Exists&Class=Content";

    /**
     * 
     * @returns 0 doesn't exist, 1 file exists, 2 folder exists
     */
    async call({ host, port }: Request, path: string) {
        const url = this.get(host, port, path);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<null, null, RowsetsMessage> = null;
        if (!isError) {
            data = this.parseXML(value);
        }
        return data;
    }
    get(host: string, port: number, folderPath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(path: string) {
        return "ObjectName=" + path;
    }
}

export const existsService = new ExistsService();