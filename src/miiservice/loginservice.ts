import { MIIParams, Request, Service } from './abstract/miiservice.js';

class LogInService extends Service {
    name: string = "Log In";
    mode: string = "XMII/Illuminator?service=Personalization";
    defaultParams: MIIParams = {
        Session: false
    }

    async call({ host, port }: Request, useAuth: boolean = true, params?: MIIParams) {
        const url = this.get(host, port, params);
        const { value, error, isError } = await this.fetch(new URL(url), { auth: useAuth, convertResponse: 'none' });
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(host, port) + "/XMII/goService.jsp") {
                return value;
            }
            return null;
        }
        return null;
    }
    get(host: string, port: number, params?: MIIParams) {
        params = { ...this.defaultParams, ...params };
        return this.generateURL(host, port, "http") + this.parseParameters(params);
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logInService = new LogInService();