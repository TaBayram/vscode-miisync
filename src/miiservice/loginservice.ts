import logger from '../ui/logger.js';
import { Request, Service } from './abstract/miiservice.js';

class LogInService extends Service {
    name: string = "Log In";
    mode: string = "XMII/Illuminator?service=Personalization";
    optionals: string = "&Session=false";

    async call({ host, port }: Request) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, true, null, 'none', true);
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(host, port) + "/XMII/goService.jsp") {
                logger.info(this.name + ": success");
                return value;
            }
            else{
                logger.error(this.name + ": fail. Response "+ JSON.stringify(value));
            }   
            return null;
        }
    }
    get(host: string, port: number) {
        return this.generateURL(host, port, "http") + this.optionals;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logInService = new LogInService();