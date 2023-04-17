import fetch from 'node-fetch';
import logger from '../ui/logger';
import { XMLParser } from 'fast-xml-parser';

interface Options {
    body?: string,
    auth?: string;
}
export interface Request {
    host: string,
    port: number,
    options?: Options
}

export abstract class Service {
    readonly abstract name: string;
    readonly abstract mode: string;

    constructor() { }

    abstract call(request: Request, ...args: any): any;
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);

    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}/${this.mode}`;
    }
    protected async fetch(url: string, options?: Options): Promise<{ value: string, error: Error, isError: boolean }> {
        let headers = { "Content-Type": "application/x-www-form-urlencoded" }
        if (options?.auth)
            headers["Authorization"] = 'Basic ' + options?.auth;
        const body = options?.body ? options.body : null;
        return fetch(url, {
            method: "POST",
            body,
            headers
        }).then((response) => {
            logger.info(this.name + ": " + response.status + "-" + response.statusText);
            return response.text();
        }).then(data => {
            return { value: data, isError: false };
        }).catch((error: Error) => {
            logger.error(this.name + ": " + error);
            return { error: error, isError: true };
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