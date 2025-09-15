import { DataSource } from 'typeorm';
import { File } from '../database/entities/File';
import * as path from 'path';

export interface CleanupRecommendation {
  filePath: string;
  reason: string;
  confidence: number;
  category: 'duplicate' | 'old_backup' | 'temp_file' | 'large_media' | 'outdated' | 'cache';
  potentialSavings: number;
}

export interface AIProvider {
  analyzeFiles(files: File[]): Promise<CleanupRecommendation[]>;
  isAvailable(): Promise<boolean>;
}

// Ollama provider for local AI
export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyzeFiles(files: File[]): Promise<CleanupRecommendation[]> {
    try {
      const fileInfo = files.map(f => ({
        path: f.filePath,
        size: f.size,
        modified: f.modifiedDate,
        type: f.fileExtension
      }));

      const prompt = `Analyze these files and recommend which ones could be safely deleted to free up space.
      Consider duplicates, old backups, temporary files, and cache files.
      Files: ${JSON.stringify(fileInfo, null, 2)}

      Respond with a JSON array of recommendations with fields: filePath, reason, confidence (0-1), category.`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const recommendations = JSON.parse(data.response);

      return recommendations.map((rec: any) => ({
        ...rec,
        potentialSavings: files.find(f => f.filePath === rec.filePath)?.size || 0
      }));
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return [];
    }
  }
}

// Rule-based fallback provider (doesn't require AI)
export class RuleBasedProvider implements AIProvider {
  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async analyzeFiles(files: File[]): Promise<CleanupRecommendation[]> {
    const recommendations: CleanupRecommendation[] = [];

    for (const file of files) {
      const fileName = file.fileName.toLowerCase();
      const ext = file.fileExtension?.toLowerCase() || '';
      const ageInDays = (Date.now() - file.modifiedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Check for temporary files
      if (fileName.startsWith('~') || fileName.startsWith('tmp') ||
          fileName.endsWith('.tmp') || fileName.endsWith('.temp')) {
        recommendations.push({
          filePath: file.filePath,
          reason: 'Temporary file that can likely be deleted',
          confidence: 0.8,
          category: 'temp_file',
          potentialSavings: Number(file.size)
        });
      }

      // Check for old backup files
      if ((fileName.includes('backup') || fileName.includes('copy') ||
           fileName.includes('old')) && ageInDays > 90) {
        recommendations.push({
          filePath: file.filePath,
          reason: `Old backup file (${Math.round(ageInDays)} days old)`,
          confidence: 0.6,
          category: 'old_backup',
          potentialSavings: Number(file.size)
        });
      }

      // Check for cache files
      if (file.filePath.includes('cache') || file.filePath.includes('Cache') ||
          file.filePath.includes('temp') || file.filePath.includes('Temp')) {
        recommendations.push({
          filePath: file.filePath,
          reason: 'Cache or temporary directory file',
          confidence: 0.7,
          category: 'cache',
          potentialSavings: Number(file.size)
        });
      }

      // Check for large media files that might be duplicated
      if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext) &&
          Number(file.size) > 100 * 1024 * 1024) { // > 100MB
        recommendations.push({
          filePath: file.filePath,
          reason: `Large video file (${Math.round(Number(file.size) / (1024 * 1024))} MB)`,
          confidence: 0.5,
          category: 'large_media',
          potentialSavings: Number(file.size)
        });
      }

      // Check for outdated installers
      if (['.exe', '.msi', '.dmg', '.pkg'].includes(ext) &&
          fileName.includes('setup') || fileName.includes('install')) {
        if (ageInDays > 30) {
          recommendations.push({
            filePath: file.filePath,
            reason: `Old installer file (${Math.round(ageInDays)} days old)`,
            confidence: 0.7,
            category: 'outdated',
            potentialSavings: Number(file.size)
          });
        }
      }
    }

    // Sort by confidence and potential savings
    return recommendations.sort((a, b) => {
      const scoreA = a.confidence * (a.potentialSavings / (1024 * 1024));
      const scoreB = b.confidence * (b.potentialSavings / (1024 * 1024));
      return scoreB - scoreA;
    });
  }
}

export class AIRecommendationService {
  private dataSource: DataSource;
  private providers: AIProvider[];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.providers = [
      new OllamaProvider(), // Try Ollama first
      new RuleBasedProvider() // Fallback to rules
    ];
  }

  async getRecommendations(
    scanPaths?: string[],
    limit: number = 100
  ): Promise<CleanupRecommendation[]> {
    const fileRepo = this.dataSource.getRepository(File);

    // Build query
    let query = fileRepo.createQueryBuilder('file')
      .where('file.isDeleted = :deleted', { deleted: false });

    if (scanPaths && scanPaths.length > 0) {
      const pathConditions = scanPaths.map((p, i) =>
        `file.filePath LIKE :path${i}`
      ).join(' OR ');

      const params: any = {};
      scanPaths.forEach((p, i) => {
        params[`path${i}`] = `${p}%`;
      });

      query = query.andWhere(`(${pathConditions})`, params);
    }

    const files = await query.limit(limit).getMany();

    // Find available AI provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        console.log(`Using AI provider: ${provider.constructor.name}`);
        return await provider.analyzeFiles(files);
      }
    }

    console.log('No AI providers available');
    return [];
  }

  async analyzeDuplicates(): Promise<CleanupRecommendation[]> {
    const fileRepo = this.dataSource.getRepository(File);

    // Get duplicate groups
    const duplicates = await fileRepo
      .createQueryBuilder('file')
      .select('file.hash')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(file.size)', 'totalSize')
      .where('file.hash IS NOT NULL')
      .andWhere('file.isDeleted = :deleted', { deleted: false })
      .groupBy('file.hash')
      .having('COUNT(*) > 1')
      .getRawMany();

    const recommendations: CleanupRecommendation[] = [];

    for (const dup of duplicates) {
      const files = await fileRepo.find({
        where: { hash: dup.file_hash, isDeleted: false },
        order: { modifiedDate: 'ASC' } // Keep oldest
      });

      // Recommend deleting all but the oldest
      for (let i = 1; i < files.length; i++) {
        recommendations.push({
          filePath: files[i].filePath,
          reason: `Duplicate of ${files[0].filePath}`,
          confidence: 0.95,
          category: 'duplicate',
          potentialSavings: Number(files[i].size)
        });
      }
    }

    return recommendations;
  }

  async analyzeDirectory(dirPath: string): Promise<CleanupRecommendation[]> {
    const recommendations = await this.getRecommendations([dirPath]);
    const duplicates = await this.analyzeDuplicates();

    // Combine recommendations, removing duplicates
    const combined = [...recommendations];
    const paths = new Set(recommendations.map(r => r.filePath));

    for (const dup of duplicates) {
      if (dup.filePath.startsWith(dirPath) && !paths.has(dup.filePath)) {
        combined.push(dup);
      }
    }

    return combined;
  }

  calculateTotalSavings(recommendations: CleanupRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.potentialSavings, 0);
  }

  groupByCategory(recommendations: CleanupRecommendation[]): Map<string, CleanupRecommendation[]> {
    const grouped = new Map<string, CleanupRecommendation[]>();

    for (const rec of recommendations) {
      const category = rec.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(rec);
    }

    return grouped;
  }
}