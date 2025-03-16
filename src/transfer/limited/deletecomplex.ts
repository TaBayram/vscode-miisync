import { System, UserConfig } from "../../extension/system";
import { blowoutService } from "../../miiservice/blowoutservice";
import { deleteBatchService } from "../../miiservice/deletebatchservice";
import { GetRemotePath, ValidatePath } from "../../modules/file";
import { SimpleFolder } from "../../types/miisync";
import logger from "../../ui/logger";
import limitManager, { LimitedReturn } from "./limited";

/**
 * @description if the folder has empty files and folders properties, it means delete everything
 */
export async function DeleteComplexLimited(folder: SimpleFolder, userConfig: UserConfig, system: System): Promise<LimitedReturn<null>> {
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
        limitManager.createWindow('Deleting', () => aborted = true)

        await deleteRecursive(folder);
        do {
            await Promise.all(promises);
        }
        while (limitManager.OngoingCount != 0);

        limitManager.endProgress();
        return {
            aborted
        };
    } catch (error: any) {
        limitManager.endProgress();
        throw Error(error);
    }

    async function deleteRecursive(folder: SimpleFolder) {
        if (aborted) return;
        if (!await ValidatePath(folder.path, userConfig)) return;
        const totalSubItems = folder.files.length + folder.folders.length;
        if (totalSubItems == 0) {
            promises.push(
                limitManager.newRemote(async () => {
                    if (aborted) return;
                    return deleteResource(folder.path);
                })
            );
            return;
        }
        for (let index = 0; index < folder.files.length; index++) {
            const file = folder.files[index].path;
            if (!await ValidatePath(file, userConfig)) continue;
            if (aborted) return;
            promises.push(
                limitManager.newRemote(async () => {
                    if (aborted) return;
                    return deleteResource(file);
                })
            );
        }
        promises.push(...(folder.folders || []).map(folder => {
            return limitManager.newLocal(() => deleteRecursive(folder));
        }));
    }

    async function deleteResource(localPath: string) {
        const remotePath = GetRemotePath(localPath, userConfig);
        const response = await deleteBatchService.call(system, remotePath);
        if (response) {
            await blowoutService.call(system, remotePath);
        }
        return response;
    }
}