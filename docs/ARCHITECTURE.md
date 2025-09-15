# FileScanner Technical Architecture

## Overview

FileScanner is built using Electron for cross-platform desktop application development, combining web technologies with native capabilities.

## Technology Stack

### Core Technologies
- **Electron 38.1.0**: Desktop application framework
- **React 19.1.1**: UI library
- **TypeScript 5.9.2**: Type-safe JavaScript
- **Material-UI 5.18.0**: Component library
- **SQLite3**: Local database
- **TypeORM 0.3.26**: Object-relational mapping

### Media Processing
- **exifr 7.1.3**: EXIF metadata extraction
- **music-metadata 11.8.3**: Audio file metadata
- **imghash 1.1.0**: Perceptual image hashing
- **sharp 0.34.3**: High-performance image processing
- **chokidar 4.0.3**: File system watching

### Build Tools
- **Webpack 5**: Module bundler
- **electron-builder**: Application packaging
- **ts-loader**: TypeScript compilation

## Application Architecture

```
┌─────────────────────────────────────────────┐
│                 Main Process                 │
│  (Node.js + Electron APIs)                  │
│  - Window Management                        │
│  - IPC Communication                        │
│  - Database Operations                      │
│  - File System Access                       │
│  - Concurrent Processing                    │
│  - Metadata Extraction                      │
└──────────────────┬──────────────────────────┘
                   │ IPC
┌──────────────────▼──────────────────────────┐
│              Preload Script                  │
│  - Secure Bridge                            │
│  - API Exposure                             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│             Renderer Process                 │
│  (React + TypeScript)                       │
│  - User Interface                           │
│  - State Management                         │
│  - User Interactions                        │
└──────────────────────────────────────────────┘
```

## Directory Structure

```
filescanner/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Entry point, window creation
│   │   └── preload.ts     # IPC bridge, API exposure
│   │
│   ├── renderer/          # React application
│   │   ├── App.tsx        # Root component
│   │   ├── index.tsx      # React entry point
│   │   └── components/    # UI components
│   │       ├── ScanPathManager.tsx
│   │       ├── ScanProgress.tsx
│   │       ├── DuplicatesList.tsx
│   │       └── Statistics.tsx
│   │
│   ├── database/          # Data persistence layer
│   │   ├── connection.ts  # Database configuration
│   │   └── entities/      # TypeORM entities
│   │       ├── File.ts
│   │       ├── ScanPath.ts
│   │       └── ScanSession.ts
│   │
│   └── services/          # Business logic
│       ├── FileScanner.ts # Scanning engine
│       └── DuplicateService.ts # Duplicate management
│
├── dist/                  # Compiled output
├── docs/                  # Documentation
└── tests/                 # Test files
```

## Core Components

### Main Process (main.ts)

Responsibilities:
- Application lifecycle management
- Window creation and management
- Menu bar configuration
- IPC handler registration
- Service initialization

Key Features:
- Single window application
- Native menus with keyboard shortcuts
- Graceful shutdown handling

### Preload Script (preload.ts)

Security Bridge:
- Exposes limited API to renderer
- Prevents direct Node.js access
- Implements context isolation

API Methods:
```typescript
electronAPI = {
  selectDirectory(),
  scanPath: { add(), getAll(), remove() },
  scan: { start(), pause(), resume(), stop() },
  duplicates: { get(), removeFile(), removeInPath() }
}
```

### Renderer Process

React application with Material-UI components:
- **App.tsx**: Main layout, tab navigation
- **ScanPathManager**: Directory selection and management
- **ScanProgress**: Real-time scan monitoring
- **DuplicatesList**: Interactive duplicate browser
- **Statistics**: Data visualization

## Database Schema

### Files Table
```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  filePath TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileExtension TEXT,
  size BIGINT NOT NULL,
  createdDate DATETIME,
  modifiedDate DATETIME,
  hash TEXT,
  hashCalculated BOOLEAN DEFAULT FALSE,
  mimeType TEXT,
  isDeleted BOOLEAN DEFAULT FALSE,
  lastScanned DATETIME
);
```

### ScanPaths Table
```sql
CREATE TABLE scan_paths (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  isRecursive BOOLEAN DEFAULT TRUE,
  lastScanStarted DATETIME,
  lastScanCompleted DATETIME,
  scanStatus TEXT,
  filesFound INTEGER DEFAULT 0,
  foldersFound INTEGER DEFAULT 0
);
```

### ScanSessions Table
```sql
CREATE TABLE scan_sessions (
  id INTEGER PRIMARY KEY,
  startTime DATETIME NOT NULL,
  endTime DATETIME,
  status TEXT NOT NULL,
  filesScanned INTEGER DEFAULT 0,
  filesHashed INTEGER DEFAULT 0,
  duplicatesFound INTEGER DEFAULT 0,
  currentPath TEXT,
  errorMessage TEXT
);
```

## Services

### FileScanner Service

Two-phase scanning approach:
1. **Metadata Phase**: Fast directory traversal
   - Collects file paths, names, sizes
   - Updates database with file information
   - Identifies new and modified files

2. **Hashing Phase**: Content analysis
   - Calculates SHA-256 hashes
   - Processes files in batches
   - Updates hash information

Features:
- Event-driven progress updates
- Pause/resume capability
- Incremental scanning
- Directory exclusion rules

### DuplicateService

Duplicate management:
- Groups files by content hash
- Calculates wasted space
- Provides filtering options
- Handles safe file deletion

## IPC Communication

### Request/Response Pattern
```javascript
// Renderer
const result = await electronAPI.scan.start()

// Main
ipcMain.handle('scan:start', async () => {
  return await scanner.start()
})
```

### Event Pattern
```javascript
// Main
scanner.on('progress', (data) => {
  mainWindow.webContents.send('scan:progress', data)
})

// Renderer
electronAPI.scan.onProgress((data) => {
  updateUI(data)
})
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**
   - Hash calculation in batches of 10
   - Database operations batched
   - UI updates throttled

2. **Incremental Scanning**
   - Skip unchanged files (same size/date)
   - Maintain scan state in database
   - Resume capability for large operations

3. **Memory Management**
   - Stream-based file reading
   - Chunked hash calculation
   - Limited query result sets

### Scalability Limits

- Tested with ~100,000 files
- Hash calculation: ~100 MB/s
- Database size: ~1 KB per file
- UI responsive up to 10,000 duplicates

## Security Model

### Process Isolation
- Main process: Full Node.js access
- Renderer: No direct file system access
- Preload: Controlled API bridge

### Data Protection
- Local-only processing
- No network requests
- Database in user data directory
- No sensitive data logging

## Build and Deployment

### Development Build
```bash
npm run dev    # Webpack watch mode
npm start      # Start Electron
```

### Production Build
```bash
npm run build  # Webpack production
npm run dist   # Electron-builder
```

### Platform Packages
- Windows: NSIS installer (.exe)
- macOS: DMG image (.dmg)
- Linux: AppImage (future)

## Testing Strategy

### Unit Tests (Jest)
- Service logic testing
- Database operations
- Utility functions

### Integration Tests
- IPC communication
- Database transactions
- File system operations

### E2E Tests (Playwright)
- User workflows
- UI interactions
- Cross-platform verification

## Future Enhancements

### Performance
- Worker threads for hashing
- Virtual scrolling for large lists
- Lazy loading for results

### Features
- Plugin architecture
- Network drive support
- Cloud storage integration
- AI-powered recommendations

### Technical Debt
- Migrate to Vite
- Implement dependency injection
- Add comprehensive logging
- Performance profiling tools