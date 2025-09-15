import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorInfo {
  message: string;
  severity: ErrorSeverity;
  context?: any;
  stack?: string;
  timestamp: Date;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private logFilePath: string;
  private maxLogSize: number = 100;

  private constructor() {
    const userDataPath = app.getPath('userData');
    this.logFilePath = path.join(userDataPath, 'error.log');
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: any): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      severity,
      context,
      stack: error.stack,
      timestamp: new Date()
    };

    // Add to memory log
    this.errorLog.push(errorInfo);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console
    console.error(`[${severity.toUpperCase()}] ${error.message}`, context);
    if (error.stack) {
      console.error(error.stack);
    }

    // Write to file
    this.writeToFile(errorInfo);

    // Show dialog for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.showErrorDialog(error.message);
    }
  }

  handleWarning(message: string, context?: any): void {
    const errorInfo: ErrorInfo = {
      message,
      severity: ErrorSeverity.LOW,
      context,
      timestamp: new Date()
    };

    console.warn(message, context);
    this.writeToFile(errorInfo);
  }

  private writeToFile(errorInfo: ErrorInfo): void {
    try {
      const logEntry = `[${errorInfo.timestamp.toISOString()}] [${errorInfo.severity}] ${errorInfo.message}\n`;
      fs.appendFileSync(this.logFilePath, logEntry);
    } catch (err) {
      console.error('Failed to write to error log:', err);
    }
  }

  private showErrorDialog(message: string): void {
    dialog.showErrorBox('FileScanner Error', message);
  }

  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errorLog.slice(-count);
  }

  clearErrorLog(): void {
    this.errorLog = [];
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (err) {
      console.error('Failed to clear error log:', err);
    }
  }
}

// Error recovery strategies
export class ErrorRecovery {
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError;
  }

  static async gracefulShutdown(cleanup: () => Promise<void>): Promise<void> {
    console.log('Performing graceful shutdown...');
    try {
      await cleanup();
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Database-specific error handling
export class DatabaseErrorHandler {
  static handleDatabaseError(error: any): void {
    const errorHandler = ErrorHandler.getInstance();

    if (error.code === 'SQLITE_BUSY') {
      errorHandler.handleError(
        new Error('Database is locked. Please wait and try again.'),
        ErrorSeverity.MEDIUM,
        { originalError: error }
      );
    } else if (error.code === 'SQLITE_CORRUPT') {
      errorHandler.handleError(
        new Error('Database corruption detected. Please restart the application.'),
        ErrorSeverity.CRITICAL,
        { originalError: error }
      );
    } else if (error.code === 'SQLITE_FULL') {
      errorHandler.handleError(
        new Error('Disk is full. Please free up space and try again.'),
        ErrorSeverity.HIGH,
        { originalError: error }
      );
    } else {
      errorHandler.handleError(
        error,
        ErrorSeverity.MEDIUM,
        { type: 'database' }
      );
    }
  }
}

// File system-specific error handling
export class FileSystemErrorHandler {
  static handleFileError(error: any, filePath: string): void {
    const errorHandler = ErrorHandler.getInstance();

    if (error.code === 'ENOENT') {
      errorHandler.handleWarning(
        `File not found: ${filePath}`,
        { error }
      );
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorHandler.handleError(
        new Error(`Permission denied: ${filePath}`),
        ErrorSeverity.MEDIUM,
        { originalError: error }
      );
    } else if (error.code === 'EMFILE') {
      errorHandler.handleError(
        new Error('Too many open files. Some operations may fail.'),
        ErrorSeverity.HIGH,
        { originalError: error }
      );
    } else {
      errorHandler.handleError(
        error,
        ErrorSeverity.LOW,
        { filePath }
      );
    }
  }
}