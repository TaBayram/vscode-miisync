import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as Joi from 'joi';
import { CONFIG_PATH } from '../constants';
import { showTextDocument } from './vscode';

const nullable = schema => schema.optional().allow(null);

const configScheme = Joi.object({
    context: Joi.string(),
    removeFromContext: Joi.array<string>(),
    remotePath: Joi.string(),
    host: Joi.string().required(),
    port: Joi.number().integer(),
    username: Joi.string().required(),
    password: nullable(Joi.string()),
});

export interface UserConfig {
    context: string,
    removeFromContext: string[],
    remotePath: string,
    host: string,
    port: number,
    username: string,
    password: string,
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
                    {
                        host: 'localhost',
                        port: 22,
                        username: 'username',
                        password: '',
                        context: '/',
                        removeFromContext: ['webapp'],
                        remotePath: '/',
                    },
                    { spaces: 4 }
                )
                .then(() => showTextDocument(vscode.Uri.file(configPath)));
        })
        .catch(console.error);
}
