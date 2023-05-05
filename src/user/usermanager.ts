import { ExtensionContext } from "vscode";
import { shallowEqual } from "../extends/lib";
import { logInService } from "../miiservice/loginservice";
import { logOutService } from "../miiservice/logoutservice";
import { System, configManager } from "../modules/config";
import { SetContextValue, ShowInputBox } from "../modules/vscode";
import logger from "../ui/logger";
import { Session } from "./session";


// Find a better name
class UserManager {
    private session: Session;

    private password: string;
    private isLoggedin: boolean;

    public set IsLoggedin(value: boolean) {
        this.isLoggedin = value;
        this.session.IsLoggedin = value;
    }

    public get IsLoggedin() {
        return this.isLoggedin;
    }

    public get Session() {
        return this.session;
    }


    constructor(readonly system: System) {
        this.session = new Session(system);
    }

    public onSystemUpdate(system: System) {
        if (!shallowEqual(system, this.system)) {
            if (this.IsLoggedin) {
                this.logout();
                this.system.host = system.host;
                this.system.port = system.port;
                this.system.username = system.username;
                this.system.password = system.password;
                this.system.isMain = system.isMain;
                this.login();
            }
            else {
                this.system.host = system.host;
                this.system.port = system.port;
                this.system.username = system.username;
                this.system.password = system.password;
                this.system.isMain = system.isMain;
            }
            return true;
        }
        return false;
    }



    async login() {
        if (this.isLoggedin) return true;
        await this.setAuth();
        const response = await logInService.call({ host: this.system.host, port: this.system.port }, this.system.name);
        if (response) {
            this.session.haveCookies(response);
            this.IsLoggedin = true;
            if (this.system.isMain)
                SetContextValue("loggedin", true);
            return true;
        }
        return false;
    }

    async logout() {
        await logOutService.call({ host: this.system.host, port: this.system.port });
        logger.info('Log out for ' + this.system.name);
        this.session.clear();
        this.IsLoggedin = false;
        if (this.system.isMain)
            SetContextValue("loggedin", false);
    }

    async setAuth(promptPassword = true) {
        if (this.system.password == null && promptPassword && await this.askPassword()) {            
        }

        const newAuth = encodeURIComponent(Buffer.from(this.system.username + ":" + (this.system.password || this.password)).toString('base64'));
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

    for (const oldManager of oldManagers) {
        oldManager.logout();
    }
    for (const system of newSystems) {
        GetUserManager(system, true);
    }
    for (const manager of userManagers) {
        if (wasMainLoggedIn && manager.system.isMain) {
            manager.login();
        }
    }
}