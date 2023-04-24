import { Root } from 'joi';
import logger from '../ui/logger.js';
import { Service, Request } from './miiservice.js';
import { Column, GeneralColumn2, MII, Row } from './responsetypes.js';
import { File } from './listfilesservice.js';




class LoadFilesInsideService extends Service {
    name: string = "Load Files Inside";
    mode: string = "XMII/Catalog?Mode=LoadFilesInsideFolderAndSubfolders&Session=true&DoStateCheck=true&Content-Type=text/xml";
    async call({ host, port, auth }: Request & { auth: string }, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(url, auth);
        let data: MII<File, GeneralColumn2> = null;
        if (!isError) {
            data = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length);
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

export const loadFilesInsideService = new LoadFilesInsideService();