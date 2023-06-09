import { mkdir, outputFile } from "fs-extra";
import { settingsManager } from "../../extension/settings";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { readFileService } from "../../miiservice/readfileservice";
import { SystemConfig } from "../../modules/config";
import logger from "../../ui/logger";
import { CreateProgressWindow } from "../../ui/progresswindow";
import { IsProgressActive, LimitedReturn, SetProgressActive } from "./limited";
import pLimit = require("p-limit");
import path = require("path");

export async function DownloadFolderLimited({ host, port }: SystemConfig, sourcePath: string, getPath: (item: File | Folder) => string): Promise<LimitedReturn<Directory>> {
    if(IsProgressActive()){
        logger.error("There is an already existing transfer ongoing.")
        return {
            aborted: true,
            data: []
        }
    }
    const limit = pLimit(settingsManager.Settings.requestLimit);
    let maxQueue = 0, aborted = false;

    const directory: Directory = [];
    const parentPath = path.dirname(sourcePath) == "." ? "" : path.dirname(sourcePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);

    const root = rootFolders?.Rowsets?.Rowset?.Row?.find((folder: Folder) => folder.Path == sourcePath);
    if (!root) {
        logger.error("Root folder doesn't exist.")
        return {
            aborted: true,
            data: directory
        };
    }

    const promises: Promise<any>[] = [];
    const progressData = CreateProgressWindow(root.FolderName, () => aborted = true);
    SetProgressActive(true);

    directory.push(root);
    await deep(root);

    while (limit.activeCount != 0) {
        await Promise.all(promises.map((promise) => promise.then(updateProgress)));
    }

    progressData.end();
    SetProgressActive(false);

    return {
        aborted,
        data: directory
    };

    async function deep(mainFolder: Folder): Promise<void> {
        if (aborted) return;
        
        mainFolder.children = [];
        if (mainFolder.ChildFileCount == 0 && mainFolder.ChildFolderCount == 0) {
            mkdir(getPath(mainFolder), { recursive: true });
            return;
        }
        if (mainFolder.ChildFileCount != 0) {
            promises.push(nlimit(() => {
                if (aborted) return;
                listFilesService.call({ host, port }, mainFolder.Path).then((files) => {
                    if (aborted) return;
                    for (const file of files?.Rowsets?.Rowset?.Row || []) {
                        mainFolder.children.push(file);
                        promises.push(nlimit(() => {
                            if (aborted) return;
                            return downloadFile(file);
                        }));
                    }
                });
            }));

        }
        if (mainFolder.ChildFolderCount != 0) {
            const folders = await nlimit(() => {
                if (aborted) return;
                return listFoldersService.call({ host: host, port: port }, mainFolder.Path);
            });
            if (aborted) return;
            await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
                if (folder.IsWebDir) {
                    mainFolder.children.push(folder);
                    return deep(folder);
                }
                return;
            }));
        }

        return;
    }

    async function downloadFile(file: File) {
        const filePath = getPath(file);
        const binary = await readFileService.call({ host, port }, file.FilePath + "/" + file.ObjectName);
        const payload = binary?.Rowsets?.Rowset?.Row.find((row) => row.Name == "Payload");
        if (payload) {
            outputFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" }).catch(error => logger.error(error));
        }
        return;
    }

    function nlimit<T>(fn: () => T | PromiseLike<T>): Promise<T> {
        const prom = limit(fn);
        maxQueue = Math.max(limit.activeCount + limit.pendingCount, maxQueue);
        updateProgress();
        return prom;
    }


    function updateProgress() {
        const status = Math.min(99, Math.max(0, Math.round((maxQueue - (limit.activeCount + limit.pendingCount)) / maxQueue * 100)));
        progressData.percent = status;
    }

}