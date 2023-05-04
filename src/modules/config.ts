import * as fse from 'fs-extra';
import * as Joi from 'joi';
import * as path from 'path';
import * as vscode from 'vscode';
import { CONFIG_PATH, EXTENSION_NAME } from '../constants.js';
import logger from '../ui/logger.js';
import { GetWorkspaceFolders, ShowTextDocument } from './vscode';

const nullable = schema => schema.optional().allow(null);

let joiSystem = Joi.object().keys({
    name: Joi.string().required(),
    isMain: Joi.boolean().default(false),
    host: Joi.string().required(),
    port: Joi.number().required(),
    username: Joi.string().required(),
    password: Joi.string(),
});

const configScheme = Joi.object({
    systems: Joi.array().items(joiSystem).min(1),
    context: Joi.string().required(),
    removeFromContext: Joi.array<string>(),
    remotePath: Joi.string().required(),
    uploadOnSave: Joi.boolean(),
    downloadOnOpen: Joi.boolean(),
    ignore: Joi.array<string>(),
    rootConfig: Joi.string(),
    useRootConfig: Joi.boolean()
});


export interface System {
    name: string,
    isMain: boolean,
    host?: string,
    port?: number,
    username?: string,
    password?: string,
}

export interface UserConfig {
    systems?: System[],
    context?: string,
    removeFromContext?: string[],
    remotePath?: string,
    uploadOnSave?: boolean,
    downloadOnOpen?: boolean,
    ignore?: string[],
    useRootConfig?: boolean,
    rootConfig?: string,
}

export interface ConfigSystem extends System, UserConfig{

}

function GetWorkspaceConfig(): UserConfig {
    const conf = vscode.workspace.getConfiguration(EXTENSION_NAME);
    return {
        systems: conf.get("systems", [defaultSystem]),
        context: conf.get("context", '/'),
        removeFromContext: conf.get("removeFromContext", ['webapp']),
        remotePath: conf.get("remotePath", '/'),
        downloadOnOpen: false,
        uploadOnSave: true,
        ignore: conf.get('ignore', ['package.json', 'package-lock.json', 'tsconfig.json', '.*']),
        useRootConfig: conf.get('useRootConfig', false),
        rootConfig: conf.get('rootConfig', '')
    };
}

const defaultSystem: System = {
    name: "dev",
    isMain: false,
    host: '11.22.33',
    port: 5000,
    username: 'x-user',
    password: '1234'
};
const defaultConfig: UserConfig = {
    uploadOnSave: false,
    downloadOnOpen: false
};

function MergedDefault(config) {
    return {
        ...defaultConfig,
        ...config,
    };
}

function GetConfigPath(basePath) {
    return path.join(basePath, CONFIG_PATH);
}

function ReadConfigsFromFile(configPath): Promise<any[]> {
    return fse.readJson(configPath).then(config => {
        const configs = Array.isArray(config) ? config : [config];
        return configs.map(MergedDefault);
    });
}

function TryLoadConfigs(workspace): Promise<any[]> {
    const configPath = GetConfigPath(workspace);
    return fse.pathExists(configPath).then(
        exist => {
            if (exist) {
                return ReadConfigsFromFile(configPath);
            }
            return [];
        },
        _ => []
    );
}


export function NewConfig(basePath) {
    const configPath = GetConfigPath(basePath);

    return fse
        .pathExists(configPath)
        .then(exist => {
            if (exist) {
                return ShowTextDocument(vscode.Uri.file(configPath));
            }
            return fse
                .outputJson(
                    configPath,
                    GetWorkspaceConfig(),
                    { spaces: 4 }
                )
                .then(() => ShowTextDocument(vscode.Uri.file(configPath)));
        })
        .catch(console.error);
}


class ConfigManager {
    private useRoot: boolean;
    private rootfsPath: string;
    private rootConfig: UserConfig;

    private selffsPath: string;
    private selfConfig: UserConfig;

    private currentSystem: System;

    public onConfigChange: vscode.EventEmitter<UserConfig> = new vscode.EventEmitter();

    private lastLoadedTime: number;
    private lastLoadThreshold = 2000;

    private get config() {
        return this.useRoot ? this.rootConfig : this.selfConfig;
    }

    get Config(): ConfigSystem {
        return { ...this.config, ...this.currentSystem };
    }

    get CurrentSystem() {
        return this.currentSystem;
    }



    constructor() {
        this.lastLoadedTime = Date.now();

    }
    validate() {
        const { error } = configScheme.validate(this.config, {
            allowUnknown: true,
            convert: false,
        });

        for (const sys1 of this.config.systems) {
            for (const sys2 of this.config.systems) {
                if (sys1 !== sys2 && sys1.name === sys2.name) {
                    return new Error("Systems have the same name");
                }
            }
        }

        return error;
    }


    async load() {
        if (Date.now() - this.lastLoadedTime < this.lastLoadThreshold && this.selfConfig) {
            return this.Config;
        }

        this.selffsPath = GetWorkspaceFolders()[0].uri.fsPath;
        this.selfConfig = (await this.loadRoot(this.selffsPath, true)).config;
        this.useRoot = false;
        if (this.selfConfig.useRootConfig) {
            const root = await this.loadRoot(this.selffsPath, false);
            if (root) {
                this.rootConfig = root.config;
                this.rootfsPath = root.fsPath;
                this.useRoot = true;
            }
        }
        const error = this.validate();
        if(error){
            logger.warn("Config ", error);
            return null;
        }
        this.lastLoadedTime = Date.now();
        this.setCurrentSystem();
        this.onConfigChange.fire(this.config);
        return this.Config;
    }

    async update(config: UserConfig) {
        if (!this.useRoot) {
            this.selfConfig = config;
            fse.outputJson(GetConfigPath(this.selffsPath), config, { spaces: 4 });
        }
        else {
            this.rootConfig = config;
            fse.outputJson(GetConfigPath(this.rootfsPath), config, { spaces: 4 });
        }
        this.onConfigChange.fire(config);
    }

    private setCurrentSystem() {

        let candidate: System = this.config.systems[0];
        for (const system of this.config.systems) {
            if (system.isMain) {
                candidate = system;
                break;
            }
        }
        if (candidate) {
            this.currentSystem = {...candidate};
            this.currentSystem.isMain = true;
        }
    }

    private async loadRoot(fsPath: string, self: boolean): Promise<{ config: UserConfig, fsPath: string }> {
        const configs = await TryLoadConfigs(fsPath);
        if (configs?.length) {
            const config: UserConfig = configs[0];
            if (!self && config.useRootConfig && path.relative(config.rootConfig, fsPath).trim() != '') {
                const parentConfig = await this.loadRoot(path.resolve(fsPath, config.rootConfig), false);
                if (parentConfig) {
                    return parentConfig;
                }
            }
            return { config, fsPath };
        }
        return null;
    }
}



export const configManager = new ConfigManager();