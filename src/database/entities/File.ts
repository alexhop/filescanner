import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('files')
@Index(['hash'])
@Index(['filePath'])
@Index(['modifiedDate', 'size'])
export class File {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  filePath!: string;

  @Column({ type: 'text' })
  fileName!: string;

  @Column({ type: 'text', nullable: true })
  fileExtension?: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ type: 'datetime' })
  createdDate!: Date;

  @Column({ type: 'datetime' })
  modifiedDate!: Date;

  @Column({ type: 'text', nullable: true })
  hash?: string;

  @Column({ type: 'boolean', default: false })
  hashCalculated!: boolean;

  @Column({ type: 'text', nullable: true })
  perceptualHash?: string;

  @Column({ type: 'text', nullable: true })
  mimeType?: string;

  @CreateDateColumn()
  dbCreatedAt!: Date;

  @UpdateDateColumn()
  dbUpdatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastScanned?: Date;

  // Media metadata (photos/videos)
  @Column({ type: 'datetime', nullable: true })
  mediaTakenDate?: Date;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({ type: 'text', nullable: true })
  cameraModel?: string;

  @Column({ type: 'integer', nullable: true })
  imageWidth?: number;

  @Column({ type: 'integer', nullable: true })
  imageHeight?: number;

  @Column({ type: 'integer', nullable: true })
  videoDuration?: number; // in seconds

  @Column({ type: 'text', nullable: true })
  videoCodec?: string;

  // Music metadata
  @Column({ type: 'text', nullable: true })
  artist?: string;

  @Column({ type: 'text', nullable: true })
  album?: string;

  @Column({ type: 'text', nullable: true })
  albumArtist?: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'integer', nullable: true })
  trackNumber?: number;

  @Column({ type: 'text', nullable: true })
  genre?: string;

  @Column({ type: 'integer', nullable: true })
  year?: number;

  @Column({ type: 'integer', nullable: true })
  bitrate?: number;

  @Column({ type: 'text', nullable: true })
  audioFormat?: string;
}