import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scan_paths')
export class ScanPath {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  path!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isRecursive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastScanStarted?: Date;

  @Column({ type: 'datetime', nullable: true })
  lastScanCompleted?: Date;

  @Column({ type: 'text', nullable: true })
  scanStatus?: 'idle' | 'scanning' | 'completed' | 'error';

  @Column({ type: 'integer', default: 0 })
  filesFound!: number;

  @Column({ type: 'integer', default: 0 })
  foldersFound!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}