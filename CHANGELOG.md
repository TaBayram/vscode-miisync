# Change Log

## [0.13.1] - 30/10/2023

### Changed

- view and sub menu icons.

## [0.13.0] - 25/10/2023

### Added

- Multiple file and folder selection support for all mii sync actions.
- MII Sync Action submenu to workspace view, editor title context.
- Added severity property to system. There are 4 levels: low, medium, high, critical. With each level, more actions require confirmation.

### Changed

- Grouped the actions in explorer context.

### Removed

- Upload/Download commands in command palete.

### Fixed

- File properties view not updating after opening workspace and after switching system.

## [0.12.0] - 10/10/2023

### Added

- `Download Transaction Properties` editor command. Must select a transaction path.

### Changed

- `Switch System` can be called without logging in.
- `Transfer Files & Folder` commands now has multiple system selection option.

### Fixed

- A bug where you couldn't log in when your credentials had special characters.

## [0.11.6] - 14/09/2023

### Added

- `Transfer File` explorer command.
- Default '*.' ignore case.
- System name to most logs.

### Fixed

- Deleting files wouldn't clear the cache.

## [0.11.5] - 04/08/2023

### Changed

- Refresh login doesn't try after 3 failed attempts.

### Fixed

- Where upload folder would create normally ignored folder.
- Where the root folder upload folder path was wrong


## [0.11.4] - 26/07/2023

### Added

- Prompt when uploading folder.

### Fixed

- Upload git changes crashing when there are deleted files.

## [0.11.3] - 10/07/2023

### Fixed

- Crash related to root config usage.

## [0.11.2] - 10/07/2023

### Changed

- Upload git changes now is limited.

### Fixed

- Where two different systems with the same name's cookies would conflict with eachother.
- Where changing only the system's name would not log in.

## [0.11.0] - 04/07/2023

### Added

- `Switch System` command. With this command you can switch the current main system.
- `Upload Changes` command. With this command you can upload files that changed in git system.

### Fixed

- Where 'Download/Upload Current File' command on explorer was disabled when there was no open editor.
- Where logging out wouldn't destroy the current session.

## [0.10.0] - 12/06/2023

### Added

- `Delete Folder` explorer command.
- New Config: `Include` which basically will override ignores if they match the same.
- New Setting: `Request Limit`.
- Progress window for downloading/uploading folder. Now can be cancellable by pressing it thus changing it to notification window and clicking 'Cancel'

### Changed

- Ignore uses [ignore](https://github.com/kaelzhang/node-ignore) instead of micromatch. Now you manually have to ignore dot files/folders.
- Download Folder is now promise limited.
- Cancelling "Download Where" pick now cancels the download process.

### Fixed

- Upload folder logging "Download Folder" text.
- Upload folder not creating empty folders.
- Where pressing on upload/download file on fileproperties view wouldn't work.


## [0.9.1] - 29/05/2023

### Added

- `Upload/Download Current Workspace`commands.
- `Open Current Screen` button to remote directory.

### Changed

- Now every upload/download log should say the file/folder name.

### Fixed

- Issue #4 [Uploading folder and its contents creates duplicate folders]

## [0.9.0] - 24/05/2023

### Added

- Upload and Download folder to file properties view.
- New Settings: `sessionDuration` and `refreshSession`
- Download remote file command.
- `Open Root Config` explorer/context command for miisync.json file that opens the root config if useRootConfig is true.

### Changed

- Save and Delete commands log shows which file.
- Now there should be only one session throughout multiple open vs code projects. 
- Instead of checking if the `remotePath` exists, it now checks if the project exists (the first folder name in `remotePath`).

### Fixed

- Where upload on save was calling before log in service was succesful, causing system to create multiple sessions.
- Where extension settings couldn't be read.
- 
## [0.8.7] - 15/05/2023

### Added

- Periodic session refreshing

### Changed

- Save and Delete commands log shows which file

### Fixed

- Where upload on save was calling before log in service was succesful, causing system to create multiple sessions.

## [0.8.6] - 11/05/2023

### Added

- Option of absolute path when downloading remote folder.

### Changed

- Create Config command doesn't dissapear after creation. 

### Removed

- File save event firing warning log. 

## [0.8.5] - 09/05/2023

### Added

- Host information on statusbar tooltip.

### Fixed

- Whilst logged in changing system config wouldn't attempt to reloging.
- Authentication not working on some username password combinations.


## [0.8.4] - 09/05/2023

### Added

- Socket limit to limit requests.


## [0.8.3] - 09/05/2023

Initial release.