import { Range } from "vscode";
import { configManager } from "../modules/config.js";
import { GetActiveTextEditor, ShowWarningMessage } from "../modules/vscode.js";
import { GetTransactionProperties } from "../transfer/misc.js";

export async function OnCommandDownloadTransactionProperties() {
    const textEditor = GetActiveTextEditor();
    const selection = textEditor.selection;
    if (textEditor && selection && !selection.isEmpty) {
        const selectionRange = new Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
        const highlighted = textEditor?.document?.getText(selectionRange);

        GetTransactionProperties(highlighted, configManager.CurrentSystem);
    }
    else{
        ShowWarningMessage('Transaction path must be selected before this command.');
    }
}