# FileScanner Developer Guide

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Git
- Visual Studio Code (recommended)
- Windows, macOS, or Linux

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/alexhop/filescanner.git
cd filescanner
```

2. Install dependencies:
```bash
npm install
```

3. Set up development environment:
```bash
# Start webpack in watch mode (terminal 1)
npm run dev

# Start Electron app (terminal 2)
npm start
```

## Project Structure

```
filescanner/
├── src/
│   ├── main/               # Electron main process
│   │   ├── main.ts        # Entry point
│   │   └── preload.ts     # IPC bridge
│   ├── renderer/          # React application
│   │   ├── App.tsx        # Main component
│   │   ├── index.tsx      # React entry
│   │   └── components/    # UI components
│   ├── database/          # Database layer
│   │   ├── entities/      # TypeORM entities
│   │   └── connection.ts  # DB configuration
│   └── services/          # Business logic
│       ├── FileScanner.ts         # Scanning engine
│       ├── MetadataExtractor.ts   # Media metadata
│       └── DuplicateService.ts    # Duplicate management
├── docs/                  # Documentation
├── tests/                 # Test files
├── dist/                  # Build output
└── package.json          # Dependencies
```

## Key Concepts

### IPC Communication

Communication between main and renderer processes:

```typescript
// Main process (main.ts)
ipcMain.handle('scan:start', async (event, paths) => {
  const result = await scanner.startScan(paths);
  return result;
});

// Renderer process (via preload)
const result = await window.api.startScan(paths);
```

### Database Operations

Using TypeORM for database management:

```typescript
// Entity definition
@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  filePath!: string;

  // ... other columns
}

// Repository usage
const fileRepo = dataSource.getRepository(File);
const file = await fileRepo.findOne({ where: { filePath } });
```

### Concurrent Processing

The scanner implements three concurrent phases:

```typescript
// In FileScanner.ts
const scanPromise = this.performScan();
const hashingPromise = this.performHashingConcurrently();
const metadataPromise = this.performMetadataExtractionConcurrently();

await Promise.all([scanPromise, hashingPromise, metadataPromise]);
```

## Adding New Features

### Adding a New Metadata Type

1. Update the File entity:
```typescript
// src/database/entities/File.ts
@Column({ type: 'text', nullable: true })
newMetadataField?: string;
```

2. Extend MetadataExtractor:
```typescript
// src/services/MetadataExtractor.ts
private async extractNewMetadata(file: File): Promise<void> {
  // Your extraction logic
  file.newMetadataField = extractedValue;
}
```

3. Update UI to display new data

### Adding a New File Scanner

1. Create a new service:
```typescript
// src/services/CustomScanner.ts
export class CustomScanner {
  async scan(filePath: string): Promise<CustomData> {
    // Your scanning logic
  }
}
```

2. Integrate with FileScanner:
```typescript
// Add to scanning pipeline
private customScanner = new CustomScanner();
```

### Adding UI Components

1. Create component in `src/renderer/components/`
2. Use Material-UI components for consistency:
```tsx
import { Box, Typography, Button } from '@mui/material';

export const MyComponent: React.FC = () => {
  return (
    <Box>
      <Typography>My Component</Typography>
    </Box>
  );
};
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test
```

Write tests for services:
```typescript
// tests/FileScanner.test.ts
describe('FileScanner', () => {
  it('should detect duplicates', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test database operations:
```typescript
// tests/integration/database.test.ts
describe('Database Operations', () => {
  beforeEach(async () => {
    // Setup test database
  });

  it('should save file metadata', async () => {
    // Test implementation
  });
});
```

## Performance Considerations

### Memory Management

- Use streams for file operations
- Batch database operations
- Clear unused objects from memory

### Optimization Tips

1. **Batch Processing**: Process files in batches of 10-20
2. **Lazy Loading**: Load data on-demand in UI
3. **Index Usage**: Ensure database queries use indexes
4. **Concurrent Limits**: Limit concurrent operations

## Debugging

### Main Process Debugging

1. Launch with inspect flag:
```bash
electron --inspect=5858 .
```

2. Open Chrome DevTools:
```
chrome://inspect
```

### Renderer Process Debugging

Use Chrome DevTools in Electron window (Ctrl+Shift+I)

### Common Issues

#### Database Lock Errors
- Ensure only one instance is running
- Check for proper transaction handling

#### Memory Leaks
- Monitor with Chrome DevTools
- Check event listener cleanup

#### Performance Issues
- Profile with Chrome DevTools
- Check database query performance

## Building and Packaging

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run dist
```

### Platform-Specific Builds

Windows:
```bash
npm run dist:win
```

macOS:
```bash
npm run dist:mac
```

Linux:
```bash
npm run dist:linux
```

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting

### Commit Messages

Follow conventional commits:
```
feat: add perceptual hashing for images
fix: resolve memory leak in scanner
docs: update architecture documentation
```

### Pull Request Process

1. Create feature branch
2. Write tests for new features
3. Update documentation
4. Submit PR with description

## API Reference

### Main Process API

#### FileScanner
```typescript
class FileScanner {
  startScan(paths: string[]): Promise<void>
  pauseScan(): void
  resumeScan(): void
  stopScan(): void
  getProgress(): ScanProgress
}
```

#### MetadataExtractor
```typescript
class MetadataExtractor {
  extractMetadata(file: File): Promise<void>
  isMediaFile(filePath: string): boolean
}
```

### IPC Channels

Available IPC channels:

- `scan:start` - Start scanning
- `scan:pause` - Pause current scan
- `scan:resume` - Resume paused scan
- `scan:stop` - Stop and clear scan
- `scan:progress` - Get progress updates
- `duplicates:get` - Fetch duplicate groups
- `duplicates:delete` - Delete file
- `paths:add` - Add scan path
- `paths:remove` - Remove scan path

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeORM Documentation](https://typeorm.io)
- [Material-UI Documentation](https://mui.com)

## License

ISC License - See LICENSE file for details