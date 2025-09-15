import * as exifr from 'exifr';
import * as path from 'path';
import * as fs from 'fs';
import { hash as imghash } from 'imghash';
import { File } from '../database/entities/File';

export class MetadataExtractor {
  private static readonly IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.heic', '.heif'];
  private static readonly VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg'];
  private static readonly AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.wma', '.aac', '.opus', '.ape'];

  async extractMetadata(file: File): Promise<void> {
    const ext = file.fileExtension?.toLowerCase() || '';

    try {
      if (MetadataExtractor.IMAGE_EXTENSIONS.includes(ext)) {
        await this.extractImageMetadata(file);
      } else if (MetadataExtractor.VIDEO_EXTENSIONS.includes(ext)) {
        await this.extractVideoMetadata(file);
      } else if (MetadataExtractor.AUDIO_EXTENSIONS.includes(ext)) {
        await this.extractAudioMetadata(file);
      }
    } catch (error) {
      console.error(`Error extracting metadata for ${file.filePath}:`, error);
    }
  }

  private async extractImageMetadata(file: File): Promise<void> {
    try {
      const metadata = await exifr.parse(file.filePath, {
        gps: true,
        xmp: true,
        exif: true
      });

      if (metadata) {
        // Extract date taken
        if (metadata.DateTimeOriginal || metadata.CreateDate) {
          file.mediaTakenDate = metadata.DateTimeOriginal || metadata.CreateDate;
        }

        // Extract GPS coordinates
        if (metadata.latitude && metadata.longitude) {
          file.latitude = metadata.latitude;
          file.longitude = metadata.longitude;
        }

        // Extract camera information
        if (metadata.Make && metadata.Model) {
          file.cameraModel = `${metadata.Make} ${metadata.Model}`;
        } else if (metadata.Model) {
          file.cameraModel = metadata.Model;
        }

        // Extract dimensions
        if (metadata.ImageWidth) {
          file.imageWidth = metadata.ImageWidth;
        }
        if (metadata.ImageHeight) {
          file.imageHeight = metadata.ImageHeight;
        }
      }

      // Calculate perceptual hash for image similarity detection
      try {
        const hashData = await imghash(file.filePath, 16);
        file.perceptualHash = hashData;
      } catch (hashError) {
        console.error(`Error calculating perceptual hash for ${file.filePath}:`, hashError);
      }
    } catch (error) {
      console.error(`Error extracting EXIF data from ${file.filePath}:`, error);
    }
  }

  private async extractVideoMetadata(file: File): Promise<void> {
    try {
      // For basic video metadata, we'll use music-metadata which can handle some video formats
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(file.filePath);

      if (metadata.format) {
        // Extract duration
        if (metadata.format.duration) {
          file.videoDuration = Math.round(metadata.format.duration);
        }

        // Extract codec information
        if (metadata.format.codec) {
          file.videoCodec = metadata.format.codec;
        }
      }

      // For video dimensions, we might need additional libraries like fluent-ffmpeg
      // but that requires ffmpeg to be installed system-wide
    } catch (error) {
      console.error(`Error extracting video metadata from ${file.filePath}:`, error);
    }
  }

  private async extractAudioMetadata(file: File): Promise<void> {
    try {
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(file.filePath);

      if (metadata.common) {
        // Extract basic metadata
        file.title = metadata.common.title || undefined;
        file.artist = metadata.common.artist || undefined;
        file.album = metadata.common.album || undefined;
        file.albumArtist = metadata.common.albumartist || undefined;
        file.genre = metadata.common.genre?.join(', ') || undefined;
        file.year = metadata.common.year || undefined;

        // Extract track number
        if (metadata.common.track && metadata.common.track.no) {
          file.trackNumber = metadata.common.track.no;
        }
      }

      if (metadata.format) {
        // Extract format information
        file.audioFormat = metadata.format.codec || undefined;

        // Extract bitrate (convert to kbps)
        if (metadata.format.bitrate) {
          file.bitrate = Math.round(metadata.format.bitrate / 1000);
        }
      }
    } catch (error) {
      console.error(`Error extracting audio metadata from ${file.filePath}:`, error);
    }
  }

  isMediaFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return MetadataExtractor.IMAGE_EXTENSIONS.includes(ext) ||
           MetadataExtractor.VIDEO_EXTENSIONS.includes(ext) ||
           MetadataExtractor.AUDIO_EXTENSIONS.includes(ext);
  }
}