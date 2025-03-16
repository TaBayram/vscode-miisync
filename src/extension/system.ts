export enum Severity{
    low = "0-low",
    medium = "1-medium",
    high = "2-high",
    critical = "3-critical"
}

export interface MIIServer {
    host: string,
    port: number,
    protocol?: 'http' | 'https',
}

export interface SystemConfig extends MIIServer {
    name: string,
    isMain: boolean,
    severity: Severity
    username: string,
    password?: string,
}

export interface UserConfig {
    systems?: System[],
    removeFromLocalPath?: string[],
    remotePath?: string,
    uploadOnSave?: boolean,
    downloadOnOpen?: boolean,
    ignore?: string[],
    include?: string[],
    useRootConfig?: boolean,
    rootConfig?: string,
}


export class System implements SystemConfig {
    name: string;
    severity: Severity;
    isMain: boolean;
    host: string;
    port: number;
    protocol?: 'http' | 'https'
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
