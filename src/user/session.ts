import * as vscode from "vscode";
import { SystemConfig } from "../modules/config";

export class Session {
    private static context: vscode.ExtensionContext;
    public static onLogStateChange: vscode.EventEmitter<Session> = new vscode.EventEmitter();
    public static set Context(value: vscode.ExtensionContext) {
        Session.context = value;
    }

    private cookies: string[] = [];
    private lastUpdated: Date;
    private isLoggedin: boolean;
    private hasCookies: boolean = false;
    public auth: string;


    public set HasCookies(value: boolean) {
        this.hasCookies = value;
    }
    public get HasCookies() {
        return this.hasCookies;
    }

    public set IsLoggedin(value: boolean) {
        this.isLoggedin = value;
        Session.onLogStateChange.fire(this);
    }

    public get IsLoggedin() {
        return this.isLoggedin;
    }

    get Cookies(): string {
        if (!this.isExpired(this.lastUpdated, 60)) {
            this.HasCookies = false;
        }
        return this.cookies.join(";");
    }

    public constructor(readonly system: SystemConfig) {
        sessions.push(this);
        this.loadCookies();
    }

    didCookiesExpire(){
        return this.isExpired(this.lastUpdated, 59);
    }

    haveCookies(response) {
        this.parseCookies(response);
        this.HasCookies = true;
    }    

    clear() {
        this.HasCookies = false;
        this.IsLoggedin = false;
        this.auth = "";
        this.cookies = [];
        this.clearCookies();
    }

    private parseCookies(response) {
        const raw: string[] = response.headers.raw()['set-cookie'] || [];
        if (raw.length == 0) { return; }
        let cookies = raw.map((entry) => {
            const parts = entry.split(';');
            const cookiePart = parts[0];
            return cookiePart;
        });
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
        this.lastUpdated = new Date();
    }


    private loadCookies() {
        this.lastUpdated = new Date(Session.context.globalState.get(this.system.name + "lastUpdated", Date.now()));
        if (!this.isExpired(this.lastUpdated, 60)) {
            this.cookies = Session.context.globalState.get<string[]>(this.system.name + "cookies", []);
        }
    }

    private saveCookies() {
        Session.context.globalState.update(this.system.name + "lastUpdated", this.lastUpdated);
        Session.context.globalState.update(this.system.name + "cookies", this.cookies);
    }


    private clearCookies() {
        Session.context.globalState.update(this.system.name + "lastUpdated", null);
        Session.context.globalState.update(this.system.name + "cookies", null);
    }


    private isExpired(date: Date, duration: number) {
        return (new Date().getTime() - date.getTime()) / 1000 / 60 >= duration;
    }
}

const sessions: Session[] = [];

export function GetSession(host: string, port: string) {
    for (const session of sessions) {
        if (session.system.host == host && session.system.port.toString() == port) {
            return session;
        }
    }
    return null;
}

export function GetMainSession() {
    return sessions.find((session) => session.system.isMain);
}