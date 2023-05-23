import { Request, Service } from './abstract/miiservice.js';

class LogOutService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=logout";

    async call({ host, port }: Request) {
        // bug: This creates a session instead of destroying current
        
        /* 
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(new URL(url), false, null, 'none');
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(host, port) + "/XMII/goService.jsp") {
                return value;
            }
            return null;  
        }  */
    }
    get(host: string, port: number) {
        return this.generateURL(host, port, "http");
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logOutService = new LogOutService();