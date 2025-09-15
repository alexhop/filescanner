# FileScanner User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Adding Scan Paths](#adding-scan-paths)
3. [Scanning for Duplicates](#scanning-for-duplicates)
4. [Managing Duplicates](#managing-duplicates)
5. [Using Filters](#using-filters)
6. [Viewing Statistics](#viewing-statistics)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation
1. Download the latest release for your platform (Windows/Mac)
2. Run the installer
3. Launch FileScanner from your Applications folder or Start Menu

### First Launch
When you first open FileScanner, you'll see three main tabs:
- **Scan Paths**: Manage directories to scan
- **Duplicates**: View and manage duplicate files
- **Statistics**: View scan statistics and insights

## Adding Scan Paths

### Adding a Directory
1. Click the **"Add Path"** button in the Scan Paths tab
2. Browse and select the directory you want to scan
3. The path will appear in your scan list

### Managing Paths
- **Remove a path**: Click the trash icon next to any path
- **View scan history**: See when each path was last scanned
- **File/Folder count**: Shows discovered items from last scan

### Recommended Paths to Scan
- Documents folder
- Downloads folder
- Pictures/Photos directories
- Desktop
- External drives

### Paths to Avoid
- System directories (Windows, Program Files)
- Application directories
- Temporary file locations

## Scanning for Duplicates

### Starting a Scan
1. Add at least one path to scan
2. Click the **"Start Scan"** button
3. Monitor progress in the scan progress panel

### Scan Phases
1. **Metadata Collection**: Fast scan collecting file information
2. **Hash Calculation**: Computing file signatures for comparison

### During Scanning
- **Pause**: Temporarily stop scanning (can resume)
- **Resume**: Continue a paused scan
- **Stop**: Cancel the scan completely

### Scan Progress Indicators
- **Files Scanned**: Total files processed
- **Folders Scanned**: Total directories explored
- **Files Hashed**: Files with calculated signatures
- **Duplicates Found**: Number of duplicate groups detected

## Managing Duplicates

### Viewing Duplicates
1. Navigate to the **Duplicates** tab
2. Each group shows:
   - File name
   - Number of copies
   - File size
   - Wasted space (size × (copies - 1))

### Expanding Groups
- Click on any duplicate group to see all copies
- View full paths and timestamps for each copy
- The first file is considered the "original"

### Deleting Duplicates
1. Expand a duplicate group
2. Click the delete icon next to files you want to remove
3. Confirm deletion in the dialog

### Batch Operations
- **Remove by Path**: Delete all duplicates in a specific folder
- **Keep Oldest**: Automatically keep the oldest version
- **Keep Newest**: Automatically keep the newest version

## Using Filters

### File Type Filter
Filter duplicates by category:
- **All Types**: Show everything
- **Images**: JPG, PNG, GIF, etc.
- **Videos**: MP4, AVI, MKV, etc.
- **Documents**: PDF, DOC, XLS, etc.
- **Source Code**: JS, PY, JAVA, etc.
- **PST Files**: Outlook data files
- **Executables**: EXE, MSI, APP files

### Sorting Options
- **Wasted Space**: Largest space savings first (default)
- **File Size**: Largest files first
- **File Name**: Alphabetical order

### Path Search
- Type in the search box to filter by path
- Useful for focusing on specific directories
- Case-insensitive search

## Viewing Statistics

### Overview Metrics
- **Total Files**: All files in scanned directories
- **Duplicate Files**: Files with at least one copy
- **Wasted Space**: Total recoverable space
- **Space Savings**: Percentage of duplicates

### Duplicates by Type
- Bar chart showing duplicate distribution
- Identify which file types have most duplicates
- Useful for targeted cleanup

## Tips and Best Practices

### Performance Tips
1. **Start Small**: Begin with specific folders rather than entire drives
2. **Close Other Apps**: Free up system resources during scanning
3. **Schedule Scans**: Run during low-activity periods

### Safety Guidelines
1. **Review Before Deleting**: Always check file paths
2. **Keep One Copy**: Ensure you're not deleting all copies
3. **Backup Important Data**: Have backups before bulk deletions
4. **Test with Small Batches**: Delete a few files first

### Optimization Strategies
1. **Regular Scans**: Run monthly to prevent accumulation
2. **Focus on Downloads**: This folder often has most duplicates
3. **Check Cloud Folders**: OneDrive/Google Drive may sync duplicates
4. **Clean Media Files**: Photos and videos use most space

## Troubleshooting

### Common Issues

#### Scan Seems Slow
- Large directories take time
- Hash calculation is CPU-intensive
- Consider scanning smaller portions

#### Files Not Detected as Duplicates
- Files must have identical content
- Metadata differences don't matter
- Similar files aren't duplicates

#### Permission Errors
- Run as administrator (Windows)
- Check file/folder permissions
- Some system files are protected

#### Application Won't Start
- Check system requirements
- Reinstall the application
- Clear application data

### Getting Help
1. Check the error message details
2. Review application logs
3. Report issues on GitHub
4. Include system information

### Data Safety
- FileScanner only reads files for hashing
- Deletions are permanent (use Recycle Bin)
- Database stored in app data folder
- No files are modified during scanning

## Keyboard Shortcuts

- **Ctrl/Cmd + O**: Add scan path
- **Ctrl/Cmd + S**: Start scan
- **Ctrl/Cmd + Q**: Quit application
- **Tab**: Navigate between sections
- **Enter**: Expand selected group
- **Delete**: Remove selected file

## Advanced Features

### Resume Capability
- Interrupted scans can be resumed
- Progress saved in database
- Useful for large scan operations

### Incremental Scanning
- Only changed files are rehashed
- Compares modification date and size
- Significantly faster rescans

### Cloud Storage Support
- Works with synced folders
- Handles OneDrive placeholders
- Compatible with Google Drive

## Privacy and Security

- **Local Processing**: All scanning done on your computer
- **No Network Access**: No data sent to external servers
- **Database Security**: Local SQLite database
- **Hash Privacy**: Only hashes stored, not file contents