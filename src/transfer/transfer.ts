import { readFile } from 'fs-extra';
import * as path from 'path';
import { QuickPickItemKind, Uri } from "vscode";
import { System, UserConfig } from "../extension/system";
import { MIISafe, RowsetsMessage } from '../miiservice/abstract/responsetypes';
import { saveFileService } from '../miiservice/savefileservice';
import { configManager } from "../modules/config";
import { GetRemotePath, PrepareUrisForService } from '../modules/file';
import { CheckSeverity, CheckSeverityFile, CheckSeverityFolder, SeverityOperation } from '../modules/severity';
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import { GetUserManager } from "../user/usermanager";
import { ActionReturn, ActionType, StartAction } from './action';
import { Validate } from './gate';
import { UploadComplexLimited } from './limited/uploadcomplex';


async function CreateSystemQuickPick(userConfig: UserConfig) {
    const picks: QuickPickItem<System>[] = [];
    for (const system of userConfig.systems) {
        if (configManager.CurrentSystem != system) {
            picks.push({ label: system.name, description: system.host + ':' + system.port, object: system })
        }
    }
    picks.push({ kind: QuickPickItemKind.Separator, label: 'Current', object: null })
    picks.push({ label:configManager.CurrentSystem.name, description: configManager.CurrentSystem.toHost(), object: configManager.CurrentSystem })
    const quickResponses: QuickPickItem<System>[] = await ShowQuickPick(picks, { title: 'Transfer: Pick System', canPickMany: true });
    return quickResponses;
}

function GetMostSevereSystem(systems: System[]) {
    let mostSevereSystem = systems[0];
    for (const system of systems) {
        if (parseInt(mostSevereSystem.severity[0]) < parseInt(system.severity[0])) {
            mostSevereSystem = system;
        }
    }
    return mostSevereSystem;
}


export async function TransferFolder(uri: Uri, userConfig: UserConfig) {
    const folderPath = uri.fsPath;
    if (!await Validate(userConfig, { localPath: folderPath })) {
        return null;
    }
    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    const sSystem = configManager.CurrentSystem;
    if (quickResponses?.length > 0) {
        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        const folderName = path.basename(folderPath);
        const transfer = async (): Promise<ActionReturn> => {
            const mostSevereSystem = GetMostSevereSystem(quickResponses.map((pick) => pick.object));
            if (!await CheckSeverityFolder(uri, SeverityOperation.transfer, userConfig, mostSevereSystem)) return { aborted: true };

            for (const pickItem of quickResponses) {
                const system = pickItem.object;
                const user = GetUserManager(system, true)!;
                if (!await user.login()) continue;

                const response = await UploadComplexLimited({ path: folderPath, files: [], folders: [] }, userConfig, system);
                if (response?.aborted) {
                    return { aborted: response.aborted }
                }
                logger.infoplus(sSystem.name, "Transfer Folder", system.name + ": Uploaded");
            }

            return { aborted: false };
        };
        StartAction(ActionType.transfer, { name: "Transfer Folder", resource: systems + " " + folderName, system: sSystem }, { isSimple: false }, transfer);
    }

}

export async function TransferFile(uri: Uri, userConfig: UserConfig) {
    if (!await Validate(userConfig, { localPath: uri.fsPath })) {
        return false;
    }

    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    const sSystem = configManager.CurrentSystem;
    if (quickResponses?.length > 0) {
        const fileName = path.basename(uri.fsPath);
        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        const transfer = async (): Promise<ActionReturn> => {
            const content = (await readFile(uri.fsPath)).toString();
            const base64Content = encodeURIComponent(Buffer.from(content || " ").toString('base64'));
            const sourcePath = GetRemotePath(uri.fsPath, userConfig);

            const mostSevereSystem = GetMostSevereSystem(quickResponses.map((pick) => pick.object));
            if (!await CheckSeverityFile(uri, SeverityOperation.transfer, userConfig, mostSevereSystem)) return { aborted: true };


            let response: MIISafe<null, null, RowsetsMessage> = null;
            for (const pickItem of quickResponses) {
                const system = pickItem.object;
                const user = GetUserManager(system, true)!;
                if (!await user.login()) continue;

                response = await saveFileService.call({ ...system, body: "Content=" + base64Content }, sourcePath);
            }

            return { aborted: false };
        }
        StartAction(ActionType.transfer, { name: "Transfer File", resource: systems + " " + fileName, system: sSystem }, { isSimple: true }, transfer);
    }

}


/**
 * Uses Limited
 */
export async function TransferUris(uris: Uri[], userConfig: UserConfig, processName: string) {
    const quickResponses: QuickPickItem<System>[] = await CreateSystemQuickPick(userConfig);
    const sSystem = configManager.CurrentSystem;
    if (quickResponses?.length > 0) {
        const systems = quickResponses.map((pick) => pick.object.name).join(', ').enclose('[', ']');
        const transfer = async (): Promise<ActionReturn> => {
            const folder = await PrepareUrisForService(uris);

            const mostSevereSystem = GetMostSevereSystem(quickResponses.map((pick) => pick.object));
            if (!await CheckSeverity(folder, SeverityOperation.transfer, userConfig, mostSevereSystem)) return { aborted: true };

            for (const pickItem of quickResponses) {
                const system = pickItem.object;
                const user = GetUserManager(system, true)!;
                if (!await user.login()) continue;

                const response = await UploadComplexLimited(folder, userConfig, system);
                if (response?.aborted) {
                    return { aborted: response.aborted }
                }
                logger.infoplus(configManager.CurrentSystem.name, processName, system.name + ": Uploaded");
            }

            return { aborted: false };
        };
        StartAction(ActionType.transfer, { name: processName, resource: systems, system: sSystem }, { isSimple: false }, transfer);
    }
}
