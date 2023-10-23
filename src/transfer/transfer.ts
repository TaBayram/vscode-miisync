import { readFile } from 'fs-extra';
import * as path from 'path';
import { Uri } from "vscode";
import { System } from "../extension/system";
import { MIISafe, RowsetsMessage } from '../miiservice/abstract/responsetypes';
import { saveFileService } from '../miiservice/savefileservice';
import { UserConfig, configManager } from "../modules/config";
import { GetRemotePath, PrepareUrisForService } from '../modules/file';
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import statusBar, { Icon } from "../ui/statusbar";
import { GetUserManager } from "../user/usermanager";
import { Validate } from './gate';
import { LimitedReturn } from './limited/limited';
import { UploadComplexLimited } from './limited/uploadcomplex';


async function CreateSystemQuickPick(userConfig: UserConfig) {
    const picks: QuickPickItem<System>[] = [];
    for (const system of userConfig.systems) {
        if (configManager.CurrentSystem != system) {
            picks.push({ label: system.name, description: system.host + ':' + system.port, object: system })
        }
    }
    const quickResponses: QuickPickItem<System>[] = await ShowQuickPick(picks, { title: 'Pick System', canPickMany: true });
    return quickResponses;
}


export async function TransferFolder(uri: Uri, userConfig: UserConfig) {
    const folderPath = uri.fsPath;
    const folderName = path.basename(folderPath);
    if (!await Validate(userConfig, { localPath: folderPath })) {
        return null;
    }
    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    if (quickResponses?.length > 0) {
        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        statusBar.updateBar('Transfering', Icon.spinLoading, { duration: -1 });
        logger.infoplus(configManager.CurrentSystem.name, "Transfer Folder", "->" + systems + ', ' + folderName + ": Started");

        const sourcePath = GetRemotePath(folderPath, userConfig);


        let response: null | LimitedReturn<null>;
        for (const pickItem of quickResponses) {
            const system = pickItem.object;
            const user = GetUserManager(system, true);
            if (!await user.login()) return;


            response = await UploadComplexLimited({ path: folderPath, files: [], folders: [] }, userConfig, system);
            if (!response || response.aborted) break;
            logger.infoplus(configManager.CurrentSystem.name, "Transfer Folder", "->" + system.name + ', ' + folderName + ": Uploaded");
        }
        if (!response || response.aborted) {
            statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
            logger.infoplus(configManager.CurrentSystem.name, "Transfer Folder", "->" + systems + ', ' + folderName + ": Cancelled");
        }
        else {
            statusBar.updateBar('Transferred', Icon.success, { duration: 1 });
            logger.infoplus(configManager.CurrentSystem.name, "Transfer Folder", "->" + systems + ', ' + folderName + ": Completed");
        }
    }

}

export async function TransferFile(uri: Uri, userConfig: UserConfig) {
    if (!await Validate(userConfig, { localPath: uri.fsPath })) {
        return false;
    }
    
    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    if (quickResponses?.length > 0) {
        const fileName = path.basename(uri.fsPath);
        const content = (await readFile(uri.fsPath)).toString();
        const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));
        const sourcePath = GetRemotePath(uri.fsPath, userConfig);

        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        statusBar.updateBar('Transfering', Icon.spinLoading, { duration: -1 });
        logger.infoplus(configManager.CurrentSystem.name, "Transfer File", "->" + systems + ', ' + fileName + ": Started");


        let response: MIISafe<null, null, RowsetsMessage> = null;
        for (const pickItem of quickResponses) {
            const system = pickItem.object;
            const user = GetUserManager(system, true);
            if (!await user.login()) return;


            response = await saveFileService.call({ host: system.host, port: system.port, body: "Content=" + base64Content }, sourcePath);
        }
        statusBar.updateBar('Transferred', Icon.success, { duration: 1 });
        logger.infoplus(configManager.CurrentSystem.name, "Transfer File", "->" + systems + ', ' + fileName + ": Completed");
        
    }
}


/**
 * Uses Limited
 */
export async function TransferUris(uris: Uri[], userConfig: UserConfig, processName: string) {
    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    if (quickResponses?.length > 0) {
        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        statusBar.updateBar('Transfering', Icon.spinLoading, { duration: -1 });
        logger.infoplus(configManager.CurrentSystem.name, processName, "->" + systems + ", Started");

        const folder = await PrepareUrisForService(uris);

        let response: null | LimitedReturn<null>;
        for (const pickItem of quickResponses) {
            const system = pickItem.object;
            const user = GetUserManager(system, true);
            if (!await user.login()) return;

            response = await UploadComplexLimited(folder, userConfig, system);
            if (!response || response.aborted) break;
            logger.infoplus(configManager.CurrentSystem.name, processName, "->" + system.name + ", Uploaded");
        }
        if (!response || response.aborted) {
            statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
            logger.infoplus(configManager.CurrentSystem.name, processName, "->" + systems + ", Cancelled");
        }
        else {
            statusBar.updateBar('Transferred', Icon.success, { duration: 1 });
            logger.infoplus(configManager.CurrentSystem.name, processName, "->" + systems + ", Completed");
        }
    }
}
