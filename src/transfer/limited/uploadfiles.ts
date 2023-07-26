import { exists, readFile } from "fs-extra";
import { Uri } from "vscode";
import { settingsManager } from "../../extension/settings";
import { System } from "../../extension/system";
import { saveFileService } from "../../miiservice/savefileservice";
import { UserConfig } from "../../modules/config";
import { GetRemotePath, ValidatePath } from "../../modules/file";
import logger from "../../ui/logger";
import { CreateProgressWindow } from "../../ui/progresswindow";
import { IsProgressActive, LimitedReturn, SetProgressActive } from "./limited";
import pLimit = require("p-limit");


export async function UploadFilesLimited(files: Uri[], userConfig: UserConfig, system: System): Promise<LimitedReturn<null>> {
    if (IsProgressActive()) {
        logger.error("There is an already existing transfer ongoing.")
        return {
            aborted: true
        }
    }
    const limit = pLimit(settingsManager.Settings.requestLimit);
    let maxQueue = 0, aborted = false;

    const promises: Promise<any>[] = [];
    const progressData = CreateProgressWindow("Files", () => aborted = true);
    SetProgressActive(true);

    for (const file of files) {
        await upload(file.fsPath);
    }

    while (limit.activeCount != 0 || limit.pendingCount != 0 || (promises.length != 0 && !aborted)) {
        await Promise.all(promises);
    }

    progressData.end();
    SetProgressActive(false);

    return {
        aborted
    };

    async function upload(file: string) {
        if (aborted) return;

        if (!await ValidatePath(file, userConfig)) return;
        if (aborted) return;
        const promise =
            createPromise(file)
                .catch((error) => {
                    logger.error(file + ' : ' + error.toString());
                }).finally(() => {
                    const index = promises.findIndex((fProm) => fProm == promise);
                    promises.splice(index, 1);
                });

        promises.push(promise);
    }

    async function createPromise(file: string) {
        const fileExists = await exists(file);
        if (!fileExists || aborted) return;
        const content = await readFile(file);
        if (aborted) return;
        await nlimit(() => {
            if (aborted) return;
            return saveFile(file, content);
        })
        updateProgress();
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