import { openLink } from '../modules/vscode';
import { Service, Request } from './miiservice';

class OpenScreenService extends Service {
    name: string = "Open Screen";
    mode: string = "XMII/CM/";

    async call({ host, port }: Request, remotePath: string) {
        openLink(this.get(host, port, remotePath));
    }
    get(host: string, port: number, remotePath: string) {
        return this.generateURL(host, port, "http") + remotePath;
    }
    protected generateParams() { }
}


export const openScreenService = new OpenScreenService();