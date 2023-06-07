import { mkdir, outputFile } from "fs-extra";
import { Directory, File, Folder } from "../../miiservice/abstract/responsetypes";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { readFileService } from "../../miiservice/readfileservice";
import { SystemConfig } from "../../modules/config";
import logger from "../../ui/logger";
import { CreateProgressWindow } from "../../ui/progresswindow";
import pLimit = require("p-limit");
import path = require("path");

export async function DownloadFolderLimited({ host, port }: SystemConfig, sourcePath: string, getPath: (item: File | Folder) => string) {
    const limit = pLimit(40);
    let maxQueue = 0, aborted = false;

    function nlimit(fn: () => void | PromiseLike<any>): Promise<any> {
        const prom = limit(fn);
        maxQueue = Math.max(limit.activeCount + limit.pendingCount, maxQueue);
        updateProgress();
        return prom;
    }

    const directory: Directory = [];
    const parentPath = path.dirname(sourcePath) == "." ? "" : path.dirname(sourcePath);
    const rootFolders = await listFoldersService.call({ host, port }, parentPath);

    const root = rootFolders?.Rowsets?.Rowset?.Row?.find((folder: Folder) => folder.Path == sourcePath);
    if (!root) {
        logger.error("Root folder doesn't exist.")
        return directory;
    }

    const promises: Promise<any>[] = [];
    const progressData = CreateProgressWindow(root.FolderName);
    directory.push(root);
    await deep(root);

    async function deep(mainFolder: Folder): Promise<void> {
        mainFolder.children = [];
        if (mainFolder.ChildFileCount == 0 && mainFolder.ChildFolderCount == 0) {
            mkdir(getPath(mainFolder), { recursive: true });
            return;
        }
        if (mainFolder.ChildFileCount != 0) {
            promises.push(nlimit(() => {
                listFilesService.call({ host, port }, mainFolder.Path).then((files) => {
                    for (const file of files?.Rowsets?.Rowset?.Row || []) {
                        mainFolder.children.push(file);
                        promises.push(nlimit(() => downloadFile(file)));
                    }
                });
            }));

        }
        if (mainFolder.ChildFolderCount != 0) {
            const folders = await nlimit(() => listFoldersService.call({ host: host, port: port }, mainFolder.Path));
            await Promise.all((folders?.Rowsets?.Rowset?.Row || []).map(folder => {
                if (folder.IsWebDir) {
                    mainFolder.children.push(folder);
                    return deep(folder)
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


    while(limit.activeCount != 0){
        await Promise.all(promises.map((promise) => promise.then(updateProgress)));
    }
    

    function updateProgress() {
        const status = Math.min(99, Math.max(0, Math.round((maxQueue - (limit.activeCount + limit.pendingCount)) / maxQueue * 100)));
        progressData.percent = status;
    }
    progressData.end();


    return directory;
}