export interface LimitedReturn<T>{
    aborted: boolean,
    data?: T
}

let isProgressActive = false;

export function IsProgressActive(){
    return isProgressActive;
}

export function SetProgressActive(isActive: boolean){
    isProgressActive = isActive;
}