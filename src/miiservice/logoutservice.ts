import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';

class LogOutService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=logout";
    optionals: string = "&Session=false";

    async call({ host, port }: Request) {
        //Bug: Log  out creates a session instead of destroying the current one
        return;
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, false, null, 'none');
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(host, port) + "/XMII/goService.jsp") {
                logger.info(this.name + ": success");
                return value;
            }
            else{
                logger.error(this.name + ": fail. Response "+ JSON.stringify(value));
            }   
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