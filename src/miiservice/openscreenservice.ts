import { MIIServer } from '../extension/system.js';
import { OpenLink } from '../modules/vscode.js';
import { Request, Service } from './abstract/miiservice.js';

class OpenScreenService extends Service {
    name: string = "Open Screen";
    mode: string = "XMII/CM/";

    async call(request: Request, remotePath: string) {
        OpenLink(this.get(request, remotePath));
    }
    get(server: MIIServer, remotePath: string) {
        return this.generateURL(server) + remotePath;
    }
    protected generateParams() { return '' }
}


export const openScreenService = new OpenScreenService();