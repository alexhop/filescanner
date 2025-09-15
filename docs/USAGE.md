# FileScanner User Guide

## Getting Started

### First Launch

When you first launch FileScanner, you'll see the main window with three tabs:
- **Scan Paths**: Manage directories to scan
- **Duplicates**: View and manage duplicate files
- **Statistics**: See scan metrics and summaries

### Adding Scan Paths

1. Click the **"Add Path"** button in the Scan Paths tab
2. Select a folder you want to scan for duplicates
3. The path will appear in the list with its status
4. Add multiple paths to scan different locations simultaneously

### Running a Scan

1. After adding paths, click **"Start Scan"**
2. The scan progress panel will show:
   - Current directory being scanned
   - Number of files and folders processed
   - Files hashed for duplicate detection
   - Real-time progress updates

### Scan Phases

The scanner operates in three concurrent phases for optimal performance:

1. **File Discovery**: Quickly catalogs all files and folders
2. **Hash Calculation**: Generates SHA-256 hashes for duplicate detection
3. **Metadata Extraction**: Extracts EXIF, ID3 tags, and other media information

## Managing Duplicates

### Viewing Duplicates

The Duplicates tab shows all duplicate files grouped by content:
- Each group represents files with identical content
- Expand groups to see individual file locations
- View metadata like size, dates, and media information

### Sorting Options

Sort duplicates by:
- **Size**: Largest duplicates first (most space to reclaim)
- **Name**: Alphabetically by filename
- **Count**: Groups with most duplicates first
- **Wasted Space**: Total duplicate space per group

### Filtering

Filter duplicates to find specific types:
- **Images**: JPG, PNG, GIF, etc.
- **Videos**: MP4, AVI, MOV, etc.
- **Documents**: PDF, DOCX, TXT, etc.
- **Archives**: ZIP, RAR, 7Z, etc.
- **Source Code**: JS, PY, JAVA, etc.

### Deleting Duplicates

#### Individual Deletion
1. Expand a duplicate group
2. Click the delete icon next to specific files
3. Confirm the deletion

#### Batch Deletion by Path
1. Click **"Remove by Path"**
2. Select a directory
3. All duplicates within that path will be removed
4. Keep one copy in a different location

## Advanced Features

### Media Intelligence

FileScanner extracts rich metadata from media files:

#### Photos
- **EXIF Data**: Camera model, settings, date taken
- **GPS Coordinates**: Location where photo was taken
- **Dimensions**: Image width and height
- **Perceptual Hash**: Finds similar images even if resized

#### Music Files
- **ID3 Tags**: Artist, album, title, year
- **Audio Info**: Bitrate, format, duration
- **Track Details**: Track number, genre

#### Videos
- **Duration**: Length of video
- **Codec**: Video encoding format
- **Resolution**: Video dimensions

### Incremental Scanning

FileScanner remembers previously scanned files:
- Only rehashes files that have changed
- Significantly faster on subsequent scans
- Automatically detects new and deleted files

### Resume Capability

If a scan is interrupted:
- Progress is saved to the database
- Next scan resumes from where it stopped
- No need to restart from the beginning

## Performance Tips

### Optimizing Scan Speed

1. **Exclude System Folders**: Scanner automatically skips system directories
2. **Use SSDs**: Scanning is much faster on solid-state drives
3. **Close Other Programs**: Reduces disk competition during scanning

### Managing Large Scans

For directories with 100,000+ files:
- Scanner processes in batches to prevent memory issues
- UI remains responsive during scanning
- Progress saved regularly for safety

## Troubleshooting

### Common Issues

#### Scan Seems Stuck
- Check if scanning network drives (slower)
- Large files take longer to hash
- Check the current path in progress panel

#### Missing Duplicates
- Ensure files are in scanned paths
- Check filter settings
- Verify files are actually identical

#### Permission Errors
- Run as administrator on Windows
- Check file permissions on macOS/Linux
- Some system files may be protected

### Database Location

The SQLite database is stored in:
- **Windows**: `%APPDATA%\filescanner\`
- **macOS**: `~/Library/Application Support/filescanner/`
- **Linux**: `~/.config/filescanner/`

## Best Practices

### Regular Scanning
- Schedule weekly scans for active directories
- Monthly scans for archive folders
- Use incremental scanning for efficiency

### Safe Deletion
- Always review duplicates before deleting
- Keep backups of important files
- Use "Remove by Path" for organized cleanup

### Organization Tips
- Keep original files in dedicated folders
- Remove duplicates from download/temp folders first
- Use filtering to focus on specific file types