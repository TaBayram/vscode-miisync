import { userManager } from "../user/usermanager";

export function OnCommandLogin(){
    userManager.login();
}
export function OnCommandLogout(){
    userManager.logout();
}