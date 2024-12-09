import { readFile } from "fs-extra";
import { System, UserConfig } from "../../extension/system";
import { IsFatalResponse } from "../../miiservice/abstract/filters";
import { createFolderService } from "../../miiservice/createfolderservice";
import { existsService } from "../../miiservice/existsservice";
import { saveFileService } from "../../miiservice/savefileservice";
import { GetAllFilesInDirTree, GetRemotePath, ValidatePath } from "../../modules/file";
import { SimpleFolder } from "../../types/miisync";
import logger from "../../ui/logger";
import limitManager, { LimitedReturn } from "./limited";

/**
 * @description if the folder has empty files and folders properties, it means upload everything inside rather than upload the folder only
 */
export async function UploadComplexLimited(folder: SimpleFolder, userConfig: UserConfig, system: System): Promise<LimitedReturn<null>> {
    if (limitManager.IsActive) {
        logger.error("There is an already existing transfer ongoing.")
        return {
            aborted: true
        }
    }
    let aborted = false;

    const promises: Promise<any>[] = [];
    try {
        limitManager.startProgress();
        limitManager.createWindow('Uploading', () => aborted = true)

        await Promise.all(fillEmptyFolders(folder));
        await uploadRecursive(folder);
        do {
            await Promise.all(promises);
        }
        while (limitManager.OngoingCount != 0);

        limitManager.endProgress();
        return { aborted };
    } catch (error: any) {
        limitManager.endProgress();
        throw Error(error);
    }

    function fillEmptyFolders(mainFolder: SimpleFolder): Promise<any>[] {
        const promises: Promise<any>[] = [];
        for (const folder of mainFolder.folders) {
            promises.push(...fillEmptyFolders(folder));
        }
        promises.push(fillEmptyFolder(mainFolder));
        return promises;
    }
    async function fillEmptyFolder(folder: SimpleFolder) {
        if (aborted) return -1;
        if ((folder.files.length + folder.folders.length) != 0) return 0;
        const filledFolder = await GetAllFilesInDirTree(folder.path);
        if (!filledFolder) return 0;
        folder.files = filledFolder.files;
        folder.folders = filledFolder.folders;
        return 1;
    }

    async function uploadRecursive(folder: SimpleFolder) {
        if (aborted) return;
        const isIgnored = !await ValidatePath(folder.path, userConfig);;
        const totalSubItems = folder.files.length + folder.folders.length;
        if (!isIgnored && totalSubItems != 1) {
            await limitManager.newRemote(() => {
                if (aborted) return;
                return createFolder(folder.path);
            });
            if (totalSubItems == 0)
                return;
        }
        for (let index = 0; index < folder.files.length; index++) {
            const file = folder.files[index].path;
            if (!await ValidatePath(file, userConfig)) continue;
            if (aborted) return;
            promises.push(
                limitManager.newLocal(() => {
                    return readFile(file).then((content) => {
                        if (aborted) return;
                        return limitManager.newRemote(() => {
                            if (aborted) return;
                            return saveFile(file, content);
                        })
                    })
                })
            );
        }
        promises.push(...(folder.folders || []).map(folder => {
            return limitManager.newLocal(() => { return uploadRecursive(folder) });
        }));
    }

    async function createFolder(file: string) {
        const folderPath = GetRemotePath(file, userConfig);
        const exist = await existsService.call(system, folderPath);
        if (exist && !IsFatalResponse(exist) && exist?.Rowsets?.Messages?.Message != "2") {
            return createFolderService.call(system, folderPath);
        }
    }

    async function saveFile(file: string, content: Buffer) {
        const sourcePath = GetRemotePath(file, userConfig);
        const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
        return saveFileService.call({ ...system, body: "Content=" + base64Content }, sourcePath);
    }

}