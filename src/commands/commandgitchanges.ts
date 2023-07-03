import { readFile } from "fs-extra";
import { extensions } from "vscode";
import { GitExtension } from "../../out/types/git.js";
import { configManager } from "../modules/config.js";
import { UploadFile } from "../transfer/upload.js";



export async function OnCommandUploadGitChanges() {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    const gitExtension = extensions.getExtension<GitExtension>('vscode.git')!.exports;
    const git = gitExtension.getAPI(1);

    const repos = git.repositories;
    const changes = await repos[0].diffWithHEAD();

    //const commit = await repos[0].getCommit('HEAD');

    //todo: try to prevent possible duplicate bug
    for (const change of changes) {
        if (change.uri) {
            const uri = change.uri;
            readFile(uri.fsPath).then((value) => {
                UploadFile(uri, value.toString(), userConfig, configManager.CurrentSystem);
            });
        }
    }
}