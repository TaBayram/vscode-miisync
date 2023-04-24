import { Session } from "../extension/session";
import { logOutService } from "../miiservice/logoutservice";
import { configManager } from "../modules/config";

export function OnCommandEndSession(){
    configManager.load().then(config=>{
        const auth = logOutService.generateAuth(config);
        logOutService.call({host: config.host, port: config.port, auth});
        Session.Instance.clear();
    })
}