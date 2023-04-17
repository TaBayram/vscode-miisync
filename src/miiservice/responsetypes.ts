export interface MII<T extends Row, Y extends Column> {
    "?xml": Xml
    Rowsets: Rowsets<T, Y>
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

export interface Rowset<T extends Row, Y extends Column> {
    Columns: Columns<Y>
    Row: T[]
}

export interface Columns<Y extends Column> {
    Column: Y[]
}

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