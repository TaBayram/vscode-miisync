import { CancellationToken, ProgressLocation, window } from "vscode";

interface ProgressData {
    percent: number,
    end: () => void,
    thenable: Thenable<void>,
    token: CancellationToken
}

export function CreateProgressWindow(title: string, onCancel?: () => void) {
    const data: ProgressData = { percent: 0, end: null, token: null, thenable: null };

    data.thenable = window.withProgress({
        location: ProgressLocation.Window,
        cancellable: true,
        title
    }, async (progress, token) => {
        let end = false;
        if (onCancel)
            token.onCancellationRequested(onCancel);
        data.token = token;
        data.end = () => {
            end = true;
            progress.report({
                increment: 100,
                message: ' ' + 100 + ' %'
            });
        };

        progress.report({ increment: 0 });

        while (!end) {
            progress.report({
                increment: data.percent,
                message: ' ' + data.percent + ' %'
            });
            await new Promise(r => setTimeout(r, 1000 / 30));
        }
        progress.report({ increment: 100 });
    });

    return data;
}