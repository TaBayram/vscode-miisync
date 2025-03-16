import { MIIServer } from '../extension/system.js';
import { OpenLink } from '../modules/vscode.js';
import { Request, Service } from './abstract/miiservice.js';

class ExportProjectService extends Service{
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=Transport&mode=ExportProject";

    async call(request: Request, projectName: string) {
        const url = this.get(request, projectName);
        OpenLink(this.get(request, projectName));

        return null;
    }
    get(server: MIIServer, projectName: string) {
        return this.generateURL(server) + "&" + this.generateParams(projectName);
    }
    protected generateParams(projectName: string) {
        return "Name=" + projectName;
    }
}


export const exportProjectService = new ExportProjectService();