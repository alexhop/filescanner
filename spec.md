# FileScanner

## Specification

### Overview

A cross-platform GUI application for scanning and managing duplicate files in the file system, with support for Windows and Mac.

### Additional AI instructions

Do not timeout when building this. Do not limit the number of tool executions. Do stop if there are key questions in the design or execution that need to be resolved.

Maintain a todo list in a file called todo.md

Update this document with technical details of the desgn and implementation.

### Core Requirements

#### Platform & Architecture

- **Cross-platform compatibility**: Windows and Mac support
- **GUI application**: User-friendly graphical interface
- **Local database**: Simple database for storing file information

#### File Scanning Features

##### Data Collection

For each file encountered during scanning, track:

- File name
- Creation date
- Modified date
- File type
- File size
- Hash of file contents
If the file is media that contains it keep track of
- Time picture/video taken
- Geolocation
- Other photo metadata
For songs (mp3, wma, flac, other formats) keep track of
- Album
- Artist
- AlbumArtist
- Song name
- Track number
- Encoding type
- Encoding bps

##### Scanning Behavior

- **Background scanning**: Performs scans without blocking the UI
- **Two-phase scanning**:
  1. First pass: Collect file metadata (name, dates, type, size)
  2. Second pass: Calculate and store file content hashes
- **Resume capability**: Maintains scan status in database to resume interrupted scans
- **Incremental scanning**: Detects changed files since last scan
  - Skip hash recalculation for unchanged files (same modification date and size)
- **Cloud storage compatibility**: Works correctly with OneDrive and Google Drive synced directories

### User Interface

#### Path Management

- Easy-to-use feature for adding file paths to scan list

#### Scan Status Panel

Display real-time scanning information:

- Current location being scanned
- Number of files identified
- Number of folders identified

#### Duplicate Files Display

Main application view showing:

- List of detected duplicate files
- File path for each duplicate
- File metadata for each duplicate

##### Sorting & Filtering

- **Sorting options**:
  - Full path
  - File name only
  - File size
- **Filter options by file type**:
  - Images only
  - Videos only
  - Source code files
  - PST files
  - EXEs
  - Other specific file types

### Duplicate Detection

#### Advanced Detection

- **Content-based matching**: Detect duplicates based on file content hash
- **Media file handling**: For images and videos, identify duplicates even when:
  - Files have been renamed
  - Files have different modification dates
  - Content remains identical

### File Management

#### Duplicate Removal

- **Individual removal**: Select and remove specific duplicate files
- **Batch removal by path**: Select a folder path and remove all duplicates within that path

#### AI Recommendations

 Integrate with an AI to make recommendations about cleaning up files.
 Identify a free or inexpensive AI to use with this.
 Explore using a local AI that can be run without having to call a remote API
 Optional feature that needs to be explicitly invoked from the UI
 Send prompts to the AI with files or directories to make decisions about
 Display in the GUI a list of recommended files and folders that the AI recommends removing

### Quality Assurance

- **Complete test coverage**: Comprehensive test cases for all functionality
- **Documentation**: Full documentation of features and usage

### Github

- **Github Project**: Make a private github project and everytime you make changes update the code in the github project
- **Github commands**: Use github commandline tool to access github or use a MCP
- **Readme.md**: Create a readme file for the Github with complete info
- **Documentation**: Create a documentation directory for github with info on usage and design of the app

## Questions to resolve

Add any open questions or issues to resolve to this section. If necessary stop working on the code until key questions are resolved here.

### Technology Stack Questions

1. **GUI Framework**: Which cross-platform GUI framework should we use?
Use Electron + React
   - **Electron + React/Vue**: Web technologies, excellent cross-platform support, familiar to many developers
   - **Tauri + React/Vue**: Lighter than Electron, uses native webview, better performance
   - **Qt (Python/C++)**: Native performance, mature framework
   - **Flutter**: Google's UI toolkit, good performance
   - **Recommendation**: Electron + React for rapid development and excellent ecosystem

2. **Database Choice**: What local database should we use?
Use SQLite
   - **SQLite**: Lightweight, serverless, perfect for local applications
   - **LevelDB**: Key-value store, very fast
   - **Recommendation**: SQLite for its maturity, SQL support, and ability to handle complex queries

3. **Programming Language**: What should be the primary language?
Use TypeScript
   - **TypeScript/JavaScript**: If using Electron/Tauri
   - **Python**: If using Qt
   - **Recommendation**: TypeScript with Electron for type safety and ecosystem

4. **Hash Algorithm**: Which algorithm for file content hashing?
Use SHA-256
   - **SHA-256**: Cryptographically secure, widely supported
   - **MD5**: Faster but less secure (sufficient for duplicate detection)
   - **xxHash**: Very fast, non-cryptographic
   - **Recommendation**: SHA-256 for reliability, with option to use xxHash for large files

5. **File System Watching**: How to handle real-time file changes?
Use chokidar
   - **chokidar** (Node.js): Cross-platform file watching
   - **Native OS APIs**: More efficient but platform-specific
   - **Recommendation**: chokidar for cross-platform compatibility

### Implementation Approach

Based on the requirements and to ensure cross-platform compatibility, I recommend:

- **Frontend**: Electron + React + TypeScript
- **Database**: SQLite with TypeORM
- **Backend**: Node.js with TypeScript
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Build**: electron-builder for packaging

This stack provides excellent cross-platform support, a rich ecosystem, and rapid development capabilities.
