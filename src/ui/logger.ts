import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants.js';

const paddingTime = time => ('00' + time).slice(-2);


export interface ILogger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string | Error, ...args: any[]): void;
}

export class Logger implements ILogger {
    isVisible: boolean = false;
    outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel(EXTENSION_NAME, "log");
        this.outputChannel.show(true);
    }

    info(message: string, ...args: any[]): void {
        this.log('[info]', message, ...args);
    }
    warn(message: string, ...args: any[]): void {
        this.log('[warn]', message, ...args);
    }
    error(message: string | Error, ...args: any[]): void {
        this.log('[error]', message, ...args);
    }
    failure(message: string | Error, ...args: any[]): void{
        this.log('[failure]', message, ...args);
    }

    toastError(message: string | Error, ...args: any[]){
        vscode.window.showErrorMessage(message.toString());
        this.error(message, args);
    }
    
    toastInfo(message: string, ...args: any[]){
        vscode.window.showInformationMessage(message.toString());
        this.info(message, args);
    }

    log(message: string, ...args: any[]) {
        const now = new Date();
        const month = paddingTime(now.getMonth() + 1);
        const date = paddingTime(now.getDate());
        const h = paddingTime(now.getHours());
        const m = paddingTime(now.getMinutes());
        const s = paddingTime(now.getSeconds());
        this.print(`[${month}-${date} ${h}:${m}:${s}]`, message, ...args);
    }

    print(...args) {
        const msg = args
            .map(arg => {
                if (!arg) {
                    return arg;
                }

                if (arg instanceof Error) {
                    return arg.stack;
                } else if (!arg.toString || arg.toString() === '[object Object]') {
                    return JSON.stringify(arg);
                }

                return arg;
            })
            .join(' ');

        this.outputChannel.appendLine(msg);
    }

}


const logger = new Logger();
export default logger;