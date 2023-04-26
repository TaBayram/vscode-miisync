import * as vscode from "vscode";
import { UserConfig } from "../modules/config";
import { SetContextValue, ShowInputBox } from "../modules/vscode";
import logger from "../ui/logger";

export class Session {
    private static instance: Session;
    public static get Instance() {
        if (!this.instance) {
            this.instance = new Session();
        }
        return this.instance;
    }


    private context: vscode.ExtensionContext;
    private cookies: string[] = [];
    private lastUpdated: Date;
    private auth: string;
    private password: string;

    private hasMIICookies: boolean = false;
    private isLoggedIn: boolean = false;
    private hasAuthChanged: boolean = false;

    public set HasMIICookies(value: boolean) {
        this.hasMIICookies = value;
        SetContextValue("session", value);
    }
    public get HasMIICookies() {
        return this.hasMIICookies;
    }

    public set IsLoggedIn(value: boolean) {
        this.isLoggedIn = value;
    }
    public get IsLoggedIn() {
        return this.isLoggedIn;
    }

    public set Context(value: vscode.ExtensionContext) {
        this.context = value;
        this.loadCookies();
    }

    public get Auth() {
        return this.auth;
    }


    private constructor() {

    }

    async setAuth({ username, password }: UserConfig, promptPassword = true) {
        if (password == null && promptPassword) {
            if (await this.askPassword())
                password = this.password;
        }

        const newAuth = encodeURIComponent(Buffer.from(username + ":" + password).toString('base64'));
        if (newAuth != this.auth) {
            this.hasAuthChanged = true;
            this.auth = newAuth;
        }
    }

    clear() {
        this.HasMIICookies = false;
        this.IsLoggedIn = false;
        this.cookies = [];
        this.clearCookies();
    }

    login(response) {
        if (response) {
			this.IsLoggedIn = true;
			this.haveCookies(response);
		}
    }

    haveCookies(response) {
        if (!this.hasMIICookies) {
            this.parseCookies(response);
            this.HasMIICookies = true;
        }
    }

    parseCookies(response) {
        const raw: string[] = response.headers.raw()['set-cookie'] || [];
        if (raw.length == 0) return;
        let cookies = raw.map((entry) => {
            const parts = entry.split(';');
            const cookiePart = parts[0];
            return cookiePart;
        });
        for (const cookie of cookies) {
            this.updateCookie(cookie)
        }
        this.saveCookies();
        return cookies.length;
    }


    getCookies(): string {
        if (!this.isExpired(this.lastUpdated, 60)) {
            this.HasMIICookies = false;
        }
        return this.cookies.join(";");
    }



    updateCookie(cookie: string) {
        for (var index = 0; index < this.cookies.length; index++) {
            const iCookie = this.cookies[index];
            if (iCookie.split("=")[0] == cookie.split("=")[0]) {
                this.cookies[index] = cookie;
                break;
            }
        }
        if (index == this.cookies.length) {
            this.cookies.push(cookie);
        }
        this.lastUpdated = new Date();
    }

    loadCookies() {
        this.lastUpdated = new Date(this.context.globalState.get("lastUpdated", Date.now()));
        if (!this.isExpired(this.lastUpdated, 60))
            this.cookies = this.context.globalState.get<string[]>("cookies", []);
    }

    saveCookies() {
        this.context.globalState.update("lastUpdated", this.lastUpdated);
        this.context.globalState.update("cookies", this.cookies);
    }

    private async askPassword() {
        const password = await ShowInputBox({ password: true, placeHolder: "Enter Password", title: "Password" });
        if (password) {
            this.password;
            return true;
        }
        else {
            logger.info("No password given");
            return false;
        }
    }

    private clearCookies() {
        this.context.globalState.update("lastUpdated", null);
        this.context.globalState.update("cookies", null);
    }


    private isExpired(date: Date, duration: number) {
        return (new Date().getTime() - date.getTime()) / 1000 / 60 >= duration
    }


}