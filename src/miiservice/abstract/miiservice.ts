import { X2jOptions, XMLParser } from 'fast-xml-parser';
import fetch, { HeadersInit, RequestRedirect, Response } from "node-fetch";
import { MIIServer } from '../../extension/system.js';
import logger from '../../ui/logger.js';
import { GetSession } from '../../user/session.js';

export interface Request extends MIIServer {
    body?: string
}

export interface FetchSettings {
    method?: 'GET' | 'POST'
    body?: any,
    auth?: boolean,
    convertResponse?: 'text' | 'blob' | 'none',
    redirect?: RequestRedirect,
    sessionCookies?: boolean
}

export interface MIIParams {
    "Session"?: boolean
}

export abstract class Service {
    readonly abstract name: string;
    readonly abstract mode: string;

    constructor() { }

    abstract call(request: Request, ...args: any): Promise<any>;
    abstract get(system: MIIServer, ...args: any): string;
    protected abstract generateParams(...args: any): string;

    protected generateURL(server: MIIServer) {
        return `${this.generateIP(server)}/${this.mode}`;
    }
    protected generateIP({ host, port, protocol = "http" }: MIIServer) {
        return `${protocol}://${host}${port ? ':' + port : ''}`;
    }

    protected async fetch(url: URL, settings?: FetchSettings): Promise<{ value: any, error: Error, isError: boolean, data?: any }> {
        const defaultSettings: FetchSettings = {
            auth: false,
            method: 'GET',
            body: null,
            convertResponse: 'text',
            redirect: 'follow',
            sessionCookies: true
        };
        let { method, auth, body, convertResponse, redirect, sessionCookies } = { ...defaultSettings, ...settings };


        const session = GetSession(url.host);
        const headers: HeadersInit = {};
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
        headers['Accept'] = 'text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2';
        headers['Connection'] = 'keep-alive';

        if (sessionCookies) {
            headers["Cookie"] = session?.Cookies || '';
        }
        if (auth && session?.auth) {
            headers["Authorization"] = 'Basic ' + session.auth;
        }


        return fetch(url.toString(), {
            method: body ? "POST" : method,
            body,
            headers,
            redirect,
        }).then((response: Response): any => {
            if (response.status >= 400) {
                logger.error(this.name + ": " + response.status + "-" + response.statusText);
            }
            if (session.haveCookies(response) == -1) {
                //throw Error("Not logged in");
            }
            if (convertResponse == 'none') {
                return response;
            }


            return response[convertResponse]();
        }).then(async (data) => {
            return { value: data, error: null, isError: false };
        }).catch((error: Error) => {
            logger.toastError(this.name + ": " + error);
            return { error: error, value: null, isError: true };
        });
    }

    protected parseXML(data: string, options?: Partial<X2jOptions>) {
        options = options ? options : {
            ignoreAttributes: false, isArray(tagName, jPath, isLeafNode, isAttribute) {
                return tagName == "Row";
            },
        };
        const parser = new XMLParser(options);
        return parser.parse(data);
    }

    protected parseParameters(miiParams: MIIParams) {
        if (!miiParams) { return ''; }
        const params: string[] = [];
        for (const key in miiParams) {
            if (miiParams[key] != null) {
                params.push(key + "=" + miiParams[key].toString());
            }
        }
        return '&' + params.join('&');
    }
}