import { extensions } from "vscode";
import { configManager } from "../modules/config.js";
import { UploadUris } from "../transfer/upload.js";
import { GitExtension, Status } from "../types/git.js";



export async function OnCommandUploadGitChanges() {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    const gitExtension = extensions.getExtension<GitExtension>('vscode.git')!.exports;
    const git = gitExtension.getAPI(1);

    const repos = git.repositories;
    const changes = await repos[0].diffWithHEAD();

    //const commit = await repos[0].getCommit('HEAD');

    const files = changes.filter((change) => (change.status != Status.DELETED && change?.uri)).map(change => change.uri);
    await UploadUris(files, userConfig, configManager.CurrentSystem, "Upload Git Changes: " + files.length);
}