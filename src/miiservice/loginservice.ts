import { Response } from 'node-fetch';
import { Request, Service } from './abstract/miiservice.js';

class LogInService extends Service {
    name: string = "Log In";
    mode: string = "XMII/Illuminator?service=Personalization";
    optionals: string = "&Session=false";

    async call({ host, port }: Request, name: string) {
        const url = this.get(host, port);
        const { value, error, isError }: { value: Response, error: Error, isError: boolean } = await this.fetch(new URL(url), true, null, 'none', true);
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(host, port) + "/XMII/goService.jsp") {
                return value;
            }
            return null;
        }
        return null;
    }
    get(host: string, port: number) {
        return this.generateURL(host, port, "http") + this.optionals;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logInService = new LogInService();