import { mkdir, outputFile } from "fs-extra";
import * as path from 'path';
import { System, UserConfig } from "../../extension/system";
import { IsFatalResponse } from "../../miiservice/abstract/filters";
import { File, Folder } from "../../miiservice/abstract/responsetypes";
import { listFilesService } from "../../miiservice/listfilesservice";
import { listFoldersService } from "../../miiservice/listfoldersservice";
import { readFileService } from "../../miiservice/readfileservice";
import { GetRemotePath } from "../../modules/file";
import { ComplexFolder } from "../../types/miisync";
import logger from "../../ui/logger";
import { DoesFolderExist } from "../gate";
import limitManager, { LimitedReturn } from "./limited";

/**
 * @description if the folder has empty files and folders properties, it means download everything inside rather than download the folder only
 */
export async function DownloadComplexLimited(folder: ComplexFolder, getPath: (item: File | Folder) => string, userConfig: UserConfig, system: System): Promise<LimitedReturn<null>> {
    if (limitManager.IsActive) {
        logger.error("There is an already existing transfer ongoing.")
        return {
            aborted: true
        }
    }

    let aborted = false;

    const remotePathRoot = folder.isRemotePath ? folder.path : GetRemotePath(folder.path, userConfig);
    const folderExists = await DoesFolderExist(remotePathRoot, system);
    if (!folderExists) {
        logger.error("Folder doesn't exist.")
        return { aborted: true, };
    }

    limitManager.startProgress();
    limitManager.createWindow('Preparing Download', () => aborted = true)
    let fileCount = 0;
    let promises: Promise<any>[] = [];

    await getChildren(folder);
    do {
        await Promise.all(promises);
    }
    while (limitManager.OngoingCount != 0);


    if (aborted) {
        limitManager.endProgress();
        return { aborted };
    }
    limitManager.createWindow('Downloading', () => aborted = true)
    limitManager.MaxQueue = 0;
    limitManager.Finished = 0;
    promises = [];

    await downloadFiles(folder);
    do {
        await Promise.all(promises);
    }
    while (limitManager.OngoingCount != 0);

    limitManager.endProgress();

    return { aborted };

    async function getChildren(mainFolder: ComplexFolder) {
        if (aborted) return;
        if (!mainFolder.folder) {
            const sourcePath = mainFolder.isRemotePath ? mainFolder.path : GetRemotePath(mainFolder.path, userConfig);
            const parentPath = path.dirname(sourcePath) == "." ? "" : path.dirname(sourcePath);
            const parentFolder = await listFoldersService.call({ host: system.host, port: system.port }, parentPath);
            if (!parentFolder || IsFatalResponse(parentFolder)) return;
            const folder = parentFolder?.Rowsets?.Rowset?.Row?.find((folder: Folder) => folder.Path == sourcePath);
            mainFolder.folder = folder;
        }
        if (mainFolder.files.length == 0 && mainFolder.folders.length == 0) {
            if (mainFolder.folder.ChildFileCount != 0) {
                fileCount += mainFolder.folder.ChildFileCount;
                const filePromise = limitManager.newRemote(async () => {
                    if (aborted) return;
                    const files = await listFilesService.call({ host: system.host, port: system.port }, mainFolder.folder.Path);
                    if (aborted) return;
                    if (!files || IsFatalResponse(files)) return;
                    mainFolder.files = files?.Rowsets?.Rowset?.Row?.map((cFile) => { return { file: cFile, path: null } }) || [];

                })
                promises.push(filePromise);
            }
            if (mainFolder.folder.ChildFolderCount != 0) {
                const folderPromise = limitManager.newRemote(async () => {
                    if (aborted) return;
                    const folders = await listFoldersService.call({ host: system.host, port: system.port }, mainFolder.folder.Path);
                    if (aborted) return;
                    if (!folders || IsFatalResponse(folders)) return;
                    mainFolder.folders = folders?.Rowsets?.Rowset?.Row?.map((cFolder) => { return { folder: cFolder, path: null, files: [], folders: [] } }) || [];

                    for (const folder of mainFolder.folders) {
                        promises.push(limitManager.newRemote(() => getChildren(folder)));
                    }
                })
                promises.push(folderPromise);
            }
        }
        else {
            fileCount += mainFolder.files.length;
            for (const folder of mainFolder.folders) {
                promises.push(limitManager.newRemote(() => getChildren(folder)));
            }
        }
    }

    async function downloadFiles(mainFolder: ComplexFolder) {
        if (aborted) return;
        if (mainFolder.folder.ChildFileCount == 0 && mainFolder.folder.ChildFolderCount == 0) {
            const path = (!mainFolder.isRemotePath && mainFolder.path) ? mainFolder.path : getPath(mainFolder.folder);
            mkdir(path, { recursive: true });
            return;
        }

        for (const file of mainFolder.files) {
            promises.push(limitManager.newRemote(() => {
                if (aborted) return;
                return downloadFile(file);
            }));
        }
        for (const folder of mainFolder.folders) {
            downloadFiles(folder);
        }
    }

    async function downloadFile({ file, path }: { path: string; file?: File; }) {
        const filePath = path || getPath(file);
        const remotePath = file ? (file.FilePath + "/" + file.ObjectName) : GetRemotePath(path, userConfig);
        const response = await readFileService.call({ host: system.host, port: system.port }, remotePath);
        if (aborted) return;
        if (response && !IsFatalResponse(response)) {
            const payload = response?.Rowsets?.Rowset?.Row.find((row) => row.Name == "Payload");
            if (payload) {
                outputFile(filePath, Buffer.from(payload.Value, 'base64'), { encoding: "utf8" }).catch(error => logger.error(error));
            }
        }
        return;
    }

}