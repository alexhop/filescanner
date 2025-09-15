import { DataSource } from 'typeorm';
import { app } from 'electron';
import path from 'path';
import { File } from './entities/File';
import { ScanPath } from './entities/ScanPath';
import { ScanSession } from './entities/ScanSession';

let dataSource: DataSource | null = null;

export async function getDatabase(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const userDataPath = app ? app.getPath('userData') : '.';
  const dbPath = path.join(userDataPath, 'filescanner.db');

  dataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: [File, ScanPath, ScanSession],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}

export async function closeDatabase(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
  }
}