
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

------------

- View remote directory and download certain folder from it.
- Open the current screen with command or right click on index.html

## Planned Features

 1. Add 'ignore' property to ignore certain files. (the current state matches file name only)
 2. Upload to QA or Prod.
 3. File comparison when opened
 


## Requirements

Visual Studio Code, MII system to connect to.

## Extension Settings

Your folder must contain miisync.json file in .vscode folder to work.

##### miisync settings:
* `context`: Starting local folder name to specify. Removes any path prior to this.
**Example**: Local folder path is "~~E:\2023\Projects\~~ProjectName\Screen" and the remote path is "ProjectName\Screen" then your context should be "ProjectName". 

* `removeFromContext`: Removes any folder name in local path that is not in remote path.
**Example**: Local folder path is "E:\2023\Projects\ProjectName\webapp\Screen" and the remote path is "ProjectName\Screen" then you should add "webapp" to removeFromContext. 

* `remotePath`: Starting remote path. Adds itself at the front of context. (remotePath + context)
**Example**: Local folder path is "E:\2023\Projects\ProjectName\Screen" and context is "ProjectName", then remotePath should be "". But lets say local folder path was  "E:\2023\Projects\A_ProjectName\Screen" and context was "Screen" then remotePath should be "ProjectName".
* `host`: Address of the target system. google or 11.22.33
* `port`: Port of the target system. 100, 50000.
* `username`: Your username in the mii system to authenticate.
* `password`: Your pasword in the mii system to authenticate. If not provided in the file extension will ask the password during.
* `uploadOnSave`: Uploads the current file when saved.
* `downloadOnOpen`: Downloads the current file when opened.
* `ignore`: Files specified in this doesn't get uploaded.
* `useRootConfig`: Enables usage of another miisync.json outside of the workspace.
* `rootConfig`: Path of another miisync.json file to be used.

##### Commands:

###### mii
* `Create Config`: Creates miisync.json file in the workspace thus activating the extension.
* `Open Current Screen`: Opens the screen in the browser. You can also right-click an index.html file to open.
* `Log in`: Logs in your user. Normally extension should automatically log in when activated.
* `Log out`: Logs out your user. 


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
