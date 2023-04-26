import { FindFileInDir, GetRemotePath } from "../modules/file.js";
import { GetCurrentWorkspaceFolder, GetActiveTextEditor } from "../modules/vscode.js";
import { openScreenService } from "../miiservice/openscreenservice.js";
import { configManager } from "../modules/config.js";
import { Uri } from "vscode";


export async function OnCommandOpenScreen(uri: Uri) {
    const userConfig = await configManager.load();
    if (userConfig) {
        if(uri){
            const remotePath = GetRemotePath(uri.fsPath, userConfig, false);
            openScreenService.call({ host: userConfig.host, port: userConfig.port }, remotePath);
            return;
        }

        const workspaceUri = GetCurrentWorkspaceFolder();
        const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
        if (!name) return;
        const remotePath = GetRemotePath(name, userConfig, false);
        openScreenService.call({ host: userConfig.host, port: userConfig.port }, remotePath);
    }

}
