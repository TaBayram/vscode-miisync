import * as vscode from "vscode";
import { System } from "../modules/config";

export class Session {
    private static context: vscode.ExtensionContext;    
    public static onLogStateChange: vscode.EventEmitter<Session> = new vscode.EventEmitter();
    public static set Context(value: vscode.ExtensionContext) {
        Session.context = value;
    }

    private cookies: string[] = [];
    private lastUpdated: Date;
    private isLoggedin: boolean;
    private hasMIICookies: boolean = false;
    public auth: string;    


    public set HasMIICookies(value: boolean) {
        this.hasMIICookies = value;
    }
    public get HasMIICookies() {
        return this.hasMIICookies;
    }

    public set IsLoggedin(value: boolean) {
        this.isLoggedin = value;
        Session.onLogStateChange.fire(this);
    }

    public get IsLoggedin() {
        return this.isLoggedin;
    }


    public constructor(readonly system: System) {
        sessions.push(this);
        this.loadCookies();
    }



    clear() {
        this.HasMIICookies = false;
        this.IsLoggedin = false;
        this.auth = "";
        this.cookies = [];
        this.clearCookies();
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
        this.lastUpdated = new Date(Session.context.globalState.get(this.system.name + "lastUpdated", Date.now()));
        if (!this.isExpired(this.lastUpdated, 60)) {
            this.cookies = Session.context.globalState.get<string[]>(this.system.name + "cookies", []);
        }
    }

    saveCookies() {
        Session.context.globalState.update(this.system.name + "lastUpdated", this.lastUpdated);
        Session.context.globalState.update(this.system.name + "cookies", this.cookies);
    }

    private clearCookies() {
        Session.context.globalState.update(this.system.name + "lastUpdated", null);
        Session.context.globalState.update(this.system.name + "cookies", null);
    }


    private isExpired(date: Date, duration: number) {
        return (new Date().getTime() - date.getTime()) / 1000 / 60 >= duration
    }
}

const sessions: Session[] = [];

export function GetSession(host: string, port: number) {
    for (const session of sessions) {
        if (session.system.host == host && session.system.port == port) {
            return session;
        }
    }
    return null;
}

export function GetMainSession() {
    return sessions.find((session) => session.system.isMain);
}