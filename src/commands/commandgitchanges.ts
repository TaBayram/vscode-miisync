import { extensions } from "vscode";
import { configManager } from "../modules/config.js";
import { UploadUris } from "../transfer/upload.js";
import { GitExtension, Repository, Status } from "../types/git.js";



export async function OnCommandUploadGitChanges() {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    const gitExtension = extensions.getExtension<GitExtension>('vscode.git')!.exports;
    const git = gitExtension.getAPI(1);

    const repo: Repository = git.repositories[0];
    const changes = repo.state.workingTreeChanges;
    //const changes = await repo.diffWithHEAD();


    //const commit = await repos[0].getCommit('HEAD');

    const files = changes.filter((change) => (change.status != Status.DELETED && change?.uri)).map(change => change.uri);
    await UploadUris(files, userConfig, configManager.CurrentSystem, "Upload Git Changes: " + files.length);
}