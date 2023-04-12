import path = require("path");
import { EXTENSION_NAME } from "../constants";
import { tryLoadConfigs, UserConfig, validateConfig } from "../modules/config";
import { getWorkspaceFolders } from "../modules/vscode";
import statusBar, { Icon } from "../ui/statusbar";
import { TextDocument } from "vscode";
import fetch from 'node-fetch';
import logger from "../ui/logger";

function ValidatePath(filePath: string, userConfig: UserConfig): boolean {
    const firstFolderName = filePath.substring(filePath.lastIndexOf(path.sep, filePath.lastIndexOf(path.sep) - 1), filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');

    if (filePath.indexOf(userConfig.context) == -1 ||
        userConfig.ignore.findIndex((value) => value.toLocaleLowerCase() == fileName.toLocaleLowerCase()) != -1 ||
        firstFolderName.startsWith('.'))
        return false;


    logger.info('path validated');
    return true;
}



export async function BasicFetch(document: TextDocument, userConfig: UserConfig) {
    const filePath = document.fileName;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        throw new Error(`Config validation fail: ${validationError.message}.`);
    }

    if (!ValidatePath(filePath, userConfig)) return;

    let sourcePath = filePath.substring(filePath.indexOf(userConfig.context));
    for (const remove of userConfig.removeFromContext) {
        sourcePath = sourcePath.replace(remove + path.sep, '');
    }
    sourcePath = (userConfig.remotePath + path.sep + sourcePath).replaceAll(path.sep, '/');


    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

    const url = `http://${userConfig.host}:${userConfig.port}/XMII/Catalog?Mode=SaveBinary&Class=Content&ObjectName=${sourcePath}&__=${new Date().getTime()}`;
    const Authorization = `Basic ${auth}`;

    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
    statusBar.updateBar('Sending', Icon.loading);

    await fetch(url, {
        method: "POST",
        body: `Content=${base64Content}`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization
        }
    })
        .then((response) => {
            logger.info(response.status + "-" + response.statusText);
            return response.text()
        }).then((data) => {
            logger.info(data);
        })
        .catch((error) => {
            logger.error(error);
        });
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });

}