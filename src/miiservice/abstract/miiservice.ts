import logger from '../../ui/logger.js';
import { XMLParser } from 'fast-xml-parser';
import fetch from "node-fetch";
import { Session } from '../../user/session.js';
import { UserConfig } from '../../modules/config.js';
import { Column, MII, Row } from './responsetypes.js';
import { userManager } from '../../user/usermanager.js';

export interface Request {
    host: string,
    port: number,
    body?: string
}

export abstract class Service {
    readonly abstract name: string;
    readonly abstract mode: string;

    constructor() { }

    abstract call(request: Request, ...args: any): Promise<MII<Row, Column> | void>;
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);

    public generateAuth({ username, password }: UserConfig) {
        return encodeURIComponent(Buffer.from(username + ":" + password).toString('base64'));
    }

    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${this.generateIP(host, port, protocol)}/${this.mode}`;
    }
    protected generateIP(host: string, port, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}`;
    }

    protected async fetch(url: string, auth: boolean = true, body?: string, convert: 'text' | 'blob' | 'none' = 'text', skipLogin = false): Promise<{ value: any, error: Error, isError: boolean }> {
        // todo: Get cookies and auth based on ip of the system for multiple session support
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "cookie": Session.Instance.getCookies()
        };
        if (auth) {
            headers["Authorization"] = 'Basic ' + Session.Instance.auth;
        }
        return fetch(url, {
            method: body ? "POST" : "GET",
            body,
            headers,
            keepalive: true,

        }).then((response) => {
            if (response.status != 200)
                logger.error(this.name + ": " + response.status + "-" + response.statusText);
            if (convert == 'none')
                return response;
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