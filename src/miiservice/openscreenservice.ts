import { OpenLink } from '../modules/vscode.js';
import { Service, Request } from './abstract/miiservice.js';

class OpenScreenService extends Service {
    name: string = "Open Screen";
    mode: string = "XMII/CM/";

    async call({ host, port }: Request, remotePath: string) {
        OpenLink(this.get(host, port, remotePath));
    }
    get(host: string, port: number, remotePath: string) {
        return this.generateURL(host, port, "http") + remotePath;
    }
    protected generateParams() { }
}


export const openScreenService = new OpenScreenService();