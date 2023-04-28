export interface MII<T extends Row, Y extends Column, R = Rowsets<T,Y>> {
    "?xml": Xml
    Rowsets: R
}

export interface Xml {
    "@_version": string
    "@_encoding": string
}

export interface Rowsets<T extends Row, Y extends Column> {
    Rowset: Rowset<T, Y>
    "@_DateCreated": string
    "@_EndDate": string
    "@_StartDate": string
    "@_Version": string
}
export interface RowsetsMessage {
    Messages: Messages
    "@_DateCreated": string
    "@_EndDate": string
    "@_StartDate": string
    "@_Version": string
}

export interface Rowset<T extends Row, Y extends Column> {
    Columns: Columns<Y>
    Row: T[]
}

export interface Columns<Y extends Column> {
    Column: Y[]
}

export type Directory = (File | Folder)[];

export interface Column {

}

export interface Row {

}

export interface GeneralColumn extends Column {
    Name: string
    SourceColumn: string
    Description: string
    SQLDataType: number
    MinRange: number
    MaxRange: number
}

export interface GeneralColumn2 extends Column {
    "@_Description": string
    "@_MaxRange": string
    "@_MinRange": string
    "@_Name": string
    "@_SQLDataType": string
    "@_SourceColumn": string
}

export interface Messages {
    Message: string
}

export interface CurrentUser extends Row {
    "Login Name": string
    "Full Name": string
    "E-mail Address": string
    Created: string
    "Last Access Time": string
    "Expiration Date": string
}

export interface File extends Row {
    ObjectName: string
    FilePath: string
    Type: string
    Created: string
    CreatedBy: string
    Modified: string
    ModifiedBy: string
    DcSpecificPath: string
    CheckedOutBy: string
    State: string
    ReadOnly: boolean
    LockedUsername: string
    Version: string
}


export interface Folder extends Row {
    FolderName: string
    ParentFolderName: string
    Path: string
    ParentPath: string
    IsWebDir: boolean
    IsMetaDir: boolean
    IsMDODir: boolean
    ChildFolderCount: number
    ChildFileCount: number
    RemotePath: string
    ComponentName: string
    State: string,
    children?: (File | Folder)[];
}

export interface FileProperties extends Row {
    ObjectName: string
    FilePath: string
    Type: string
    Created: string
    CreatedBy: string
    Modified: string
    ModifiedBy: string
    DcSpecificPath: string
    CheckedOutBy: string
    State: string
    ReadOnly: boolean
    LockedUsername: string
    Version: string
}


export interface FileBinary extends Row {
    Name: string
    Value: string
}