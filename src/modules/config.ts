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
    context: string,
    removeFromContext: string[],
    remotePath: string,
    host: string,
    port: number,
    username: string,
    password: string,
    uploadOnSave: boolean,
    ignore: string[],
    useRootConfig: boolean,
    rootConfig: string,
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


const defaultConfig = {

};

function mergedDefault(config) {
    return {
        ...defaultConfig,
        ...config,
    };
}

function getConfigPath(basePath) {
    return path.join(basePath, CONFIG_PATH);
}

export function validateConfig(config) {
    const { error } = configScheme.validate(config, {
        allowUnknown: true,
        convert: false,
    });
    return error;
}

export function readConfigsFromFile(configPath): Promise<any[]> {
    return fse.readJson(configPath).then(config => {
        const configs = Array.isArray(config) ? config : [config];
        return configs.map(mergedDefault);
    });
}

export function tryLoadConfigs(workspace): Promise<any[]> {
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

export async function LoadUserConfig(fsPath?: string): Promise<UserConfig> {
    fsPath = fsPath ? fsPath : getWorkspaceFolders()[0].uri.fsPath;
    let configs = await tryLoadConfigs(fsPath);
    if (configs && configs.length != 0 && configs) {
        let userConfig: UserConfig = configs[0];
        if (userConfig.useRootConfig && path.relative(userConfig.rootConfig, fsPath).trim() != '') {
            let parentConfig = await LoadUserConfig(path.resolve(fsPath, userConfig.rootConfig));
            if (parentConfig)
                return parentConfig;
        }
        return userConfig;
    }
    return null;
}

// export function getConfig(activityPath: string) {
//   const config = configTrie.findPrefix(normalizePath(activityPath));
//   if (!config) {
//     throw new Error(`(${activityPath}) config file not found`);
//   }

//   return normalizeConfig(config);
// }



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


export function updateConfig(userConfig: UserConfig, basePath) {
    const configPath = getConfigPath(basePath);
    fse.outputJson(configPath, userConfig, { spaces: 4 });
}