import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import 'reflect-metadata';
import { getDatabase, closeDatabase } from '../database/connection';
import { FileScanner } from '../services/FileScanner';
import { DuplicateService } from '../services/DuplicateService';
import { ScanPath } from '../database/entities/ScanPath';

let mainWindow: BrowserWindow | null = null;
let fileScanner: FileScanner | null = null;
let duplicateService: DuplicateService | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Add Scan Path',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:add-path');
          }
        },
        {
          label: 'Start Scan',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:start-scan');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About FileScanner',
              message: 'FileScanner v1.0.0',
              detail: 'A cross-platform duplicate file detection and management tool.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function initializeServices() {
  try {
    const dataSource = await getDatabase();
    fileScanner = new FileScanner(dataSource);
    duplicateService = new DuplicateService(dataSource);

    fileScanner.on('scan:progress', (progress) => {
      mainWindow?.webContents.send('scan:progress', progress);
    });

    fileScanner.on('scan:completed', (progress) => {
      mainWindow?.webContents.send('scan:completed', progress);
    });

    fileScanner.on('scan:error', (error) => {
      mainWindow?.webContents.send('scan:error', error.message);
    });

    setupIpcHandlers();
  } catch (error) {
    console.error('Failed to initialize services:', error);
    dialog.showErrorBox('Initialization Error', 'Failed to initialize database and services');
    app.quit();
  }
}

function setupIpcHandlers() {
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('scanPath:add', async (event, pathStr: string) => {
    const dataSource = await getDatabase();
    const repo = dataSource.getRepository(ScanPath);

    const existing = await repo.findOne({ where: { path: pathStr } });
    if (existing) {
      throw new Error('Path already exists');
    }

    const scanPath = repo.create({
      path: pathStr,
      isActive: true,
      isRecursive: true,
      scanStatus: 'idle'
    });

    return await repo.save(scanPath);
  });

  ipcMain.handle('scanPath:getAll', async () => {
    const dataSource = await getDatabase();
    const repo = dataSource.getRepository(ScanPath);
    return await repo.find({ where: { isActive: true } });
  });

  ipcMain.handle('scanPath:remove', async (event, id: number) => {
    const dataSource = await getDatabase();
    const repo = dataSource.getRepository(ScanPath);
    await repo.delete(id);
  });

  ipcMain.handle('scan:start', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');

    const dataSource = await getDatabase();
    const repo = dataSource.getRepository(ScanPath);
    const paths = await repo.find({ where: { isActive: true } });

    if (paths.length === 0) {
      throw new Error('No paths to scan');
    }

    const pathStrings = paths.map(p => p.path);
    await fileScanner.startScan(pathStrings);
  });

  ipcMain.handle('scan:pause', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');
    fileScanner.pauseScan();
  });

  ipcMain.handle('scan:resume', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');
    fileScanner.resumeScan();
  });

  ipcMain.handle('scan:stop', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');
    fileScanner.stopScan();
  });

  ipcMain.handle('scan:getProgress', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');
    return fileScanner.getProgress();
  });

  ipcMain.handle('scan:isScanning', async () => {
    if (!fileScanner) throw new Error('Scanner not initialized');
    return fileScanner.isCurrentlyScanning();
  });

  ipcMain.handle('duplicates:get', async (event, filter) => {
    if (!duplicateService) throw new Error('Duplicate service not initialized');
    return await duplicateService.getDuplicates(filter);
  });

  ipcMain.handle('duplicates:removeFile', async (event, fileId: number) => {
    if (!duplicateService) throw new Error('Duplicate service not initialized');
    await duplicateService.removeFile(fileId);
  });

  ipcMain.handle('duplicates:removeInPath', async (event, path: string, keepOldest: boolean) => {
    if (!duplicateService) throw new Error('Duplicate service not initialized');
    return await duplicateService.removeFilesInPath(path, keepOldest);
  });

  ipcMain.handle('duplicates:getStatistics', async () => {
    if (!duplicateService) throw new Error('Duplicate service not initialized');
    return await duplicateService.getStatistics();
  });
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (fileScanner?.isCurrentlyScanning()) {
    fileScanner.stopScan();
  }
  await closeDatabase();
});