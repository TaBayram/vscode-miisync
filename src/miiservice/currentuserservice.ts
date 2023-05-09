import { Request, Service } from './abstract/miiservice.js';
import { CurrentUser, GeneralColumn, MII } from './abstract/responsetypes.js';

class CurrentUsersService extends Service {
    name: string;
    mode: string = "XMII/Illuminator?service=admin&mode=SessionList&content-type=text/json";

    async call({ host, port }: Request) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(new URL(url));
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