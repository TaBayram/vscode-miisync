import { SystemConfig } from "../modules/config";

export class System implements SystemConfig {
    name: string;
    isMain: boolean;
    host: string;
    port: number;
    username: string;
    password?: string;


    private constructor() { }


    toURL() {
        return this.host + (this.port ? ":" + this.port : "");
    }

    toString(){
        return this.name + "-"+ this.host + (this.port ? ":" + this.port : "");
    }

}

