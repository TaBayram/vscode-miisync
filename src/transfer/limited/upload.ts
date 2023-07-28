import { readFile } from "fs-extra";
import { settingsManager } from "../../extension/settings";
import { System } from "../../extension/system";
import { deleteBatchService } from "../../miiservice/deletebatchservice";
import { saveFileService } from "../../miiservice/savefileservice";
import { UserConfig } from "../../modules/config";
import { GetAllFilesInDirTree, GetRemotePath, SimpleFolder, ValidatePath } from "../../modules/file";
import logger from "../../ui/logger";
import { CreateProgressWindow } from "../../ui/progresswindow";
import { IsProgressActive, LimitedReturn, SetProgressActive } from "./limited";
import pLimit = require("p-limit");
import path = require("path");


export async function UploadFolderLimited(folderPath: string, userConfig: UserConfig, system: System): Promise<LimitedReturn<null>> {
    if(IsProgressActive()){
        logger.error("There is an already existing transfer ongoing.")
        return {
            aborted: true
        }
    }
    const limit = pLimit(settingsManager.Settings.requestLimit);
    let maxQueue = 0, aborted = false;

    const folder = await GetAllFilesInDirTree(folderPath);

    const promises: Promise<any>[] = [];
    const progressData = CreateProgressWindow(path.basename(folderPath), () => aborted = true);
    SetProgressActive(true);

    const deletePaths = [];
    await deep(folder);

    for (const path of deletePaths) {
        const sourcePath = GetRemotePath(path, userConfig);
        promises.push(nlimit(() => deleteBatchService.call({ host: system.host, port: system.port }, sourcePath)));
    }

    while (limit.activeCount != 0) {
        await Promise.all(promises.map((promise) => promise.then(updateProgress)));
    }

    progressData.end();
    SetProgressActive(false);

    return {
        aborted
    };

    async function deep(folder: SimpleFolder) {
        if (aborted) return;
        //todo: find a way to create a folder in the system instead of this.
        if (!await ValidatePath(folder.path, userConfig)) return;

        const totalSubItems = folder.files.length + folder.folders.length;
        if (totalSubItems != 1) {
            const deletePath = path.join(folder.path, '.delete');
            await nlimit(() => {
                if (aborted) return;
                return saveFile(deletePath, Buffer.from('delete'))
            });
            deletePaths.push(deletePath);
            if (totalSubItems == 0)
                return;
        }


        for (let index = 0; index < folder.files.length; index++) {
            const file = folder.files[index];
            if (!await ValidatePath(file, userConfig)) continue;
            if (aborted) return;
            promises.push(
                readFile(file)
                    .then((content) => {
                        if (aborted) return;
                        return nlimit(() => {
                            if (aborted) return;
                            return saveFile(file, content);
                        })
                    })
            );
        }
        /* 
                for (let index = 0; index < folder.folders.length; index++) {
                    const cFolder = folder.folders[index];
                    await deep(cFolder);
                } */

        await Promise.all((folder.folders || []).map(folder => {
            return deep(folder);
        }));

    }

    async function saveFile(file: string, content: Buffer) {
        const sourcePath = GetRemotePath(file, userConfig);
        const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
        return saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
    }

    function updateProgress() {
        const status = Math.min(99, Math.max(0, Math.round((maxQueue - (limit.activeCount + limit.pendingCount)) / maxQueue * 100)));
        progressData.percent = status;
    }

    function nlimit<T>(fn: () => T | PromiseLike<T>): Promise<T> {
        const prom = limit(fn);
        maxQueue = Math.max(limit.activeCount + limit.pendingCount, maxQueue);
        updateProgress();
        return prom;
    }


}