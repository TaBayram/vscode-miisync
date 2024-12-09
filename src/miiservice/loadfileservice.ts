import { X2jOptions } from 'fast-xml-parser';
import { MIIServer } from '../extension/system';
import { Request, Service } from './abstract/miiservice';
import { MIISafe, Transaction } from './abstract/responsetypes';

class LoadFileService extends Service {
    name: string = "Load File";
    mode: string = "XMII/Catalog?Mode=Load&Content-Type=text/xml";

    async call(request: Request, filePath: string) {
        const url = this.get(request, filePath);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<null, null, Transaction, 'Transaction'> = null;
        if (!isError) {
            const options: Partial<X2jOptions> = {
                ignoreAttributes: false,
                
                isArray(tagName, jPath, isLeafNode, isAttribute) {
                    return tagName == "Row" || tagName == 'Step' || tagName == 'ContextItem' || tagName == 'Assign' || tagName == 'Action';
                },
            }
            data = this.parseXML(value, options);
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



export const loadFileService = new LoadFileService();