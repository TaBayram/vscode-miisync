import { Uri } from "vscode";
import { openScreenService } from "../miiservice/openscreenservice.js";
import { configManager } from "../modules/config.js";
import { FindFileInDir, GetRemotePath, RemoveWeb } from "../modules/file.js";
import { GetCurrentWorkspaceFolder } from "../modules/vscode.js";
import { TreeItem } from "../ui/treeview/tree.js";


export async function OnCommandOpenScreen(obj: Uri | TreeItem) {
    const userConfig = await configManager.load();
    if (!userConfig) return;

    if (obj) {
        if ('fsPath' in obj) {
            const remotePath = GetRemotePath(obj.fsPath, userConfig, false);
            openScreenService.call({ host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port }, remotePath);
            return;
        }
        if ('data' in obj) {
            const remotePath = RemoveWeb(obj.data.filePath + '/' + obj.data.name);
            openScreenService.call({ host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port }, remotePath);
            return;
        }
    }


    const workspaceUri = GetCurrentWorkspaceFolder();
    const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
    if (!name) return;
    const remotePath = GetRemotePath(name, userConfig, false);
    openScreenService.call({ host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port }, remotePath);


}
