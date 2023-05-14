import { Request, Service } from './abstract/miiservice';
import { Folder, GeneralColumn2, MII } from './abstract/responsetypes';


class ListFoldersService extends Service {
    name: string = "List Folders";
    mode: string = "XMII/Catalog?Mode=ListFolders&Session=true&DoStateCheck=true&Content-Type=text/xml";
    async call({ host, port }: Request, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MII<Folder, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
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

export const listFoldersService = new ListFoldersService();