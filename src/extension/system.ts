import { SystemConfig } from "../modules/config";

export class System implements SystemConfig {
    name: string;
    isMain: boolean;
    host: string;
    port: number;
    username: string;
    password?: string;

    static fromConfig(systemConfig: SystemConfig) {
        const system = new System();
        for (const key in systemConfig) {
            system[key] = systemConfig[key];
        }
        return system;
    }

    static fromConfigs(configs: SystemConfig[]) {
        return configs.map((config) => this.fromConfig(config));
    }

    private constructor() { }


    /**
     * 
     * @returns https://11.22:5000 or http://11.22:5000
     */
    toURL() {
        return this.host + (this.port ? ":" + this.port : "");
    }

    /**
     * @returns 11.22:5000 or 11.22
     */
    toHost(){
        return this.host + (this.port ? ":" + this.port : "");
    }

    /**
     * @returns name-11.22:5000 or name-11.22
     */
    toString() {
        return this.name + "-" + this.host + (this.port ? ":" + this.port : "");
    }

    /**
     * @returns base64 of toString
     */
    toBase64() {
        return Buffer.from(this.toString()).toString('base64');
    }

}
