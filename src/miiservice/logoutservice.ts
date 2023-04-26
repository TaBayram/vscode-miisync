import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';

class LogOutService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=logout";
    optionals: string = "&Session=false";

    async call({ host, port, body }: Request) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, true, body);
        if (!isError) {
            //const data = this.parseXML(value);
            logger.info(this.name + ": logged out from mii");
        }
    }
    get(host: string, port: number) {
        return this.generateURL(host, port, "http") + this.optionals;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logOutService = new LogOutService();