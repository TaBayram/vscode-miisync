import { System } from "../extension/system";
import logger from "../ui/logger";
import statusBar, { Icon } from "../ui/statusbar";

export enum ActionType { 'upload', 'download', 'delete', 'transfer' };
export interface ActionReturn { aborted: boolean, error?: boolean, message?: string };
const actionTexts = {
    [ActionType.upload]: {
        self: "Upload",
        start: "Uploading",
        end: "Uploaded",
    },
    [ActionType.download]: {
        self: "Download",
        start: "Downloading",
        end: "Downloaded",
    },
    [ActionType.delete]: {
        self: "Delete",
        start: "Deleting",
        end: "Deleted",
    },
    [ActionType.transfer]: {
        self: "Transfer",
        start: "Transferring",
        end: "Transferred",
    }
}

interface ActionData { name: string, resource?: string, system: System }
interface ActionSettings { isSimple: boolean }

export async function StartAction(type: ActionType, { name, resource, system }: ActionData, { isSimple }: ActionSettings, actionPromise: () => Promise<ActionReturn>) {
    try {

        const texts = actionTexts[type];

        statusBar.updateBar(texts.start, Icon.spinLoading, { duration: -1 });
        if (!isSimple)
            logger.infoplus(system.name, name, GetStateMessage("Started", resource));
        const { aborted, error, message } = await actionPromise();
        if (error) {
            statusBar.updateBar("Error", Icon.error, { duration: 3 });
            logger.errorPlus(system.name, name, message || "");
        }
        else if (aborted) {
            statusBar.updateBar("Cancelled", Icon.close, { duration: 3 });
            logger.infoplus(system.name, name, GetStateMessage("Cancelled", resource));
        }
        else {
            statusBar.updateBar(texts.end, Icon.success, { duration: 2 });
            logger.infoplus(system.name, name, GetStateMessage("Completed", resource));
        }
    } catch (error: any) {
        statusBar.updateBar("Error", Icon.error, { duration: 3 });
        logger.toastError(error);
    }
}


function GetStateMessage(state: string, resource?: string) {
    if (resource)
        return resource + ": " + state;
    return state;
}