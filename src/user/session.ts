import { Response } from "node-fetch";
import * as vscode from "vscode";
import { SystemConfig } from "../modules/config";

export class Session {
    private static readonly authNeededCookieID: "com.sap.engine.security.authentication.original_application_url";

    private static context: vscode.ExtensionContext;
    public static onLogStateChange: vscode.EventEmitter<Session> = new vscode.EventEmitter();
    public static set Context(value: vscode.ExtensionContext) {
        Session.context = value;
    }

    private cookies: string[] = [];
    private lastUpdated: number;
    private isLoggedin: boolean;
    private hasCookies: boolean = false;
    public auth: string;

    public onLogStateChange: vscode.EventEmitter<Session> = new vscode.EventEmitter();

    public set IsLoggedin(value: boolean) {
        this.isLoggedin = value;
        Session.onLogStateChange.fire(this);
        this.onLogStateChange.fire(this);
    }

    public get IsLoggedin() {
        return this.isLoggedin;
    }

    get Cookies(): string {
        if (this.areStoredCookiesFresher()) {
            this.loadCookies();
        }
        return this.cookies.join(";");
    }

    public constructor(readonly system: SystemConfig) {
        sessions.push(this);
        this.loadCookies();
    }

    didCookiesExpire() {
        return this.isExpired(this.lastUpdated, 59);
    }

    haveCookies(response: Response): number {
        const num = this.parseCookies(response);
        if (num == -1) {
            this.IsLoggedin = false;
        }
        else if (num == 0) {
            this.lastUpdated = Date.now();
        }
        return num;
    }

    clear() {
        this.IsLoggedin = false;
        this.auth = "";
        this.cookies = [];
        this.clearCookies();
    }

    loadCookiesIfCookedIn(minutes: number) {
        if (this.areStoredCookiesFresher(minutes)) {
            this.loadCookies();
            return true;
        }
        return false;
    }

    private parseCookies(response: Response) {
        const raw: string[] = response.headers.raw()['set-cookie'] || [];
        if (raw.length == 0) { return 0; }
        let cookies = raw.map((entry) => {
            const parts = entry.split(';');
            const cookiePart = parts[0];
            return cookiePart;
        });
        for (const cookie of cookies) {
            if (cookie.startsWith(Session.authNeededCookieID)) {
                return -1;
            }
        }
        for (const cookie of cookies) {
            this.updateCookie(cookie);
        }
        this.saveCookies();
        return cookies.length;
    }

    private updateCookie(cookie: string) {
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
        this.lastUpdated = Date.now();
    }


    private loadCookies() {
        this.lastUpdated = this.StoredLastUpdated;
        if (!this.isExpired(this.lastUpdated, 60)) {
            this.cookies = this.StoredCookies;
        }
    }

    private saveCookies() {
        this.StoredLastUpdated = this.lastUpdated;
        this.StoredCookies = this.cookies;
    }


    private clearCookies() {
        this.StoredLastUpdated = 0;
        this.StoredCookies = [];
    }

    private areStoredCookiesFresher(cookedIn?: number) {
        const lastUpdated = this.StoredLastUpdated;
        let isCookedInTime = cookedIn ? Date.now() - cookedIn * 60 * 1000 <= lastUpdated : true;
        if (lastUpdated > this.lastUpdated && !this.isExpired(lastUpdated, 60) && isCookedInTime) {
            return true;
        }
        return false;
    }

    private get StoredLastUpdated() {
        return this.getFromStore("lastUpdated", 0);
    }

    private set StoredLastUpdated(milliSeconds: number) {
        this.putToStore("lastUpdated", milliSeconds);
    }

    private get StoredCookies() {
        return this.getFromStore("cookies", []);
    }

    private set StoredCookies(cookies: string[]) {
        this.putToStore("cookies", cookies);
    }

    private getFromStore(id: string, defaultValue?: any) {
        return Session.context.globalState.get(this.system.name + id, defaultValue);
    }

    private putToStore(id: string, value: any) {
        return Session.context.globalState.update(this.system.name + id, value);
    }


    private isExpired(date: number, duration: number) {
        return (Date.now() - date) / 1000 / 60 >= duration;
    }
}

const sessions: Session[] = [];

export function GetSession(host: string, port: string) {
    for (const session of sessions) {
        if (session.system.host == host && session.system.port?.toString() == port) {
            return session;
        }
    }
    return null;
}

export function GetMainSession() {
    return sessions.find((session) => session.system.isMain);
}