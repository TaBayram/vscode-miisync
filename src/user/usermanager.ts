import { logInService } from "../miiservice/loginservice";
import { logOutService } from "../miiservice/logoutservice";
import { UserConfig, configManager } from "../modules/config";
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

    public get IsLoggedin(){
        return this.isLoggedin;
    }

    constructor() {
        this.session = Session.Instance;
    }



    async login() {
        const { host, port, username, password } = await configManager.load();
        this.setAuth({ username, password });
        const response = await logInService.call({ host, port });
        if(response){
            this.session.haveCookies(response);
            this.IsLoggedin = true;
            SetContextValue("loggedin", true);
            return true;
        }
        return false;
    }

    async logout() {
        const { host, port } = await configManager.load();
        await logOutService.call({ host, port });
        this.session.clear();
        this.IsLoggedin = false;
        SetContextValue("loggedin", false);
    }

    async setAuth({ username, password }: UserConfig, promptPassword = true) {
        if (password == null && promptPassword) {
            if (await this.askPassword())
                password = this.password;
        }

        const newAuth = encodeURIComponent(Buffer.from(username + ":" + password).toString('base64'));
        this.session.auth = newAuth;
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
}







export const userManager = new UserManager();