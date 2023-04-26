import { Session } from "../extension/session";
import { logOutService } from "../miiservice/logoutservice";
import { configManager } from "../modules/config";

export function OnCommandEndSession(){
    configManager.load().then(async config=>{
        await logOutService.call({host: config.host, port: config.port});
        Session.Instance.clear();
    })
}