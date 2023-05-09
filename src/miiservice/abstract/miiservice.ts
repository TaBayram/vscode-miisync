import { XMLParser } from 'fast-xml-parser';
import { Agent } from 'http';
import fetch, { Response } from "node-fetch";
import logger from '../../ui/logger.js';
import { GetSession } from '../../user/session.js';
import { Column, MII, Row } from './responsetypes.js';

export interface Request {
    host: string,
    port: number,
    body?: string
}

//todo: Use pool promise instead of limiting sockets
const agent = new Agent({maxSockets: 20, keepAlive:true, });

export abstract class Service {
    readonly abstract name: string;
    readonly abstract mode: string;

    constructor() { }

    abstract call(request: Request, ...args: any): Promise<MII<Row, Column> | void>;
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);

    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${this.generateIP(host, port, protocol)}/${this.mode}`;
    }
    protected generateIP(host: string, port, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}`;
    }

    // Dont like this session host port thingy change it
    protected async fetch(url: URL, auth: boolean = false, body?: string, convert: 'text' | 'blob' | 'none' = 'text', skipLogin = true): Promise<{ value: any, error: Error, isError: boolean }> {
        const session = GetSession(url.hostname, url.port);
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "cookie": session?.getCookies() || ''
        };
        if (auth) {
            headers["Authorization"] = 'Basic ' + session.auth;
        }
        return fetch(url.toString(), {
            method: body ? "POST" : "GET",
            body,
            headers,
            agent: agent

        }).then((response: Response): any => {
            if (response.status != 200)
                {logger.error(this.name + ": " + response.status + "-" + response.statusText);}
            if (convert == 'none')
                {return response;}
            return response[convert]();
        }).then(data => {
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
}