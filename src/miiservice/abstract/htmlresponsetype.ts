export interface RootHTML {
    html: HTML
}

export interface HTML {
    head: Head
    body: Body
    "@_dir": string
}

export interface Head {
    meta: Meum[]
    script: Script[]
}

export interface Meum {
    "@_http-equiv": string
    "@_content": string
}

export interface Script {
    "@_type": string
    "@_src"?: string
    "#text"?: string
}

export interface Body {
    a: A
    form: Form
    "@_style": string
    "@_onload": string
}

export interface A {
    "#text": string
    "@_href": string
}

export interface Form {
    input: Input[]
    "@_name": string
    "@_method": string
    "@_action": string
}

export interface Input {
    "@_type": string
    "@_name": string
    "@_value": string
}
