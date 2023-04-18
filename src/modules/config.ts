import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as Joi from 'joi';
import { CONFIG_PATH, EXTENSION_NAME } from '../constants';
import { getWorkspaceFolders, showTextDocument } from './vscode';

const nullable = schema => schema.optional().allow(null);

const configScheme = Joi.object({
    context: Joi.string().required(),
    removeFromContext: Joi.array<string>(),
    remotePath: Joi.string().required(),
    host: Joi.string().required().required(),
    port: Joi.number().integer().required(),
    username: Joi.string().required(),
    password: Joi.string(),
    uploadOnSave: Joi.boolean(),
    ignore: Joi.array<string>(),
    rootConfig: Joi.string(),
    useRootConfig: Joi.boolean()
});

export interface UserConfig {
    context?: string,
    removeFromContext?: string[],
    remotePath?: string,
    host?: string,
    port?: number,
    username?: string,
    password?: string,
    uploadOnSave?: boolean,
    ignore?: string[],
    useRootConfig?: boolean,
    rootConfig?: string,
}

function GetWorkspaceConfig(): UserConfig {
    const conf = vscode.workspace.getConfiguration(EXTENSION_NAME);
    return {
        host: conf.get("host", "localhost"),
        port: conf.get("port", 22),
        username: conf.get("username", "username"),
        password: conf.get("password", '1234'),
        context: conf.get("context", '/'),
        removeFromContext: conf.get("removeFromContext", ['webapp']),
        remotePath: conf.get("remotePath", '/'),
        uploadOnSave: true,
        ignore: conf.get('ignore', ['package.json', 'package-lock.json', 'tsconfig.json', '.*']),
        useRootConfig: conf.get('useRootConfig', false),
        rootConfig: conf.get('rootConfig', '')
    }
}

const defaultConfig = {};

function mergedDefault(config) {
    return {
        ...defaultConfig,
        ...config,
    };
}

function getConfigPath(basePath) {
    return path.join(basePath, CONFIG_PATH);
}

function readConfigsFromFile(configPath): Promise<any[]> {
    return fse.readJson(configPath).then(config => {
        const configs = Array.isArray(config) ? config : [config];
        return configs.map(mergedDefault);
    });
}

function tryLoadConfigs(workspace): Promise<any[]> {
    const configPath = getConfigPath(workspace);
    return fse.pathExists(configPath).then(
        exist => {
            if (exist) {
                return readConfigsFromFile(configPath);
            }
            return [];
        },
        _ => []
    );
}


export function newConfig(basePath) {
    const configPath = getConfigPath(basePath);

    return fse
        .pathExists(configPath)
        .then(exist => {
            if (exist) {
                return showTextDocument(vscode.Uri.file(configPath));
            }
            return fse
                .outputJson(
                    configPath,
                    GetWorkspaceConfig(),
                    { spaces: 4 }
                )
                .then(() => showTextDocument(vscode.Uri.file(configPath)));
        })
        .catch(console.error);
}


class ConfigManager {
    private useRoot: boolean;
    private rootfsPath: string;
    private rootConfig: UserConfig;

    private selffsPath: string;
    private selfConfig: UserConfig;

    get Config(){
        return this.useRoot ? this.rootConfig : this.selfConfig;
    }

    constructor(){

    }
    validate() {
        const { error } = configScheme.validate(this.Config, {
            allowUnknown: true,
            convert: false,
        });
        return error;
    }


    async load() {
        this.selffsPath = getWorkspaceFolders()[0].uri.fsPath;
        this.selfConfig = (await this.loadRoot(this.selffsPath, true)).config;
        this.useRoot = false;
        if (this.selfConfig.useRootConfig) {
            const root = await this.loadRoot(this.selffsPath, false);
            if (root) {
                this.rootConfig = root.config;
                this.rootfsPath = root.fsPath;
                this.useRoot = true;
                return root.config;
            }
        }
        return this.selfConfig;
    }

    async update(config: UserConfig) {
        if (!this.useRoot) {
            this.selfConfig = config;
            fse.outputJson(getConfigPath(this.selffsPath), config, { spaces: 4 });
        }
        else {
            this.rootConfig = config;
            fse.outputJson(getConfigPath(this.rootfsPath), config, { spaces: 4 });
        }
    }

    private async loadRoot(fsPath: string, self: boolean): Promise<{ config: UserConfig, fsPath: string }> {
        const configs = await tryLoadConfigs(fsPath);
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