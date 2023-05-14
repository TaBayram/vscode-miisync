import { SystemConfig } from "../modules/config";

export class System implements SystemConfig {
    name: string;
    isMain: boolean;
    host?: string;
    port?: number;
    username?: string;
    password?: string;


    private constructor() { }


    getHost() {
        return this.host + (this.port ? ":" + this.port : "");
    }

}

