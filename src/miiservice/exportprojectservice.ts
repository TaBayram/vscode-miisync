import { writeFile } from 'fs-extra';
import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';
import { GetCurrentWorkspaceFolder, OpenLink } from '../modules/vscode.js';
import path = require('path');

class ExportProjectService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=Transport&mode=ExportProject";

    async call({ host, port }: Request, projectName: string) {
        const url = this.get(host, port, projectName);
        OpenLink(this.get(host, port, projectName));

        return
        const { value, error, isError } = await this.fetch({host,port},url);
        if (!isError) {
            //const data = this.parseXML(value);
            //logger.info(this.name + ": " + data?.Rowsets?.Messages?.Message);
            writeFile(GetCurrentWorkspaceFolder().fsPath + path.sep + 'test.zip', Buffer.from(value));
        }
    }
    get(host: string, port: number, projectName: string) {
        return this.generateURL(host, port, "http") + "&" + this.generateParams(projectName);
    }
    protected generateParams(projectName: string) {
        return "Name=" + projectName;
    }
}


export const exportProjectService = new ExportProjectService();