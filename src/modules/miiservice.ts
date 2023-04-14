abstract class Service {
    readonly abstract mode: string;

    constructor() { }
    abstract get(host: string, port: number, ...args: any);
    protected abstract generateParams(...args: any);
    protected generateURL(host: string, port: number, protocol: 'http' | 'https' = 'http') {
        return `${protocol}://${host}:${port}/${this.mode}`;
    }
}

class SaveFileService extends Service {
    mode: string = "XMII/Catalog?Mode=SaveBinary&Class=Content";
    get(host: string, port: number, sourcePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(sourcePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(objectName: string) {
        return "ObjectName=" + objectName;
    }
}

class OpenScreenService extends Service {
    mode: string = "XMII/CM/";
    get(host: string, port: number, remotePath: string) {
        return this.generateURL(host, port, "http") + remotePath;
    }
    protected generateParams() { }
}

class ListFoldersService extends Service {
    mode: string = "XMII/Catalog?Mode=ListFolders&Session=true&DoStateCheck=true&Content-Type=text/xml"
    get(host: string, port: number, folderPath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}

class ListFilesService extends Service{
    mode: string = "XMII/Catalog?Mode=List&Session=true&DoStateCheck=true&Content-Type=text/xml"
    get(host: string, port: number, folderPath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(folderPath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(folder: string) {
        return "Folder=" + folder;
    }
}

class GetFileService extends Service{
    mode: string = "XMII/Catalog?Mode=LoadBinary&Class=Content&TemporaryFile=false&Content-Type=text/json";
    /**
     * Needs WEB path!
     * Response is JSON and text is in base64
     */
    get(host: string, port: number, filePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}

class GetFilePropertiesService extends Service{
    mode: string = "XMII/Catalog?Mode=ListFileProperties&Content-Type=text/xml";
    /**
     * Needs WEB path!
     */
    get(host: string, port: number, filePath: string) {
        return this.generateURL(host, port, "http") + `&${this.generateParams(filePath)}&__=${new Date().getTime()}`;
    }
    protected generateParams(file: string) {
        return "ObjectName=" + file;
    }
}

class GetCurrentUsersService extends Service{
    mode: string = "XMII/Illuminator?service=admin&mode=SessionList&content-type=text/json";
    /**
     * response is JSON
     */
    get(host: string, port: number) {
        return this.generateURL(host, port, "http");
    }
    protected generateParams(file: string) {}
}

export const saveFileService = new SaveFileService();
export const openScreenService = new OpenScreenService();
export const listFoldersService = new ListFoldersService();
export const listFilesService = new ListFilesService();
export const getFileService = new GetFileService();
export const getFilePropertiesService = new GetFilePropertiesService();
export const getCurrentUsersService = new GetCurrentUsersService();