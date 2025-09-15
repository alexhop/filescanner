# FileScanner TODO List

## Completed ✅

### Phase 1: Foundation
- [x] Set up project structure with Electron + React + TypeScript
- [x] Configure webpack for multi-target builds
- [x] Set up TypeORM with SQLite database
- [x] Create database entities (File, ScanPath, ScanSession)

### Phase 2: Core Functionality
- [x] Implement file scanning engine with two-phase approach
- [x] Add SHA-256 hash calculation for files
- [x] Create duplicate detection service
- [x] Implement resume capability for interrupted scans
- [x] Add incremental scanning (skip unchanged files)

### Phase 3: User Interface
- [x] Build main application layout with Material-UI
- [x] Create scan path management interface
- [x] Implement real-time scan progress display
- [x] Build duplicates list with expandable groups
- [x] Add statistics dashboard

### Phase 4: Features
- [x] Add sorting options (by size, name, wasted space)
- [x] Implement filtering by file type
- [x] Add path-based filtering
- [x] Implement individual file deletion
- [x] Add batch deletion by path

## In Progress 🚧

### Media & Music Metadata Extraction
- [ ] Install exifr for image EXIF data extraction
- [ ] Install music-metadata for audio file metadata
- [ ] Install fluent-ffmpeg for video metadata
- [ ] Add metadata fields to File entity
- [ ] Implement metadata extraction in FileScanner

## Pending 📋

### Testing
- [ ] Write unit tests for FileScanner service
- [ ] Write unit tests for DuplicateService
- [ ] Create integration tests for database operations
- [ ] Add E2E tests with Playwright
- [ ] Set up test coverage reporting

### Documentation
- [ ] Create user manual
- [ ] Add API documentation
- [ ] Write developer guide
- [ ] Create troubleshooting guide

### Performance Optimizations
- [ ] Implement worker threads for hash calculation
- [ ] Add database indexing optimizations
- [ ] Implement chunked file reading for large files
- [ ] Add caching for frequently accessed data

### Concurrent Two-Phase Scanning
- [ ] Implement concurrent metadata collection and hashing
- [ ] Add worker threads for parallel processing
- [ ] Optimize queue management for better performance

### File System Watching
- [ ] Integrate chokidar for real-time file monitoring
- [ ] Auto-detect new/modified/deleted files
- [ ] Update database in real-time

### Additional Features
- [ ] **AI Integration (Local Models)**
  - [ ] Research and integrate Ollama for local AI
  - [ ] Implement AI recommendation service
  - [ ] Create UI for AI suggestions
  - [ ] Add batch AI analysis for file cleanup recommendations

- [ ] **Advanced Detection**
  - [ ] Implement perceptual hashing for images
  - [ ] Add fuzzy matching for similar files
  - [ ] Support for archive content scanning

- [ ] **User Experience**
  - [ ] Add dark mode support
  - [ ] Implement drag-and-drop for paths
  - [ ] Add keyboard shortcuts
  - [ ] Create context menus

- [ ] **Export & Reporting**
  - [ ] Export duplicate list to CSV
  - [ ] Generate PDF reports
  - [ ] Add scan history view
  - [ ] Create storage analysis charts

### Platform-Specific
- [ ] Create Windows installer with electron-builder
- [ ] Create macOS DMG package
- [ ] Add auto-update functionality
- [ ] Implement OS-specific optimizations

### Bug Fixes & Improvements
- [ ] Handle symbolic links properly
- [ ] Improve error handling and user feedback
- [ ] Add network drive support
- [ ] Optimize memory usage for large scans

## Known Issues 🐛

1. **Performance**: Large directories (>100k files) may cause UI lag
2. **Memory**: Hash calculation for very large files needs optimization
3. **UI**: Grid component compatibility issues with MUI v6+
4. **Platform**: Icon path needs adjustment for packaged app

## Future Considerations 🔮

- Cloud backup integration
- Multi-language support
- Plugin system for custom scanners
- Mobile companion app
- Web-based version using Tauri

## Technical Debt 💳

- Migrate from webpack to Vite for faster builds
- Update to latest MUI version when Grid2 is stable
- Refactor scanner to use async iterators
- Implement proper dependency injection
- Add comprehensive error boundaries

## Notes 📝

- Current hash algorithm: SHA-256 (consider xxHash for speed)
- Database location: User's app data directory
- Max file size for hashing: Currently unlimited (needs limit)
- Scan exclusions: node_modules, .git, hidden directories