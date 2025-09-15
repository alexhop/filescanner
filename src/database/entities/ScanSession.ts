import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('scan_sessions')
export class ScanSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'datetime' })
  startTime!: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime?: Date;

  @Column({ type: 'text' })
  status!: 'running' | 'completed' | 'paused' | 'error';

  @Column({ type: 'integer', default: 0 })
  filesScanned!: number;

  @Column({ type: 'integer', default: 0 })
  filesHashed!: number;

  @Column({ type: 'integer', default: 0 })
  duplicatesFound!: number;

  @Column({ type: 'text', nullable: true })
  currentPath?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;
}