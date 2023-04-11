import path = require("path");
import { EXTENSION_NAME } from "../constants";
import { tryLoadConfigs, UserConfig } from "../modules/config";
import { getWorkspaceFolders } from "../modules/vscode";
import { updateState, Icon } from "../ui/statusbar";
import { TextDocument } from "vscode";
import fetch from 'node-fetch';


function IsNonPassableFile(fileName: string) {
    fileName = fileName.toLocaleLowerCase();
    return fileName == 'package.json' ||
        fileName == 'package-lock.json' ||
        fileName == 'tsconfig.json';

}

export async function BasicFetch(document: TextDocument) {
    const filePath = document.fileName;
    const fileName = filePath.substring(filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    const firstFolderName = filePath.substring(filePath.lastIndexOf(path.sep, filePath.lastIndexOf(path.sep) - 1), filePath.lastIndexOf(path.sep)).replace(path.sep, '');
    if (firstFolderName[0] == '.' || fileName[0] == '.' || IsNonPassableFile(fileName)) {
        return;
    }


    const configs = await tryLoadConfigs(getWorkspaceFolders()[0].uri.fsPath);
    if (configs && configs.length != 0) {
        const userConfig: UserConfig = configs[0];
        let sourcePath = filePath.substring(filePath.indexOf(userConfig.context));
        for (const remove of userConfig.removeFromContext) {
            sourcePath = sourcePath.replace(remove + path.sep, '');
        }
        sourcePath = (userConfig.remotePath + path.sep + sourcePath).replaceAll(path.sep, '/');


        const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

        const url = `http://${userConfig.host}:${userConfig.port}/XMII/Catalog?Mode=SaveBinary&Class=Content&ObjectName=${sourcePath}&__=${new Date().getTime()}`;
        const Authorization = `Basic ${auth}`;

        const base64Content = encodeURIComponent(Buffer.from(document.getText() || " ").toString('base64'));
        updateState('Sending', Icon.loading);

        await fetch(url, {
            method: "POST",
            body: `Content=${base64Content}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization
            }
        })
            .then((response) => {
                console.log(response.status + "-" + response.statusText);
                return response.text()
            }).then((data) => {
                console.log('data: ' + (data));
            })
            .catch((error) => {
                console.log("Sync Fetch Error:" + error);
            });
        updateState(EXTENSION_NAME, Icon.success);

    }
    console.log(configs);


}