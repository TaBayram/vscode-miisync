import { XMLParser } from 'fast-xml-parser';
import fetch, { HeadersInit, RequestRedirect, Response } from "node-fetch";
import logger from '../../ui/logger.js';
import { GetSession } from '../../user/session.js';
import { Column, MII, Row } from './responsetypes.js';

export interface Request {
    host: string,
    port: number,
    body?: string
}

export interface FetchSettings {
    body?: string,
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

    abstract call(request: Request, ...args: any): Promise<MII<Row, Column> | any>;
    abstract get(host: string, port: number, ...args: any): string;
    protected abstract generateParams(...args: any): string;

    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${this.generateIP(host, port, protocol)}/${this.mode}`;
    }
    protected generateIP(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}`;
    }

    protected async fetch(url: URL, settings?: FetchSettings): Promise<{ value: any, error: Error, isError: boolean, data?: any }> {
        const defaultSettings: FetchSettings = {
            auth: false,
            body: null,
            convertResponse: 'text',
            redirect: 'follow',
            sessionCookies: true
        };
        let { auth, body, convertResponse, redirect, sessionCookies } = { ...defaultSettings, ...settings };


        const session = GetSession(url.host);
        const headers: HeadersInit = {};

        if (sessionCookies) {
            headers["Cookie"] = session?.Cookies || '';
        }
        if (auth && session?.auth) {
            headers["Authorization"] = 'Basic ' + session.auth;
        }
        if (body) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        return fetch(url.toString(), {
            method: body ? "POST" : "GET",
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

    protected parseXML(data: string) {
        const parser = new XMLParser({
            ignoreAttributes: false, isArray(tagName, jPath, isLeafNode, isAttribute) {
                return tagName == "Row";
            },
        });
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