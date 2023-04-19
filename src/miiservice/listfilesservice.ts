import logger from '../ui/logger.js';
import { Service, Request } from './miiservice';
import { GeneralColumn2, MII, Row } from './responsetypes';

export interface File extends Row {
    ITYPE: 'File';
    ObjectName: string
    FilePath: string
    Type: string
    Created: string
    CreatedBy: string
    Modified: string
    ModifiedBy: string
    DcSpecificPath: string
    CheckedOutBy: string
    State: string
    ReadOnly: boolean
    LockedUsername: string
    Version: string
}


class ListFilesService extends Service {
    name: string = "List Files";
    mode: string = "XMII/Catalog?Mode=List&Session=true&DoStateCheck=true&Content-Type=text/xml";

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

export const listFilesService = new ListFilesService();