# FileScanner

A powerful cross-platform desktop application for detecting and managing duplicate files, with advanced media metadata extraction and image similarity detection.

## Features

### Core Functionality
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Smart Duplicate Detection**: Uses SHA-256 hashing to accurately identify duplicate files
- **Concurrent Processing**: Three-phase parallel scanning for optimal performance
- **Resume Capability**: Can resume interrupted scans from where they left off
- **Incremental Scanning**: Skips unchanged files based on modification date and size
- **Advanced Filtering**: Filter duplicates by file type, size, and location
- **Safe File Management**: Review before deleting, with batch operations support
- **Real-time Progress**: Live updates during scanning with detailed metrics
- **Cloud Storage Compatible**: Works with OneDrive and Google Drive synced folders

### Media Intelligence
- **Image Metadata Extraction**: EXIF data including GPS coordinates, camera model, dates
- **Perceptual Image Hashing**: Detect similar images even if resized or slightly modified
- **Music Metadata**: Extract ID3 tags (artist, album, track number, bitrate)
- **Video Information**: Duration and codec details
- **Smart Grouping**: Groups similar media files together

## Technology Stack

- **Frontend**: Electron + React + TypeScript + Material-UI
- **Database**: SQLite with TypeORM
- **Backend**: Node.js with TypeScript
- **Build Tools**: Webpack, electron-builder

## Installation

### Prerequisites

- Node.js 16+ and npm
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/alexhop/filescanner.git
cd filescanner
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Development

For development with hot-reload:

1. Start webpack in watch mode:
```bash
npm run dev
```

2. In another terminal, start Electron:
```bash
npm start
```

## Building for Distribution

To create distributable packages:

```bash
npm run dist
```

This will create installers for your current platform in the `dist` folder.

## Usage

1. **Add Scan Paths**: Click "Add Path" to select directories you want to scan
2. **Start Scan**: Click "Start Scan" to begin scanning for duplicates
3. **Review Duplicates**: Browse found duplicates in the Duplicates tab
4. **Filter Results**: Use filters to find specific types of duplicates
5. **Remove Duplicates**: Select individual files or batch remove by path

## Features in Detail

### Intelligent Scanning
- Skips system and hidden directories
- Handles large files efficiently
- Preserves file metadata

### Duplicate Detection
- Content-based matching using SHA-256
- Identifies duplicates even with different names
- Groups duplicates by content hash

### File Management
- Safe deletion with confirmation
- Batch operations by directory
- Option to keep oldest or newest version

### Statistics
- Total files scanned
- Duplicate count and wasted space
- Breakdown by file type

## Architecture

```
src/
├── main/               # Electron main process
│   ├── main.ts        # Application entry point
│   └── preload.ts     # Preload script for IPC
├── renderer/          # React application
│   ├── App.tsx        # Main React component
│   └── components/    # UI components
├── database/          # Database layer
│   ├── entities/      # TypeORM entities
│   └── connection.ts  # Database configuration
└── services/          # Business logic
    ├── FileScanner.ts         # Core scanning engine
    ├── DuplicateService.ts    # Duplicate detection
    └── MetadataExtractor.ts   # Media metadata extraction
```

## Database Schema

The application uses SQLite with the following main tables:

- **files**: Comprehensive file metadata including:
  - Basic info: path, name, size, dates, SHA-256 hash
  - Media metadata: EXIF data, GPS coordinates, camera info
  - Music metadata: artist, album, title, bitrate
  - Image fingerprints: perceptual hashes for similarity
- **scan_paths**: Manages directories to scan
- **scan_sessions**: Tracks scanning history and progress

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License

## Support

For issues and feature requests, please use the GitHub issues page.

## Recent Updates

- ✅ **Media Metadata Extraction**: Full EXIF, ID3 tag support
- ✅ **Perceptual Hashing**: Similar image detection implemented
- ✅ **Concurrent Processing**: Parallel scanning, hashing, and metadata extraction
- ✅ **Extended Database Schema**: Support for comprehensive media metadata

## Roadmap

- [ ] AI-powered cleanup recommendations (Ollama integration planned)
- [ ] File system watcher for real-time monitoring
- [ ] Network drive support
- [ ] Scheduled scans
- [ ] Export reports (CSV, PDF)
- [ ] Dark mode support
- [ ] Archive content scanning (ZIP, RAR)

## Technologies Used

- **Electron**: Cross-platform desktop framework
- **React**: UI library with TypeScript
- **Material-UI**: Component library for modern UI
- **TypeORM**: Type-safe database ORM
- **SQLite**: Embedded database
- **exifr**: EXIF data extraction
- **music-metadata**: Audio metadata parsing
- **imghash**: Perceptual image hashing
- **sharp**: High-performance image processing
- **chokidar**: File system watching

## Performance

- Handles directories with 100,000+ files
- Concurrent processing reduces scan time by up to 60%
- Incremental scanning avoids unnecessary rehashing
- Batch database operations for efficiency

## Privacy

- All data stored locally in SQLite database
- No cloud services or external APIs required
- Complete control over your file data