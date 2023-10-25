import { settingsManager } from "../../extension/settings";
import { CreateProgressWindow, ProgressData } from "../../ui/progresswindow";
import pLimit = require("p-limit");

export interface LimitedReturn<T> {
    aborted: boolean,
    data?: T
}

class LimitManager {
    private progressData: ProgressData;
    private remoteLimit: pLimit.Limit;
    private localLimit: pLimit.Limit;
    private isActive: boolean = false;

    private maxQueue: number = 1;
    private finished: number = 0;


    get ProgressData() {
        return this.progressData;
    }

    get IsActive() {
        return this.isActive;
    }

    get OngoingCount() {
        return this.remoteLimit?.pendingCount + this.remoteLimit?.activeCount + this.localLimit?.pendingCount + this.localLimit?.activeCount;
    }

    public get MaxQueue(): number {
        return this.maxQueue;
    }
    public set MaxQueue(value: number) {
        this.maxQueue = Math.max(1, value);
    }
    public get Finished(): number {
        return this.finished;
    }
    public set Finished(value: number) {
        this.finished = Math.max(1, value);
    }

    constructor() {

    }

    startProgress() {
        this.isActive = true;
        this.remoteLimit = pLimit(settingsManager.Settings.requestLimit);
        this.localLimit = pLimit(100);
        this.maxQueue = 0;
        this.finished = 0;
    }

    endProgress() {
        this.isActive = false;
        this.progressData?.end();
        this.progressData = null;
    }

    createWindow(title: string, onCancel?: () => void) {
        this.progressData?.end();
        this.progressData = CreateProgressWindow(title, onCancel);
    }


    updateProgress<T>(value?: T) {
        const status = Math.min(99, Math.max(0, Math.round(this.finished / this.MaxQueue * 100)));
        this.progressData.percent = status;
        return value;
    }

    newRemote<T>(fn: () => T | PromiseLike<T>): Promise<T> {
        const prom = this.remoteLimit(fn);
        this.MaxQueue = Math.max(this.remoteLimit.activeCount + this.remoteLimit.pendingCount, this.MaxQueue + 1);
        this.updateProgress();
        return prom.then((value?: T) => {
            this.finished++;
            return this.updateProgress(value);
        });
    }

    newLocal<T>(fn: () => T | PromiseLike<T>): Promise<T> {
        const prom = this.localLimit(fn);
        return prom;
    }
}

const limitManager = new LimitManager();
export default limitManager;