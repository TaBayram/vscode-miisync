abstract class Service {
    readonly abstract mode: string;

    constructor() { }
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);
    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}/${this.mode}/`;
    }
}

class SaveFileService extends Service {
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + this.mode + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}

class OpenScreenService extends Service {
    mode: string = "XMII/CM/";
    get(host: string, port: number, remotePath: string) {
        return this.generateURL(host, port, "http") + this.mode + remotePath;
    }
    protected generateParams() {}
}

export const saveFileService = new SaveFileService();
export const openScreenService = new OpenScreenService();