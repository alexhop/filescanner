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
  mimeType?: string;

  @CreateDateColumn()
  dbCreatedAt!: Date;

  @UpdateDateColumn()
  dbUpdatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastScanned?: Date;
}