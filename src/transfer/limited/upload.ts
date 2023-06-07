import { readFile } from "fs-extra";
import { deleteBatchService } from "../../miiservice/deletebatchservice";
import { saveFileService } from "../../miiservice/savefileservice";
import { SystemConfig, UserConfig } from "../../modules/config";
import { GetAllFilesInDirTree, GetRemotePath, SimpleFolder, ValidatePath } from "../../modules/file";
import { CreateProgressWindow } from "../../ui/progresswindow";
import pLimit = require("p-limit");
import path = require("path");


export async function UploadFolderLimited(folderPath: string, userConfig: UserConfig, system: SystemConfig) {
    const limit = pLimit(40);
    let maxQueue = 0, aborted = false;

    function nlimit(fn: () => void | PromiseLike<any>): Promise<any> {
        const prom = limit(fn);
        maxQueue = Math.max(limit.activeCount + limit.pendingCount, maxQueue);
        updateProgress();
        return prom;
    }

    const folder = await GetAllFilesInDirTree(folderPath);

    const promises: Promise<any>[] = [];
    const progressData = CreateProgressWindow(path.basename(folderPath));

    const deletePaths = [];
    await deep(folder);

    async function deep(folder: SimpleFolder) {
        //todo: find a way to create a folder in the system instead of this.
        const totalSubItems = folder.files.length + folder.folders.length;
        if (totalSubItems != 1) {
            const deletePath = path.join(folder.path, '.delete');
            await nlimit(() => saveFile(deletePath, Buffer.from('delete')));
            deletePaths.push(deletePath);
            if (totalSubItems == 0)
                return;
        }


        for (let index = 0; index < folder.files.length; index++) {
            const file = folder.files[index];
            if (!await ValidatePath(file, userConfig)) continue;
            promises.push(readFile(file)
                .then((content) => nlimit(() => saveFile(file, content)))
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

    for (const path of deletePaths) {
        const sourcePath = GetRemotePath(path, userConfig);
        promises.push(nlimit(() => deleteBatchService.call({ host: system.host, port: system.port }, sourcePath)));
    }

    while (limit.activeCount != 0) {
        await Promise.all(promises.map((promise) => promise.then(updateProgress)));
    }

    function updateProgress() {
        const status = Math.min(99, Math.max(0, Math.round((maxQueue - (limit.activeCount + limit.pendingCount)) / maxQueue * 100)));
        progressData.percent = status;
    }
    progressData.end();
}