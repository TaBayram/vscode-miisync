import { SystemConfig } from "../modules/config";

export class System implements SystemConfig {
    name: string;
    isMain: boolean;
    host: string;
    port: number;
    username: string;
    password?: string;

    static fromConfig(systemConfig: SystemConfig){
        const system = new System();
        for(const key in systemConfig){
            system[key] = systemConfig[key];
        }
        return system;
    }

    private constructor() { }


    toURL() {
        return this.host + (this.port ? ":" + this.port : "");
    }

    toString(){
        return this.name + "-"+ this.host + (this.port ? ":" + this.port : "");
    }

}

