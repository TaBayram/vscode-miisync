import * as path from 'path';
import { exportProjectService } from "../miiservice/exportprojectservice.js";
import { configManager } from "../modules/config.js";
import { GetRemotePath } from "../modules/file.js";
import { DoesRemotePathExist } from "../transfer/gate.js";
import logger from "../ui/logger.js";

export async function OnCommandDownloadProject(){
    const userConfig = await configManager.load();
    if (!userConfig) return;
    const sourcePath = GetRemotePath("", userConfig);
    const parentPath = path.dirname(sourcePath).replaceAll(path.sep, "/");

    if (!await DoesRemotePathExist(userConfig,configManager.CurrentSystem)) {
        logger.error("Remote Path doesn't exist");
        return;
    }
    exportProjectService.call({host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port}, parentPath);
    return;
}