import { Uri } from "vscode";
import { System } from "../extension/system";
import { UserConfig, configManager } from "../modules/config";
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import statusBar, { Icon } from "../ui/statusbar";
import { GetUserManager } from "../user/usermanager";
import { UploadFolderLimited } from "./limited/upload";
import path = require("path");


export async function TransferFolder(uri: Uri, userConfig: UserConfig) {
    let picks: QuickPickItem<System>[] = [];
    for (const system of userConfig.systems) {
        if (configManager.CurrentSystem != system) {
            picks.push({ label: system.name, description: system.host + ':' + system.port, object: system })
        }
    }

    const quickResponse: QuickPickItem<System> = await ShowQuickPick(picks, { title: 'Pick System' });
    if (quickResponse) {
        const system = quickResponse.object;
        const user = GetUserManager(system, true);
        if (!await user.login()) return;

        statusBar.updateBar('Transfering', Icon.spinLoading, { duration: -1 });
        logger.infos("Transfer Folder", path.basename(uri.fsPath) + ": Started");

        const response = await UploadFolderLimited(uri.fsPath, userConfig, system);

        if (response.aborted) {
            statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
            logger.infos("Transfer Folder", path.basename(uri.fsPath) + ": Cancelled");
        }
        else {
            statusBar.updateBar('Transferred', Icon.success, { duration: 1 });
            logger.infos("Transfer Folder", path.basename(uri.fsPath) + ": Completed");
        }
    }

}