
# miisync README

This extension should sync the file in mii workbench with local file whenever you save it

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

- View remote directory and download certain folder from it.
- Open the current screen with command or right click on index.html

## Planned Features
 
1. Adding cancel option to download folder, download remote folder, and upload folder commands.

## Requirements

Visual Studio Code, MII system to connect to.

## Extension Settings

Your folder must contain miisync.json file in .vscode folder to work.

##### miisync settings:
localPath is the folder that contains used .vscode/miisync.json
* `removeFromLocalPath`: Removes any folder name in local path that is not in remote path.
**Example**: Local folder path is "E:\2023\Projects\ProjectName\webapp\Screen" and the remote path is "ProjectName\Screen" then you should add "webapp" to removeFromLocalPath. 

* `remotePath`: Starting remote path. Adds itself at the front of localPath. (remotePath + localPath)
**Example**: Local folder path is "E:\2023\Projects\ProjectName\Screen" and localPath is "ProjectName", then remotePath should be "". But lets say local folder path was  "E:\2023\Projects\A_ProjectName\Screen" and localPath was "Screen" then remotePath should be "ProjectName".
* `system`: Array of systems to connect to.
    * `name`: Name of the system. Your choice
    * `isMain`: Only one of the system must be true. Connects to this system.
    * `host`: Address of the target system. google or 11.22.33
    * `port`: Port of the target system. 100, 50000.
    * `username`: Your username in the mii system to authenticate.
    * `password`: Your pasword in the mii system to authenticate. If not provided in the file extension will ask the password during.
* `uploadOnSave`: Uploads the current file when saved.
* `downloadOnOpen`: Downloads the current file when opened.
* `ignore`: Wildcards specified in this doesn't get uploaded/downloaded. Look at [micromatch](https://github.com/micromatch/micromatch)
* `useRootConfig`: Enables usage of another miisync.json outside of the workspace.
* `rootConfig`: Path of another miisync.json file to be used.

##### Commands:

###### mii
* `Create Config`: Creates miisync.json file in the workspace thus activating the extension.
* `Open Current Screen`: Opens the screen in the browser. You can also right-click an index.html file to open.
* `Log in`: Logs in your user. Normally extension should automatically log in when activated.
* `Log out`: Logs out your user. 
* `Disable/Enable Upload on Save`: Enables/Disables upload functionality when a file is saved. 
* `Disable/Enable Download on Open`: Enables/Disables download functionality when a file is opened. 
* `Upload Current File`: Uploads the active file to the remote system. Also is in explorer context menu.
* `Download Current File`: Downloads the active file from the remote system. Also is in explorer context menu.
* `Export Project`: Exports the project as a zip file. (Opens link)


##### Explorer Context:
* `Upload Current File`: Uploads the selected file to the remote system.
* `Download Current File`: Downloads the selected file from the remote system.
* `Delete Current File`: Deletes the selected from the remote system only.
* `Upload Current File`: Uploads the selected file. Also is in explorer context menu. 
* `Download Folder`: Downloads the selected folder.
* `Upload Folder`: Uploads the selected folder.
* `Transfer Folder`: Transfers the selected folder to selected system.

##### View:
* `Download Remote Directory`: Lists all the files in the current project like a directory. (Does not list empty folders)
* `Download Remote Folder`: Downloads the selected remote folder and its contents.
* `Download File Properties`: Downloads the file properties like created time, updated user.

## Known Issues

- Logout doesn't terminate session.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

**Enjoy!**
