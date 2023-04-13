import path = require("path");
import { EXTENSION_NAME } from "../constants";
import { tryLoadConfigs, UserConfig, validateConfig } from "../modules/config";
import { getWorkspaceFolders } from "../modules/vscode";
import statusBar, { Icon } from "../ui/statusbar";
import { TextDocument } from "vscode";
import fetch from 'node-fetch';
import logger from "../ui/logger";
import { GetRemotePath, ValidatePath } from "../modules/file";
import { saveFileService } from "../modules/miiservice";


export async function SyncFile(document: TextDocument, userConfig: UserConfig) {
    const filePath = document.fileName;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const validationError = validateConfig(userConfig);
    if (validationError) {
        logger.error(validationError.message)
        return;
    }
    if (!ValidatePath(filePath, userConfig)) return;
    const sourcePath = GetRemotePath(filePath, userConfig);
    const url = saveFileService.get(userConfig.host, userConfig.port, sourcePath);

    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));
    const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));

    statusBar.updateBar('Sending', Icon.loading);
    await SimpleFetch("Sync File", url, "Content=" + base64Content, auth)
    statusBar.updateBar("Done " + fileName, Icon.success, { duration: 3 });
}



async function SimpleFetch(source: string, url: string, body: string, auth?: string) {
    let headers = { "Content-Type": "application/x-www-form-urlencoded" }
    if (auth)
        headers["Authorization"] = 'Basic ' + auth;

    await fetch(url, {
        method: "POST",
        body,
        headers
    })
        .then((response) => {
            logger.info(source + ": " + response.status + "-" + response.statusText);
            return response.text()
        }).then((data) => {
            logger.info(source + ": " + data);
        })
        .catch((error) => {
            logger.error(source + ": " + error);
        });
}