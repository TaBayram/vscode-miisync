import { Uri } from "vscode";
import { SystemConfig, UserConfig, configManager } from "../modules/config";
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import statusBar, { Icon } from "../ui/statusbar";
import { GetUserManager } from "../user/usermanager";
import { UploadFolderLimited } from "./upload";
import path = require("path");


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
        logger.infos("Transfer Folder", path.basename(uri.fsPath) +": Started"); 

        await UploadFolderLimited(uri.fsPath, userConfig, system);
        statusBar.updateBar('Transferred', Icon.success, { duration: 1 });
        logger.infos("Transfer Folder", path.basename(uri.fsPath) +": Completed"); 
    }
}