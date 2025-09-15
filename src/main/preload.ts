import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  scanPath: {
    add: (path: string) => ipcRenderer.invoke('scanPath:add', path),
    getAll: () => ipcRenderer.invoke('scanPath:getAll'),
    remove: (id: number) => ipcRenderer.invoke('scanPath:remove', id)
  },

  scan: {
    start: () => ipcRenderer.invoke('scan:start'),
    pause: () => ipcRenderer.invoke('scan:pause'),
    resume: () => ipcRenderer.invoke('scan:resume'),
    stop: () => ipcRenderer.invoke('scan:stop'),
    getProgress: () => ipcRenderer.invoke('scan:getProgress'),
    isScanning: () => ipcRenderer.invoke('scan:isScanning'),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('scan:progress', (event, progress) => callback(progress));
    },
    onCompleted: (callback: (progress: any) => void) => {
      ipcRenderer.on('scan:completed', (event, progress) => callback(progress));
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('scan:error', (event, error) => callback(error));
    }
  },

  duplicates: {
    get: (filter?: any) => ipcRenderer.invoke('duplicates:get', filter),
    removeFile: (fileId: number) => ipcRenderer.invoke('duplicates:removeFile', fileId),
    removeInPath: (path: string, keepOldest: boolean) =>
      ipcRenderer.invoke('duplicates:removeInPath', path, keepOldest),
    getStatistics: () => ipcRenderer.invoke('duplicates:getStatistics')
  },

  menu: {
    onAddPath: (callback: () => void) => {
      ipcRenderer.on('menu:add-path', callback);
    },
    onStartScan: (callback: () => void) => {
      ipcRenderer.on('menu:start-scan', callback);
    }
  }
});