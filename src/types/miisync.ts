import { Uri } from "vscode";
import { File, Folder } from "../miiservice/abstract/responsetypes";

export interface SimpleFolder {
    path: string,
    files: SimpleFile[],
    folders: SimpleFolder[],
}
export interface SimpleFile{
    path: string
}

export interface SimplePreFolder extends SimpleFolder {
    folders: SimplePreFolder[],
    uris?: Uri[]
}

export interface ComplexFile extends SimpleFile{
    path: string,
    isRemotePath?: boolean,
    file?: File
}
export interface ComplexFolder extends SimpleFolder {
    path: string,
    isRemotePath?: boolean,
    folder?: Folder,
    files: ComplexFile[],
    folders: ComplexFolder[],
}