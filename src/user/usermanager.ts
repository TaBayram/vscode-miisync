import { Disposable, ExtensionContext } from "vscode";
import { GetDifferentValuedKeys } from "../extends/lib";
import { settingsManager } from "../extension/settings";
import { System } from "../extension/system";
import { logInService } from "../miiservice/loginservice";
import { logOutService } from "../miiservice/logoutservice";
import { configManager } from "../modules/config";
import { SetContextValue, ShowInputBox } from "../modules/vscode";
import logger from "../ui/logger";
import { RemoveSession, Session } from "./session";


// Find a better name
class UserManager {
    private subscription: Disposable[] = [];
    private session: Session;

    private password: string;
    private awaitsLogin: boolean = false;

    private refreshTimer: NodeJS.Timeout;

    public set IsLoggedin(value: boolean) {
        this.session.IsLoggedin = value;
    }

    public get IsLoggedin() {
        return this.session.IsLoggedin;
    }

    public get Session() {
        return this.session;
    }


    constructor(readonly system: System) {
        this.session = new Session(system);
        this.session.onLogStateChange.event(this.onLogStateChange, this, this.subscription);
        settingsManager.onSettingsChange.event(this.onSettingsChange, this, this.subscription);
    }

    public dispose() {
        this.subscription.forEach((sub) => sub.dispose());
    }

    private onLogStateChange(session: Session) {
        if (this.system.isMain) {
            SetContextValue("loggedin", this.IsLoggedin);
            this.onIntervalRefresh(false);
        }
    }

    private onSettingsChange() {
        if (this.system.isMain) {
            this.onIntervalRefresh(true);
        }
    }

    failCount = 0;
    private onIntervalRefresh(restart: boolean) {
        const settings = settingsManager.Settings;
        if (this.IsLoggedin && settings.refreshSession) {
            if (!this.refreshTimer || restart) {
                this.failCount = 0;
                clearInterval(this.refreshTimer);

                this.refreshTimer =
                    setInterval(async () => {
                        const isSuccess = await this.refreshLogin();
                        this.failCount++;
                        if (isSuccess) {
                            this.failCount = 0;
                        }
                        else if (this.failCount >= 3) {
                            this.IsLoggedin = false;
                            clearInterval(this.refreshTimer);
                        }
                    }, settings.sessionDuration / 3 * 60 * 1000);
                if (restart) {
                    this.refreshLogin();
                }
            }
        }
        else {
            clearInterval(this.refreshTimer);
        }
    }


    public async onSystemUpdate(system: System) {
        let diff = GetDifferentValuedKeys(system, this.system);
        if (diff.length != 0) {
            if (diff.length == 1 && diff[0] == "isMain") {
                this.system.isMain = system.isMain;
                return true;
            }
            if (this.IsLoggedin) {
                await this.logout();
                for (const key of diff) {
                    this.system[key] = system[key];
                }
                this.login();
            }
            else {
                for (const key of diff) {
                    this.system[key] = system[key];
                }
            }
            return true;
        }
        return false;
    }

    async login() {
        if (this.awaitsLogin) { return false; }
        if (this.IsLoggedin && !this.session.didCookiesExpire()) { return true; }
        this.awaitsLogin = true;

        if (await this.refreshLogin(false)) {
            logger.info("Logged in succesfully for " + this.system.name + ".(e)");
            this.IsLoggedin = true;
            this.awaitsLogin = false;
            return true;
        }
        await this.setAuth();
        const response = await logInService.call(this.system, false, { name: this.system.username, password: (this.system.password || this.password) });
        this.awaitsLogin = false;

        if (response) {
            logger.info("Logged in succesfully for " + this.system.name + ".(n)");
            this.session.haveCookies(response);
            this.IsLoggedin = true;
            return true;
        }
        else {
            logger.error("Log in not successful for " + this.system.name);
        }
        return false;
    }


    async refreshLogin(useCookies = true) {
        if (useCookies && this.session.loadCookiesIfCookedIn(10)) { return true; }
        const response = await logInService.call(this.system, true);
        if (response) {
            this.session.haveCookies(response);
            return true;
        }
        return false;
    }

    async logout() {
        await logOutService.call(this.system);
        logger.info('Log out for ' + this.system.name);
        this.session.clear();
        this.IsLoggedin = false;
    }

    async setAuth(promptPassword = true) {
        this.system.password == null && promptPassword && await this.askPassword();

        const newAuth = Buffer.from(this.system.username + ":" + (this.system.password || this.password)).toString('base64');
        this.session.auth = newAuth;
    }

    private async askPassword() {
        const password = await ShowInputBox({ password: true, placeHolder: "Enter Password", title: "Password for " + this.system.name });
        if (password) {
            this.password = password;
            return true;
        }
        else {
            logger.info("No password given for " + this.system.name);
            return false;
        }
    }
}





const userManagers: UserManager[] = [];


export function GetUserManager(system: System, create: boolean = false) {
    for (const manager of userManagers) {
        if (manager.system.name == system.name && manager.system.host == system.host && manager.system.port == system.port) {
            return manager;
        }
    }
    if (create) {
        const manager = new UserManager(system);
        userManagers.push(manager);
        return manager;
    }
    return null;
}

export function GetMainUserManager() {
    return userManagers.find((manager) => manager.system.isMain);
}


export async function InitiliazeMainUserManager({ subscriptions }: ExtensionContext) {
    subscriptions.push(configManager.onSystemsChange.event(OnSystemsChange));
    await configManager.load();
}

//todo
export async function OnSystemsChange(system: System[]) {
    let newSystems: System[] = [...(system || [])];
    let oldManagers: UserManager[] = [];

    let wasMainLoggedIn = userManagers.length == 0 || userManagers.find((manager) => manager.system.isMain && manager.IsLoggedin) != null;
    for (let j = userManagers.length - 1; j > -1; j--) {
        const manager = userManagers[j];
        for (var i = newSystems.length - 1; i > -1; i--) {
            const system = newSystems[i];
            if (system.name == manager.system.name) {
                manager.onSystemUpdate(system);
                newSystems.splice(i, 1);
                break;
            }
        }
        //current manager's system isn't available in the new systems
        if (i == -1) {
            oldManagers.push(...userManagers.splice(j, 1));
        }
    }

    const promises: Promise<any>[] = [];
    for (const oldManager of oldManagers) {
        promises.push(oldManager.logout().then(() => {
            RemoveSession(oldManager.Session);
            oldManager.dispose();
        }));

    }
    await Promise.all(promises);

    for (const system of newSystems) {
        GetUserManager(system, true);
    }
    for (const manager of userManagers) {
        if (wasMainLoggedIn && manager.system.isMain) {
            manager.login();
        }
    }
}