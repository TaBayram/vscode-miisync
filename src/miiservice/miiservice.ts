import logger from '../ui/logger.js';
import { XMLParser } from 'fast-xml-parser';
import fetch from "node-fetch";
import { Session } from '../extension/session.js';
import { UserConfig } from '../modules/config.js';
import { Column, MII, Row } from './responsetypes.js';

export interface Request {
    host: string,
    port: number,
    auth?: string,
    body?: string
}

export abstract class Service {
    readonly abstract name: string;
    readonly abstract mode: string;

    constructor() { }

    abstract call(request: Request, ...args: any):Promise<MII<Row, Column> | void>;
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);

    public generateAuth({ username, password }: UserConfig) {
        return encodeURIComponent(Buffer.from(username + ":" + password).toString('base64'));
    }

    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}/${this.mode}`;
    }
    protected async fetch(url: string, auth?: string, body?: string, convert: 'text' | 'blob' = 'text'): Promise<{ value: string, error: Error, isError: boolean }> {
        let headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "cookie": Session.Instance.getCookies()
        };
        if (auth)
            headers["Authorization"] = 'Basic ' + auth;
        return fetch(url, {
            method: body ? "POST" : "GET",
            body,
            headers,
            keepalive: true,

        }).then((response) => {
            if (response.status != 200)
                logger.error(this.name + ": " + response.status + "-" + response.statusText);
            else if (!Session.Instance.HasMIICookies) {
                Session.Instance.parseCookies(response);
                Session.Instance.HasMIICookies = true;
            }
            return response[convert]();
        }).then(data => {
            return { value: data, error: null, isError: false };
        }).catch((error: Error) => {
            logger.error(this.name + ": " + error);
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
}