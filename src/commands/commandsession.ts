import { GetMainUserManager } from "../user/usermanager";

export function OnCommandLogin(){
    GetMainUserManager()?.login();
}
export function OnCommandLogout(){
    GetMainUserManager()?.logout();
}