import { extensions } from "vscode";
import { configManager } from "../modules/config.js";
import { UploadFilesLimited } from "../transfer/limited/uploadfiles.js";
import { GitExtension, Status } from "../types/git.js";
import logger from "../ui/logger.js";
import statusBar, { Icon } from "../ui/statusbar.js";
import path = require("path");



export async function OnCommandUploadGitChanges() {
    const userConfig = await configManager.load();
    if (!userConfig) return;


    const gitExtension = extensions.getExtension<GitExtension>('vscode.git')!.exports;
    const git = gitExtension.getAPI(1);

    const repos = git.repositories;
    const changes = await repos[0].diffWithHEAD();

    //const commit = await repos[0].getCommit('HEAD');

    const files = changes.filter((change) => (change.status != Status.DELETED && change?.uri)).map(change => change.uri);

    statusBar.updateBar('Uploading', Icon.spinLoading, { duration: -1 });
    logger.infos("Upload Git Changes", "Changes:" + files.length + " Started");

    //todo: try to prevent possible duplicate bug
    const response = await UploadFilesLimited(files, userConfig, configManager.CurrentSystem);

    if(response.aborted){
        statusBar.updateBar('Cancelled', Icon.success, { duration: 1 });
        logger.infos("Upload Git Changes", "Cancelled");
    }
    else{
        statusBar.updateBar('Uploaded', Icon.success, { duration: 1 });
        logger.infos("Upload Git Changes", "Completed");
    }
}