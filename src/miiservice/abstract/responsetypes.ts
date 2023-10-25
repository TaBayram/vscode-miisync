export type MII<T extends Row | null = Row, Y extends Column | null = Column, R = Rowsets<T, Y>, DataName extends string = 'Rowsets'> = {
    [P in DataName]: R;

} & { "?xml": Xml }

export type MIISafe<T extends Row | null = Row, Y extends Column | null = Column, R = Rowsets<T, Y>, DataName extends string = 'Rowsets'> =
    MII<T, Y, R, DataName> | MII<null, null, RowsetsFatal> | null;

export interface Xml {
    "@_version": string
    "@_encoding": string
}

export interface Rowsets<T extends Row | null = Row, Y extends Column | null = Column> {
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

export interface RowsetsFatal {
    FatalError: string
    "@_DateCreated": string
    "@_EndDate": string
    "@_StartDate": string
    "@_Version": string
}

export interface Rowset<T extends Row | null, Y extends Column | null> {
    Columns: Columns<Y>
    Row: T[] | undefined
}

export interface Columns<Y extends Column | null> {
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

export interface Transaction {
    TransactionAttributes: TransactionAttributes
    Name: string
    Version: number
    WriterRoles: string
    Context: Context
    Local: Local
    Layout: Layout
    Actions: Actions
    ReaderRoles: string
    Steps: Steps
    "@_xmlns:xsd": string
    "@_xmlns:xsi": string
    "@_Version": string
}

export interface TransactionAttributes {
    ContextItem: ContextItem[]
}
export interface Context {
    ContextItem: ContextItem[]
}
export interface Local {
    ContextItem: ContextItem[]
}
export interface Actions {
    ContextItem: ContextItem[]
}

export interface ContextItem {
    Name: string
    Description: string
    MinRange: number
    MaxRange: number
    Value: Value
    ReadOnly: boolean
    AlertXMLAssigned: boolean,
    SchemaURI?: string
    SchemaElement?: string
    ValidateXMLOnExecution?: number
}


export interface Value {
    "@_xsi:type": string
    "#text"?: string,
    ReferenceDocumentSource?: string,
    [key: string]: any
}

export interface Layout {
    GUILayoutItem: GuilayoutItem[]
}

export interface GuilayoutItem {
    Name: string
    X: number
    Y: number
    Width: number
    SpacingWidth: number
    DescendantWidth: number
    Height: number
}


export interface Results {
    ReferenceDocumentSource: string
    "#text": string
}

export interface Input {
    ReferenceDocumentSource: string
}

export interface InputXsl {
    ReferenceDocumentSource: string
}

export interface Steps {
    Step: Step[]
}

export interface Step {
    Name: string
    Description: string
    Steps: string | Steps
    Actions: string | Actions
    "@_xsi:type": string
}

export interface Actions {
    Action: Action[]
}

export interface Action {
    Name: string
    Description: string
    Expiration: string
    IncomingLinks: Links | string
    OutgoingLinks: Links | string
}

export interface Links {
    Assign: Assign[]
}
export interface Assign {
    Name: string
    Description: string
    To: string
    From: string
}