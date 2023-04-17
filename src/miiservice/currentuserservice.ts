import logger from '../ui/logger';
import { Service, Request } from './miiservice';
import { Column, GeneralColumn, MII, Row } from './responsetypes';

interface CurrentUser extends Row {
    "Login Name": string
    "Full Name": string
    "E-mail Address": string
    Created: string
    "Last Access Time": string
    "Expiration Date": string
}

class CurrentUsersService extends Service {
    name: string;
    mode: string = "XMII/Illuminator?service=admin&mode=SessionList&content-type=text/json";

    async call({ host, port, options }: Request) {
        const url = this.get(host, port);
        const { value, error, isError } = await this.fetch(url, options);
        let data: MII<CurrentUser, GeneralColumn> = null;
        if (!isError) {
            data = JSON.parse(value)
            logger.info(this.name + ": " + data?.Rowsets?.Rowset?.Row?.length);
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