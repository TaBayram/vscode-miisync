# Change Log

All notable changes to the "miisync" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.


## [0.8.8] - 18/05/2023

### Added

- Upload and Download folder to file properties view.
- New Settings: "sessionDuration" and "refreshSession"

### Changed

- Save and Delete commands log shows which file.
- Now there should be only one session throughout multiple open vs code projects. 

### Fixed

- Where upload on save was calling before log in service was succesful, causing system to create multiple sessions.
- Where extension settings couldn't be read.

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