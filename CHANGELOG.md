# Change Log

All notable changes to the "miisync" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.10.0] - 09/06/2023

### Added

- `Delete Folder` explorer command.
- New Setting: `Request Limit`.
- Progress window for downloading/uploading folder. Now can be cancellable by pressing it thus changing it to notification window and clicking 'Cancel'

### Changed

- Download Folder is now promise limited.
- Cancelling "Download Where" pick now cancels the download process.

### Fixed

- Upload folder logging "Download Folder" text.
- Upload folder not creating empty folders.

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