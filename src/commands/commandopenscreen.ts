import { FindFileInDir, GetRemotePath } from "../modules/file.js";
import { getCurrentWorkspaceFolderUri, getActiveTextEditor } from "../modules/vscode.js";
import { openScreenService } from "../miiservice/openscreenservice.js";
import { configManager } from "../modules/config.js";


export async function OnCommandOpenScreen() {
    const userConfig = await configManager.load();
    if (userConfig) {
        const workspaceUri = getCurrentWorkspaceFolderUri();
        const name = await FindFileInDir(workspaceUri.fsPath, 'index.html');
        if (!name) return;
        const remotePath = GetRemotePath(name, userConfig, false);
        openScreenService.call({ host: userConfig.host, port: userConfig.port }, remotePath);
    }

}
