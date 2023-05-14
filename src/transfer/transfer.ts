import { readFile } from "fs-extra";
import { Uri } from "vscode";
import { saveFileService } from "../miiservice/savefileservice";
import { SystemConfig, UserConfig, configManager } from "../modules/config";
import { GetAllFilesInDir, GetRemotePath, ValidatePath } from "../modules/file";
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import statusBar, { Icon } from "../ui/statusbar";
import { GetUserManager } from "../user/usermanager";


export async function TransferFolder(uri: Uri, userConfig: UserConfig) {
    let picks: QuickPickItem<SystemConfig>[] = [];
    for (const system of userConfig.systems) {
        if (configManager.CurrentSystem != system) {
            picks.push({ label: system.name, description: system.host + ':' + system.port, object: system })
        }
    }

    const response: QuickPickItem<SystemConfig> = await ShowQuickPick(picks, { title: 'Pick System' });
    if (response) {
        const system = response.object;
        const user = GetUserManager(system, true);
        if(!await user.login()) return;

        statusBar.updateBar('Transfering', Icon.spinLoading, { duration: -1 });
        logger.info("Transfer Folder Started");        

        const localFiles = await GetAllFilesInDir(uri.fsPath);
        const promises: Promise<any>[] = [];
        for (let index = 0; index < localFiles.length; index++) {
            const localFile = localFiles[index];
            if (await ValidatePath(localFile, userConfig)) {
                promises.push(readFile(localFile).then((content)=>{
                    const sourcePath = GetRemotePath(localFile, userConfig);
                    const base64Content = encodeURIComponent(content.length != 0 ? content.toString('base64') : Buffer.from(" ").toString('base64'));
                    return saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
                }));
            }
        }
        
        await Promise.all(promises);
        statusBar.updateBar('Done', Icon.success, { duration: 1 });
        logger.info("Transfer Folder Completed");
    }
}