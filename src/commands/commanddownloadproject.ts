import { ValidateContext } from "../extension/transfer/gate.js";
import { exportProjectService } from "../miiservice/exportprojectservice.js";
import { configManager } from "../modules/config.js";
import { GetRemotePath } from "../modules/file.js";
import logger from "../ui/logger.js";
import path = require("path");

export async function OnCommandDownloadProject(){
    const userConfig = await configManager.load();
    if (!userConfig) return;
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");
    const auth = encodeURIComponent(Buffer.from(userConfig.username + ":" + userConfig.password).toString('base64'));

    if (!await ValidateContext(userConfig, auth)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    exportProjectService.call({host: userConfig.host, port: userConfig.port}, parentPath);
    return;
}