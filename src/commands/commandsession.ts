import { System } from "../extension/system";
import { configManager } from "../modules/config";
import { ShowQuickPick } from "../modules/vscode";
import logger from "../ui/logger";
import { QuickPickItem } from "../ui/quickpick";
import statusBar, { Icon } from "../ui/statusbar";
import { GetMainUserManager } from "../user/usermanager";

export function OnCommandLogin() {
    GetMainUserManager()?.login();
}
export function OnCommandLogout() {
    GetMainUserManager()?.logout();
}

export async function OnCommandSwitchSystem() {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    let picks: QuickPickItem<System>[] = [];
    for (const system of userConfig.systems) {
        if (configManager.CurrentSystem != system) {
            picks.push({ label: system.name, description: system.toHost(), object: system })
        }
    }
    if (picks.length == 0) {
        logger.error('No other system to switch to.');
        return;
    }
    const quickResponse: QuickPickItem<System> = await ShowQuickPick(picks, { title: 'Pick System to Switch' });
    if (quickResponse) {
        const system = quickResponse.object;
        for (const eSystem of userConfig.systems) {
            eSystem.isMain = false;
        }
        system.isMain = true;
        await configManager.update(userConfig);
        statusBar.updateBar(system.name, Icon.success, { duration: 1 });
        logger.info('Switched to ' + system.name);
    }
}