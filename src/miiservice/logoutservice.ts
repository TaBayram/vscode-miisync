import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';


class LogOutService extends Service {
    name: string = "Log Out";
    mode: string = "XMII/Illuminator?service=logout";
    //Works ME: manufacturing/logout

    async call(request: Request) {
        const url = this.get(request);
        const { value, error, isError } = await this.fetch(new URL(url), { auth: false, convertResponse: 'none', redirect: 'manual' });
        if (!isError) {
            if (value.redirected && value.url == this.generateIP(request) + "/XMII/goService.jsp") {
                return value;
            }
            return null;
        }
    }
    get(server: MIIServer) {
        return this.generateURL(server);
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}


export const logOutService = new LogOutService();