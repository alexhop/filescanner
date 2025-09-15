import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { File } from '../database/entities/File';
import { ScanPath } from '../database/entities/ScanPath';
import { ScanSession } from '../database/entities/ScanSession';
import { MetadataExtractor } from './MetadataExtractor';
import { FileSystemErrorHandler, DatabaseErrorHandler, ErrorRecovery } from '../utils/ErrorHandler';

export interface ScanProgress {
  filesScanned: number;
  foldersScanned: number;
  currentPath: string;
  filesHashed: number;
  duplicatesFound: number;
}

export class FileScanner extends EventEmitter {
  private dataSource: DataSource;
  private isScanning: boolean = false;
  private isPaused: boolean = false;
  private currentSession: ScanSession | null = null;
  private scanQueue: string[] = [];
  private hashQueue: File[] = [];
  private metadataQueue: File[] = [];
  private metadataExtractor: MetadataExtractor;
  private scanningComplete: boolean = false; // Add flag to track when scanning is done
  private progress: ScanProgress = {
    filesScanned: 0,
    foldersScanned: 0,
    currentPath: '',
    filesHashed: 0,
    duplicatesFound: 0
  };

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
    this.metadataExtractor = new MetadataExtractor();
  }

  async startScan(paths: string[]): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    this.isPaused = false;
    this.scanningComplete = false; // Reset flag
    this.scanQueue = [...paths];
    this.hashQueue = [];
    this.progress = {
      filesScanned: 0,
      foldersScanned: 0,
      currentPath: '',
      filesHashed: 0,
      duplicatesFound: 0
    };

    const sessionRepo = this.dataSource.getRepository(ScanSession);
    this.currentSession = await sessionRepo.save({
      startTime: new Date(),
      status: 'running',
      filesScanned: 0,
      filesHashed: 0,
      duplicatesFound: 0
    });

    this.emit('scan:started', this.progress);

    try {
      // Start concurrent scanning phases
      const scanPromise = this.performScan();
      const hashingPromise = this.performHashingConcurrently();
      const metadataPromise = this.performMetadataExtractionConcurrently();

      // Wait for all phases to complete
      await Promise.all([scanPromise, hashingPromise, metadataPromise]);
      await this.findDuplicates();

      this.currentSession.status = 'completed';
      this.currentSession.endTime = new Date();
      await sessionRepo.save(this.currentSession);

      this.emit('scan:completed', this.progress);
    } catch (error) {
      this.currentSession.status = 'error';
      this.currentSession.errorMessage = (error as Error).message;
      await sessionRepo.save(this.currentSession);

      this.emit('scan:error', error);
      throw error;
    } finally {
      this.isScanning = false;
      this.currentSession = null;
    }
  }

  private async performScan(): Promise<void> {
    const fileRepo = this.dataSource.getRepository(File);
    const scanPathRepo = this.dataSource.getRepository(ScanPath);

    while (this.scanQueue.length > 0 && !this.isPaused) {
      const scanPath = this.scanQueue.shift()!;
      this.progress.currentPath = scanPath;
      this.emit('scan:progress', this.progress);

      try {
        await this.scanDirectory(scanPath, fileRepo);

        const pathEntity = await scanPathRepo.findOne({ where: { path: scanPath } });
        if (pathEntity) {
          pathEntity.lastScanCompleted = new Date();
          pathEntity.filesFound = this.progress.filesScanned;
          pathEntity.foldersFound = this.progress.foldersScanned;
          pathEntity.scanStatus = 'completed';
          await scanPathRepo.save(pathEntity);
        }
      } catch (error) {
        console.error(`Error scanning ${scanPath}:`, error);
      }
    }

    // Mark scanning as complete
    this.scanningComplete = true;
  }

  private async scanDirectory(dirPath: string, fileRepo: any): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.isPaused) break;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          this.progress.foldersScanned++;

          if (!this.shouldSkipDirectory(entry.name)) {
            await this.scanDirectory(fullPath, fileRepo);
          }
        } else if (entry.isFile()) {
          await this.processFile(fullPath, fileRepo);
          this.progress.filesScanned++;

          if (this.progress.filesScanned % 100 === 0) {
            this.emit('scan:progress', this.progress);

            if (this.currentSession) {
              this.currentSession.filesScanned = this.progress.filesScanned;
              this.currentSession.currentPath = fullPath;
              await this.dataSource.getRepository(ScanSession).save(this.currentSession);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      'dist',
      'build',
      'target',
      '.idea',
      '.vscode',
      '__pycache__',
      '.cache'
    ];

    return skipDirs.includes(name) || name.startsWith('.');
  }

  private async processFile(filePath: string, fileRepo: any): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      let existingFile = await fileRepo.findOne({ where: { filePath } });

      if (existingFile) {
        if (existingFile.modifiedDate.getTime() === stats.mtime.getTime() &&
            existingFile.size === stats.size.toString()) {
          return;
        }

        existingFile.modifiedDate = stats.mtime;
        existingFile.size = stats.size;
        existingFile.hashCalculated = false;
        existingFile.hash = undefined;
        existingFile.lastScanned = new Date();
        existingFile.isDeleted = false;

        await fileRepo.save(existingFile);
        this.hashQueue.push(existingFile);

        // Add to metadata queue if it's a media file
        if (this.metadataExtractor.isMediaFile(filePath)) {
          this.metadataQueue.push(existingFile);
        }
      } else {
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
        this.hashQueue.push(savedFile);

        // Add to metadata queue if it's a media file
        if (this.metadataExtractor.isMediaFile(filePath)) {
          this.metadataQueue.push(savedFile);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  private async performHashingConcurrently(): Promise<void> {
    const fileRepo = this.dataSource.getRepository(File);
    const batchSize = 10;

    // Continue processing until scanning is done AND queue is empty
    while (!this.scanningComplete || this.hashQueue.length > 0) {
      if (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      if (this.hashQueue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const batch = this.hashQueue.splice(0, batchSize);

      await Promise.all(batch.map(async (file) => {
        try {
          const hash = await this.calculateFileHash(file.filePath);
          file.hash = hash;
          file.hashCalculated = true;
          await fileRepo.save(file);

          this.progress.filesHashed++;

          if (this.progress.filesHashed % 10 === 0) {
            this.emit('scan:progress', this.progress);

            if (this.currentSession) {
              this.currentSession.filesHashed = this.progress.filesHashed;
              await this.dataSource.getRepository(ScanSession).save(this.currentSession);
            }
          }
        } catch (error) {
          console.error(`Error hashing file ${file.filePath}:`, error);
        }
      }));
    }
  }

  private async performMetadataExtractionConcurrently(): Promise<void> {
    const fileRepo = this.dataSource.getRepository(File);
    const batchSize = 5;

    // Continue processing until scanning is done AND queue is empty
    while (!this.scanningComplete || this.metadataQueue.length > 0) {
      if (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      if (this.metadataQueue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const batch = this.metadataQueue.splice(0, batchSize);

      await Promise.all(batch.map(async (file) => {
        try {
          await this.metadataExtractor.extractMetadata(file);
          await fileRepo.save(file);
        } catch (error) {
          console.error(`Error extracting metadata for ${file.filePath}:`, error);
        }
      }));
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

  private async findDuplicates(): Promise<void> {
    const fileRepo = this.dataSource.getRepository(File);

    const duplicates = await fileRepo
      .createQueryBuilder('file')
      .select('file.hash')
      .addSelect('COUNT(*)', 'count')
      .where('file.hash IS NOT NULL')
      .andWhere('file.isDeleted = :deleted', { deleted: false })
      .groupBy('file.hash')
      .having('COUNT(*) > 1')
      .getRawMany();

    this.progress.duplicatesFound = duplicates.length;

    if (this.currentSession) {
      this.currentSession.duplicatesFound = this.progress.duplicatesFound;
      await this.dataSource.getRepository(ScanSession).save(this.currentSession);
    }

    this.emit('scan:progress', this.progress);
  }

  pauseScan(): void {
    this.isPaused = true;
    this.emit('scan:paused');
  }

  resumeScan(): void {
    this.isPaused = false;
    this.emit('scan:resumed');
  }

  stopScan(): void {
    this.isPaused = true;
    this.isScanning = false;
    this.scanningComplete = true; // Mark as complete to stop concurrent operations
    this.scanQueue = [];
    this.hashQueue = [];
    this.emit('scan:stopped');
  }

  getProgress(): ScanProgress {
    return { ...this.progress };
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}