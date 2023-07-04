import * as path from 'path';


export const EXTENSION_NAME = "miisync";
export const EXTENSION_SETTINGS = "miisync.settings";

const VENDOR_FOLDER = '.vscode';
export const CONFIG_FILENAME = 'miisync.json';
export const CONFIG_USER_FILENAME = 'miisyncuser.json';
export const CONFIG_PATH = path.join(VENDOR_FOLDER, CONFIG_FILENAME);
export const CONFIG_USER_PATH = path.join(VENDOR_FOLDER, CONFIG_USER_FILENAME);