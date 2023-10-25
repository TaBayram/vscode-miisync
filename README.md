
# miisync README

This extension tries to be a replacement for the web side of the standart mii workbench.

**Made by NTT Data Business Solutions Turkiye MII Team**

## Usage

1. Install & enable extension
2. From 'Command Palette' type 'mii: create config' and press enter
4. Now configure the miisync.json file.
5. There must be one main system to connect to. Set isMain property 'true' for one of the systems.


## Features

#### File
- Upload to / Download and Delete from MII system.
- Get file properties upon opening file.
- When uploading, prompts file creation if it doesn't exist on the system.
- Prompts to download file if it has been modified by other user.
#### Folder
- Upload to / Download from MII system.
- When uploading, prompts folder creation if it doesn't exist on the system.
#### Transfer
- Transfer folder between systems.
------------

- View remote directory and download certain folder/file from it.
- Open the current screen with command or right click on index.html

## Planned Features

## Requirements

- Visual Studio Code.
- MII system to connect to.
- .vscode/miisync.json file for full features.

## Extension Settings

* `Session Duration`: How long does session lasts in minutes in the MII system.
* `Refresh Session`: Should extension perodically send request to renew session?
* `Request Limit`: The maximum number of requests to server it can send. Used in folder download/upload/transfer. Increasing it can introduce instability.
* `Show Diff Notification`: Should the extension see if the currently opened file is different from the remote file and show a notification if it is?

------------



Your folder must contain miisync.json file in .vscode folder to work.

##### miisync.json settings:
localPath is the folder that contains used .vscode/miisync.json. (if rootconfig enabled then it path calculation starts from there)
* `system`: Array of systems to connect to.
    * `name`: Name of the system. Your choice
    * `isMain`: Only one of the system must be true. Connects to this system.
    * `severity`: Severity level of the system. The higher the more confirms asked for operations.
    * `host`: Address of the target system. google or 11.22.33
    * `port`: Port of the target system. 100, 50000.
    * `username`: Your username in the mii system to authenticate.
    * `password`: Your pasword in the mii system to authenticate. If not provided in the file extension will ask the password during.
* `remotePath`: Remote project path. Must start with the project name.
**Example**: If you want to work on "productStoppageScreen" then your remote path should be like "PROJECT/PLANT2/Stoppages/productStoppageScreen". If you want to work on "PLANT2" screens then it should be "PROJECT/PLANT2".
* `removeFromLocalPath`: Removes any folder name in local path that is not in remote path.
**Example**: Local folder path is "E:\2023\Projects\ProjectName\webapp\Screen" and the remote path is "ProjectName\Screen" then you should add "webapp" in removeFromLocalPath. 
* `ignore`: Items that matches any of these glob patterns does not get uploaded/downloaded. Look at [ignore](https://github.com/kaelzhang/node-ignore)
* `include`: Matched items gets included. Will override ignore if they have the same pattern. Look at [ignore](https://github.com/kaelzhang/node-ignore)
* `uploadOnSave`: Uploads the current file when saved.
* `downloadOnOpen`: Downloads the current file when opened.
* `useRootConfig`: Enables usage of another miisync.json outside of the workspace.
* `rootConfig`: Path of another miisync.json file to be used.

##### Commands:

###### mii
* `Create Config`: Creates miisync.json file in the workspace thus activating the extension. Your first command.
* `Log in`: Logs in your user. Normally extension should automatically log in when activated.
* `Log out`: Logs out your user. 
* `Disable/Enable Upload on Save`: Enables/Disables upload functionality when a file is saved. 
* `Disable/Enable Download on Open`: Enables/Disables download functionality when a file is opened. 
* `Upload Changes`: Uploads uncommitted changed files.
* `Export Project`: Exports the project as a zip file. (Opens link)


##### Explorer Context:
* `Download`: Downloads the selection from the main system.
* `Upload`: Uploads the selection to the main system.
* `Transfer`: Transfers the selection to selected systems.
* `Delete`: Deletes the selection from the main system only.
* `Open Root Config`: Opens the root miisync.json file if useRootConfig is set to true and rootConfig has valid path.
* `Open Current Screen`: Opens the screen in the browser. Is visible if you right-click an index.html.

##### Explorer File View:
* `Download`: Downloads the workspace from the main system.
* `Upload`: Uploads the workspace to the main system.
* `Transfer`: Transfers the workspace to selected systems.
* `Delete`: Deletes the workspace from the main system only.

##### Editor Title Context:
* `Download`: Downloads the file from the main system.
* `Upload`: Uploads the file to the main system.
* `Transfer`: Transfers the file to selected systems.
* `Delete`: Deletes the file from the main system only.

##### Editor Context:
* `Download Transaction Properties`: Previews transaction's properties. You must select the transaction path first.


##### View:
* `Download Remote Directory`: Lists all the files in the current project like a directory. (Does not list empty folders)
* `Download Remote Folder`: Downloads the selected remote folder and its contents.
* `Download Remote File`: Downloads the selected remote file.
* `Download File Properties`: Downloads the file properties like created time, updated user.

## Known Issues

- 

**Enjoy!**
