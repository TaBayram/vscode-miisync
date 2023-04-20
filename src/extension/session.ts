import * as vscode from "vscode";

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

    public hasMIICookies: boolean = false;

    public set Context(value: vscode.ExtensionContext) {
        this.context = value;
        this.loadCookies();
    }


    private constructor() {
        
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
        if(!this.isExpired(this.lastUpdated, 60)){
            this.hasMIICookies = false;
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


    private isExpired(date: Date, duration: number){
        return (new Date().getTime() - date.getTime()) / 1000 / 60 >= duration
    }


}