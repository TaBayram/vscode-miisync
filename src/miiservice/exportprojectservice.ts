import { OpenLink } from '../modules/vscode.js';
import { Request, Service } from './abstract/miiservice.js';

class ExportProjectService extends Service{
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=Transport&mode=ExportProject";

    async call({ host, port }: Request, projectName: string) {
        const url = this.get(host, port, projectName);
        OpenLink(this.get(host, port, projectName));

        return null;
    }
    get(host: string, port: number, projectName: string) {
        return this.generateURL(host, port, "http") + "&" + this.generateParams(projectName);
    }
    protected generateParams(projectName: string) {
        return "Name=" + projectName;
    }
}


export const exportProjectService = new ExportProjectService();