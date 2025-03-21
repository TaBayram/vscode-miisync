import * as fse from 'fs-extra';
import * as Joi from 'joi';
import * as path from 'path';
import * as vscode from 'vscode';
import { CONFIG_PATH, CONFIG_USER_PATH, EXTENSION_NAME } from '../constants.js';
import { deepEqual } from '../extends/lib.js';
import { Severity, System, SystemConfig, UserConfig } from '../extension/system.js';
import logger from '../ui/logger.js';
import { GetWorkspaceFolders, SetContextValue, ShowTextDocument } from './vscode';

//todo make port optional
let joiSystem = Joi.object().keys({
    name: Joi.string().required(),
    severity: Joi.string().valid(...Object.values(Severity)).default(Severity.medium),
    isMain: Joi.boolean().default(false),
    host: Joi.string().required(),
    port: Joi.number(),
    protocol: Joi.string().valid('http', 'https').default('http'),
    username: Joi.string().required(),
    password: Joi.string(),
});

const configScheme = Joi.object({
    systems: Joi.array().items(joiSystem).min(1),
    removeFromLocalPath: Joi.array<string>(),
    remotePath: Joi.string().required(),
    uploadOnSave: Joi.boolean(),
    downloadOnOpen: Joi.boolean(),
    ignore: Joi.array<string>(),
    include: Joi.array<string>(),
    rootConfig: Joi.string().allow('', null),
    useRootConfig: Joi.boolean()
});



function GetWorkspaceConfig(): UserConfig {
    const conf = vscode.workspace.getConfiguration(EXTENSION_NAME);
    return {
        systems: conf.get("systems", [System.fromConfig(defaultSystem)]),
        removeFromLocalPath: conf.get("removeFromLocalPath", ['webapp']),
        remotePath: conf.get("remotePath", 'MES'),
        downloadOnOpen: false,
        uploadOnSave: false,
        ignore: conf.get('ignore', ['package.json', '.*']),
        include: conf.get('include', []),
        useRootConfig: conf.get('useRootConfig', false),
        rootConfig: conf.get('rootConfig', '')
    };
}

const defaultSystem: SystemConfig = {
    name: "dev",
    isMain: false,
    severity: Severity.medium,
    host: '11.22.33',
    port: 5000,
    protocol: 'http',
    username: 'x-user',
    password: '1234'
};
const defaultConfig: UserConfig = {
    uploadOnSave: false,
    downloadOnOpen: false
};

function MergedDefault(config: UserConfig) {
    return {
        ...defaultConfig,
        ...config,
    };
}

function GetConfigPath(basePath: string) {
    return path.join(basePath, CONFIG_PATH);
}

function GetUserConfig(basePath) {
    return path.join(basePath, CONFIG_USER_PATH)
}

function ReadConfigsFromFile(configPath: string): Promise<UserConfig[]> {
    return fse.readJson(configPath).then(config => {
        const configs = Array.isArray(config) ? config : [config];
        return configs.map(MergedDefault);
    }).catch(error => {
        logger.error("Config", error);
        return [];
    });
}

async function TryLoadConfigs(workspace: string): Promise<UserConfig[]> {
    const configPath = GetConfigPath(workspace);
    const exists = await fse.pathExists(configPath);
    if(exists){
        const configs = await ReadConfigsFromFile(configPath);
        for (const config of configs) {
            config.systems = config.systems?.map((sys) => System.fromConfig(sys));
        }
        return configs;
    }
}


export function NewConfig(basePath: string) {
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
    private _useRoot: boolean;
    private rootfsPath: string;
    private rootConfig: UserConfig;

    private selffsPath: string;
    private selfConfig: UserConfig;

    private currentSystem: System;

    public onConfigChange: vscode.EventEmitter<UserConfig> = new vscode.EventEmitter();
    public onSystemsChange: vscode.EventEmitter<System[]> = new vscode.EventEmitter();

    private lastLoadedTime: number;
    private lastLoadThreshold = 500;
    private oldConfig: UserConfig;

    private get useRoot(): boolean {
        return this._useRoot;
    }
    private set useRoot(value: boolean) {
        this._useRoot = value;
        SetContextValue('userootconfig', value);
    }

    private get config() {
        return this.useRoot ? this.rootConfig : this.selfConfig;
    }

    get Config(): UserConfig {
        return { ...this.config };
    }

    get ConfigFilePath(): string {
        return this.useRoot ? this.rootfsPath : this.selffsPath;
    }

    get CurrentSystem(): System {
        return this.currentSystem;
    }

    get SelfConfig() {
        return { ...this.selfConfig };
    }


    constructor() {
        this.lastLoadedTime = Date.now();

    }
    validate() {
        const { error } = configScheme.validate(this.config, {
            allowUnknown: true,
            convert: false,
        });
        if (error) return error;
        for (const sys1 of this.config.systems || []) {
            let mainCount = 0;
            for (const sys2 of this.config.systems || []) {
                if (sys1 !== sys2 && sys1.name === sys2.name) {
                    return new Error("Systems have the same name");
                }
                if (sys2.isMain) mainCount++;
            }
            if (mainCount == 0) {
                return new Error("There must be a main system");
            }
            else if (mainCount > 1) {
                return new Error("There must be only one main system");
            }

            sys1.severity = sys1.severity || Severity.medium;
        }

        return null;
    }


    async load() {
        if (Date.now() - this.lastLoadedTime < this.lastLoadThreshold && this.selfConfig) {
            return this.Config;
        }

        this.oldConfig = this.config;

        this.selffsPath = GetWorkspaceFolders()[0].uri.fsPath;
        this.selfConfig = (await this.loadRoot(this.selffsPath, true))?.config;
        if (!this.selfConfig) {
            logger.toastError("Config", "no miisync.json file found");
            return null;
        }

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
        if (error) {
            logger.toastError("Config", error);
            return null;
        }
        this.lastLoadedTime = Date.now();
        this.setCurrentSystem();
        this.isConfigChanged();
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
        this.setCurrentSystem();
        this.isConfigChanged();
    }

    private isConfigChanged() {
        if (!deepEqual(this.oldConfig, this.config)) {
            this.onConfigChange.fire(this.config);
            if (!deepEqual(this.oldConfig?.systems, this.config?.systems)) {
                this.onSystemsChange.fire(this.config.systems);
            }
            this.checkToggles();
        }
    }

    private checkToggles() {
        SetContextValue('uploadonsave', this.config.uploadOnSave);
        SetContextValue('downloadonopen', this.config.downloadOnOpen)
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
            this.currentSystem = candidate;
            this.currentSystem.isMain = true;
        }
    }

    private async loadRoot(fsPath: string, self: boolean): Promise<{ config: UserConfig, fsPath: string }> {
        const configs = await TryLoadConfigs(fsPath);
        if (configs?.length) {
            const config: UserConfig = configs[0];
            if (!config) return null;
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