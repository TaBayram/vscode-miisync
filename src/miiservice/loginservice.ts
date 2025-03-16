import { Response } from 'node-fetch';
import { MIIServer } from '../extension/system.js';
import { FetchSettings, MIIParams, Request, Service } from './abstract/miiservice.js';

class LogInService extends Service {
    name: string = "Log In";
    mode: string = "XMII/Illuminator?service=Personalization";
    defaultParams: MIIParams = {
        Session: false
    }

    async call(request: Request, checkCookies: boolean, user?: { name: string, password: string }) {
        const settings: FetchSettings = {
            auth: true,
            sessionCookies: true,
            redirect: 'manual',
            convertResponse: 'none',
            method: 'POST'
        }
        let url = '';
        if(checkCookies){
            url = this.get(request, { Session: true })
        }
        else{
            // get auth cookie
            const {value, error, isError } = await this.fetch(new URL(this.generateURL(request)), { auth: false, sessionCookies: false, method: 'POST' });
            if(isError){
                return null;
            }
       
            url = this.get(request, { Session: true }) + '&' + this.generateParams(user.name, user.password);
        }
        const { value, error, isError }: { value: Response, error: any, isError: boolean } = await this.fetch(new URL(url), settings);
        if (!isError) {
            const location = (value.headers.get('location') || '');
            if (value.status == 302 && location.endsWith('goService.jsp')) {
                return value;
            }
            return null;
        }
        return null;
        
    }
    get(server: MIIServer, params?: MIIParams) {
        params = { ...this.defaultParams, ...params };
        return this.generateURL(server) + this.parseParameters(params);
    }
    protected generateParams(name: string, password: string) {
        const params = new URLSearchParams();
        params.append('IllumLoginName', name);
        params.append('IllumLoginPassword', password);
        return params.toString();;
    }
}


export const logInService = new LogInService();