import logger from '../ui/logger.js';
import { Service, Request } from './miiservice.js';

class LogOutService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=logout";

    async call({ host, port, auth, body }: Request & { auth: string }) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, auth, body);
        if (!isError) {
            const data = this.parseXML(value);
            logger.info(this.name + ": " + data?.Rowsets?.Messages?.Message);
        }
    }
    get(host: string, port: number) {
        return this.generateURL(host, port, "http");
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logOutService = new LogOutService();