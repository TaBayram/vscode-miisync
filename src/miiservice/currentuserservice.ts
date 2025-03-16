import { MIIServer } from '../extension/system.js';
import { Request, Service } from './abstract/miiservice.js';
import { CurrentUser, GeneralColumn, MIISafe } from './abstract/responsetypes.js';

class CurrentUsersService extends Service {
    name: string = "Current Users";;
    mode: string = "XMII/Illuminator?service=admin&mode=SessionList&content-type=text/json";

    async call(request: Request) {
        const url = this.get(request);
        const { value, error, isError } = await this.fetch(new URL(url));
        let data: MIISafe<CurrentUser, GeneralColumn> = null;
        if (!isError) {
            data = JSON.parse(value);
        }
        return data;
    }
    /**
     * response is JSON
     */
    get(server: MIIServer) {
        return this.generateURL(server);
    }
    protected generateParams() { return '' }
}


export const currentUsersService = new CurrentUsersService();