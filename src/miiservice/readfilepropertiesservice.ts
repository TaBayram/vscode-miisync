import logger from '../ui/logger';
import { Service, Request } from './miiservice';
import { GeneralColumn, GeneralColumn2, MII, Row } from './responsetypes';

export interface FileProperties extends Row {
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
  

class ReadFilePropertiesService extends Service {
    name: string = "File Properties";
    mode: string = "XMII/Catalog?Mode=ListFileProperties&Content-Type=text/xml";

    async call({ host, port, auth }: Request & { auth: string }, folderPath: string) {
        const url = this.get(host, port, folderPath);
        const { value, error, isError } = await this.fetch(url, auth);
        let data: MII<FileProperties, GeneralColumn2> = null
        if (!isError) {
            data = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length);
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