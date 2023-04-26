import logger from '../ui/logger.js';
import { Service, Request } from './abstract/miiservice.js';
import { Column, CurrentUser, GeneralColumn, MII, Row } from './abstract/responsetypes.js';

class CurrentUsersService extends Service {
    name: string;
    mode: string = "XMII/Illuminator?service=admin&mode=SessionList&content-type=text/json";

    async call({ host, port }: Request) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, true);
        let data: MII<CurrentUser, GeneralColumn> = null;
        if (!isError) {
            data = JSON.parse(value);
            /* logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length); */
        }
        return data;
    }
    /**
     * response is JSON
     */
    get(host: string, port: number) {
        return this.generateURL(host, port, "http");
    }
    protected generateParams(file: string) { }
}


export const currentUsersService = new CurrentUsersService();