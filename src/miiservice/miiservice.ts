import logger from '../ui/logger.js';
import { XMLParser } from 'fast-xml-parser';


export interface Request {
    host: string,
    port: number,
    auth?: string,
    body?: string
}



const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agent = (_parsedURL) => _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;

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
    protected async fetch(url: string, auth?: string, body?: string): Promise<{ value: string, error: Error, isError: boolean }> {
        let headers = { "Content-Type": "application/x-www-form-urlencoded" }
        if (auth)
            headers["Authorization"] = 'Basic ' + auth;
        return fetch(url, {
            method: "POST",
            body,
            headers,
            keepalive: true
        }).then((response) => {
            if(response.status != 200)
                logger.error(this.name + ": " + response.status + "-" + response.statusText);
            return response.text();
        }).then(data => {
            return { value: data, error:null, isError: false };
        }).catch((error: Error) => {
            logger.error(this.name + ": " + error);
            return { error: error, value:null, isError: true };
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