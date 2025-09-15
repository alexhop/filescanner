# FileScanner

A cross-platform desktop application for detecting and managing duplicate files on your system.

## Features

- **Cross-Platform Support**: Works on Windows and macOS
- **Smart Duplicate Detection**: Uses SHA-256 hashing to accurately identify duplicate files
- **Two-Phase Scanning**: Fast metadata collection followed by hash calculation
- **Resume Capability**: Can resume interrupted scans
- **Advanced Filtering**: Filter duplicates by file type, size, and location
- **Safe File Management**: Review before deleting, with options to keep oldest/newest
- **Real-time Progress**: Live updates during scanning
- **Cloud Storage Compatible**: Works with OneDrive and Google Drive synced folders

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
git clone https://github.com/yourusername/filescanner.git
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
├── main/           # Electron main process
│   ├── main.ts     # Application entry point
│   └── preload.ts  # Preload script for IPC
├── renderer/       # React application
│   ├── App.tsx     # Main React component
│   └── components/ # UI components
├── database/       # Database layer
│   ├── entities/   # TypeORM entities
│   └── connection.ts
└── services/       # Business logic
    ├── FileScanner.ts
    └── DuplicateService.ts
```

## Database Schema

The application uses SQLite with three main tables:

- **files**: Stores file metadata and hashes
- **scan_paths**: Manages directories to scan
- **scan_sessions**: Tracks scanning history

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

## Roadmap

- [ ] AI-powered cleanup recommendations
- [ ] Network drive support
- [ ] Duplicate image detection (perceptual hashing)
- [ ] Scheduled scans
- [ ] Export reports (CSV, PDF)
- [ ] Dark mode support

## Acknowledgments

Built with Electron, React, TypeScript, and Material-UI.