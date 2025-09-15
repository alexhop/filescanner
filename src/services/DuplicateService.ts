import { DataSource } from 'typeorm';
import { File } from '../database/entities/File';
import * as fs from 'fs';
import * as path from 'path';

export interface DuplicateGroup {
  hash: string;
  files: File[];
  totalSize: number;
  wastedSpace: number;
}

export interface DuplicateFilter {
  fileTypes?: string[];
  minSize?: number;
  maxSize?: number;
  paths?: string[];
}

export class DuplicateService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async getDuplicates(filter?: DuplicateFilter): Promise<DuplicateGroup[]> {
    const fileRepo = this.dataSource.getRepository(File);

    let query = fileRepo
      .createQueryBuilder('file')
      .where('file.hash IS NOT NULL')
      .andWhere('file.isDeleted = :deleted', { deleted: false });

    if (filter) {
      if (filter.fileTypes && filter.fileTypes.length > 0) {
        query = query.andWhere('file.fileExtension IN (:...types)', { types: filter.fileTypes });
      }

      if (filter.minSize !== undefined) {
        query = query.andWhere('file.size >= :minSize', { minSize: filter.minSize });
      }

      if (filter.maxSize !== undefined) {
        query = query.andWhere('file.size <= :maxSize', { maxSize: filter.maxSize });
      }

      if (filter.paths && filter.paths.length > 0) {
        const pathConditions = filter.paths.map((p, i) => `file.filePath LIKE :path${i}`).join(' OR ');
        const pathParams = filter.paths.reduce((acc, p, i) => {
          acc[`path${i}`] = `${p}%`;
          return acc;
        }, {} as any);
        query = query.andWhere(`(${pathConditions})`, pathParams);
      }
    }

    const files = await query.getMany();

    const groupsByHash = new Map<string, File[]>();
    for (const file of files) {
      if (file.hash) {
        if (!groupsByHash.has(file.hash)) {
          groupsByHash.set(file.hash, []);
        }
        groupsByHash.get(file.hash)!.push(file);
      }
    }

    const duplicateGroups: DuplicateGroup[] = [];
    for (const [hash, groupFiles] of groupsByHash) {
      if (groupFiles.length > 1) {
        const totalSize = Number(groupFiles[0].size);
        const wastedSpace = totalSize * (groupFiles.length - 1);

        duplicateGroups.push({
          hash,
          files: groupFiles,
          totalSize,
          wastedSpace
        });
      }
    }

    return duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace);
  }

  async removeFile(fileId: number): Promise<void> {
    const fileRepo = this.dataSource.getRepository(File);
    const file = await fileRepo.findOne({ where: { id: fileId } });

    if (!file) {
      throw new Error('File not found in database');
    }

    try {
      await fs.promises.unlink(file.filePath);

      file.isDeleted = true;
      await fileRepo.save(file);
    } catch (error) {
      console.error(`Error deleting file ${file.filePath}:`, error);
      throw error;
    }
  }

  async removeFilesInPath(targetPath: string, keepOldest: boolean = true): Promise<number> {
    const duplicates = await this.getDuplicates({ paths: [targetPath] });
    let removedCount = 0;

    for (const group of duplicates) {
      const filesInPath = group.files.filter(f => f.filePath.startsWith(targetPath));

      if (filesInPath.length === group.files.length) {
        const sortedFiles = [...group.files].sort((a, b) =>
          keepOldest
            ? a.createdDate.getTime() - b.createdDate.getTime()
            : b.createdDate.getTime() - a.createdDate.getTime()
        );

        for (let i = 1; i < sortedFiles.length; i++) {
          await this.removeFile(sortedFiles[i].id);
          removedCount++;
        }
      } else if (filesInPath.length > 0) {
        for (const file of filesInPath) {
          await this.removeFile(file.id);
          removedCount++;
        }
      }
    }

    return removedCount;
  }

  async getStatistics(): Promise<{
    totalFiles: number;
    totalDuplicates: number;
    totalWastedSpace: number;
    duplicatesByType: { [key: string]: number };
  }> {
    const fileRepo = this.dataSource.getRepository(File);

    const totalFiles = await fileRepo.count({ where: { isDeleted: false } });

    const duplicates = await this.getDuplicates();
    const totalDuplicates = duplicates.reduce((sum, group) => sum + group.files.length - 1, 0);
    const totalWastedSpace = duplicates.reduce((sum, group) => sum + group.wastedSpace, 0);

    const duplicatesByType: { [key: string]: number } = {};
    for (const group of duplicates) {
      for (const file of group.files.slice(1)) {
        const ext = file.fileExtension || 'no-extension';
        duplicatesByType[ext] = (duplicatesByType[ext] || 0) + 1;
      }
    }

    return {
      totalFiles,
      totalDuplicates,
      totalWastedSpace,
      duplicatesByType
    };
  }

  getFileTypeCategory(extension: string): string {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff'];
    const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.mpeg', '.mpg'];
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'];
    const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'];
    const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];

    const ext = extension.toLowerCase();

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (documentExts.includes(ext)) return 'document';
    if (codeExts.includes(ext)) return 'code';
    if (archiveExts.includes(ext)) return 'archive';
    if (ext === '.pst') return 'pst';
    if (ext === '.exe' || ext === '.msi' || ext === '.app' || ext === '.dmg') return 'executable';

    return 'other';
  }
}