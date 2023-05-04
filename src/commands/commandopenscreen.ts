import { Uri } from "vscode";
import { openScreenService } from "../miiservice/openscreenservice.js";
import { configManager } from "../modules/config.js";
import { FindFileInDir, GetRemotePath } from "../modules/file.js";
import { GetCurrentWorkspaceFolder } from "../modules/vscode.js";


export async function OnCommandOpenScreen(uri: Uri) {
    const userConfig = await configManager.load();
    if (userConfig) {
        if(uri){
            const remotePath = GetRemotePath(uri.fsPath, userConfig, false);
            openScreenService.call({ host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port }, remotePath);
            return;
        }

        const workspaceUri = GetCurrentWorkspaceFolder();
        const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
        if (!name) return;
        const remotePath = GetRemotePath(name, userConfig, false);
        openScreenService.call({ host: configManager.CurrentSystem.host, port: configManager.CurrentSystem.port }, remotePath);
    }

}
