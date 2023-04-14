import path = require("path");
import { UserConfig, validateConfig } from "../modules/config";
import statusBar, { Icon } from "../ui/statusbar";
import { TextDocument } from "vscode";
import fetch from 'node-fetch';
import logger from "../ui/logger";
import { GetRemotePath, InsertWeb, ValidatePath } from "../modules/file";
import { getFileService, listFoldersService, saveFileService } from "../modules/miiservice";
import { XMLParser } from "fast-xml-parser";

async function ValidateContext(userConfig: UserConfig, auth: string) {
    let folderPath = GetRemotePath("", userConfig);
    const url = listFoldersService.get(userConfig.host, userConfig.port, folderPath);

    const data = await SimpleFetch("Validate Context", url, { auth: auth });
    const parser = new XMLParser({
        ignoreAttributes: false, isArray(tagName, jPath, isLeafNode, isAttribute) {
            return tagName == "Row";
        },
    });
    let folders = parser.parse(data);
    return folders?.Rowsets?.Rowset?.Row?.length > 0;
}


export async function UploadFile(document: TextDocument, userConfig: UserConfig) {
    const filePath = document.fileName;
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const sourcePath = GetRemotePath(filePath, userConfig);
    const url = saveFileService.get(userConfig.host, userConfig.port, sourcePath);

    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Context doesn't exist");
        return;
    }

    statusBar.updateBar('Sending', Icon.spinLoading);
    await SimpleFetch("Upload File", url, { body: "Content=" + base64Content, auth })
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}



async function SimpleFetch(source: string, url: string, fetchProperties?: { body?: string, auth?: string }, callbacks?: { then?: (data: string) => any, catch?: (error: any) => any }) {
    let headers = { "Content-Type": "application/x-www-form-urlencoded" }
    if (fetchProperties?.auth)
        headers["Authorization"] = 'Basic ' + fetchProperties?.auth;
    const body = fetchProperties?.body ? fetchProperties.body : null;
    return await fetch(url, {
        method: "POST",
        body,
        headers
    })
        .then((response) => {
            logger.info(source + ": " + response.status + "-" + response.statusText);
            return response.text()
        }).then((data) => {
            if (callbacks?.then)
                callbacks.then(data);
            else
                logger.info(source + ": " + data);

            return data;
        })
        .catch((error) => {
            if (callbacks?.catch)
                callbacks.catch(error);
            else
                logger.error(source + ": " + error);
            return error;
        });
}
