import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { File } from '../database/entities/File';
import { MetadataExtractor } from './MetadataExtractor';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface WatcherEvents {
  'file:added': (filePath: string) => void;
  'file:changed': (filePath: string) => void;
  'file:deleted': (filePath: string) => void;
  'watcher:ready': () => void;
  'watcher:error': (error: Error) => void;
}

export class FileWatcher extends EventEmitter {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private dataSource: DataSource;
  private metadataExtractor: MetadataExtractor;
  private isWatching: boolean = false;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
    this.metadataExtractor = new MetadataExtractor();
  }

  async startWatching(paths: string[]): Promise<void> {
    if (this.isWatching) {
      console.log('File watcher is already running');
      return;
    }

    this.isWatching = true;

    for (const watchPath of paths) {
      if (this.watchers.has(watchPath)) {
        continue;
      }

      const watcher = chokidar.watch(watchPath, {
        persistent: true,
        ignoreInitial: true,
        followSymlinks: false,
        depth: undefined,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        },
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/build/**',
          '**/.cache/**',
          '**/__pycache__/**'
        ]
      });

      watcher
        .on('add', (filePath: string) => this.handleFileAdded(filePath))
        .on('change', (filePath: string) => this.handleFileChanged(filePath))
        .on('unlink', (filePath: string) => this.handleFileDeleted(filePath))
        .on('ready', () => {
          console.log(`Watcher ready for path: ${watchPath}`);
          this.emit('watcher:ready');
        })
        .on('error', (error: unknown) => {
          console.error(`Watcher error for ${watchPath}:`, error);
          this.emit('watcher:error', error as Error);
        });

      this.watchers.set(watchPath, watcher);
    }
  }

  async stopWatching(path?: string): Promise<void> {
    if (path) {
      // Stop watching specific path
      const watcher = this.watchers.get(path);
      if (watcher) {
        await watcher.close();
        this.watchers.delete(path);
        console.log(`Stopped watching: ${path}`);
      }
    } else {
      // Stop all watchers
      for (const [watchPath, watcher] of this.watchers) {
        await watcher.close();
        console.log(`Stopped watching: ${watchPath}`);
      }
      this.watchers.clear();
      this.isWatching = false;
    }
  }

  private async handleFileAdded(filePath: string): Promise<void> {
    try {
      console.log(`File added: ${filePath}`);
      this.emit('file:added', filePath);

      const fileRepo = this.dataSource.getRepository(File);
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      // Check if file already exists in database
      const existingFile = await fileRepo.findOne({ where: { filePath } });
      if (existingFile) {
        return;
      }

      // Create new file entry
      const newFile = fileRepo.create({
        filePath,
        fileName,
        fileExtension,
        size: stats.size,
        createdDate: stats.birthtime,
        modifiedDate: stats.mtime,
        hashCalculated: false,
        lastScanned: new Date(),
        isDeleted: false
      });

      const savedFile = await fileRepo.save(newFile);

      // Calculate hash in background
      this.calculateHashInBackground(savedFile);

      // Extract metadata if it's a media file
      if (this.metadataExtractor.isMediaFile(filePath)) {
        this.extractMetadataInBackground(savedFile);
      }
    } catch (error) {
      console.error(`Error handling added file ${filePath}:`, error);
    }
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    try {
      console.log(`File changed: ${filePath}`);
      this.emit('file:changed', filePath);

      const fileRepo = this.dataSource.getRepository(File);
      const stats = await fs.promises.stat(filePath);

      const existingFile = await fileRepo.findOne({ where: { filePath } });
      if (!existingFile) {
        // File not in database, treat as new file
        await this.handleFileAdded(filePath);
        return;
      }

      // Update file information
      existingFile.modifiedDate = stats.mtime;
      existingFile.size = stats.size;
      existingFile.hashCalculated = false;
      existingFile.hash = undefined;
      existingFile.lastScanned = new Date();

      await fileRepo.save(existingFile);

      // Recalculate hash in background
      this.calculateHashInBackground(existingFile);

      // Re-extract metadata if it's a media file
      if (this.metadataExtractor.isMediaFile(filePath)) {
        this.extractMetadataInBackground(existingFile);
      }
    } catch (error) {
      console.error(`Error handling changed file ${filePath}:`, error);
    }
  }

  private async handleFileDeleted(filePath: string): Promise<void> {
    try {
      console.log(`File deleted: ${filePath}`);
      this.emit('file:deleted', filePath);

      const fileRepo = this.dataSource.getRepository(File);
      const existingFile = await fileRepo.findOne({ where: { filePath } });

      if (existingFile) {
        // Mark as deleted instead of removing from database
        existingFile.isDeleted = true;
        await fileRepo.save(existingFile);
      }
    } catch (error) {
      console.error(`Error handling deleted file ${filePath}:`, error);
    }
  }

  private async calculateHashInBackground(file: File): Promise<void> {
    try {
      const hash = await this.calculateFileHash(file.filePath);
      const fileRepo = this.dataSource.getRepository(File);

      file.hash = hash;
      file.hashCalculated = true;
      await fileRepo.save(file);
    } catch (error) {
      console.error(`Error calculating hash for ${file.filePath}:`, error);
    }
  }

  private async extractMetadataInBackground(file: File): Promise<void> {
    try {
      await this.metadataExtractor.extractMetadata(file);
      const fileRepo = this.dataSource.getRepository(File);
      await fileRepo.save(file);
    } catch (error) {
      console.error(`Error extracting metadata for ${file.filePath}:`, error);
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }

  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }
}