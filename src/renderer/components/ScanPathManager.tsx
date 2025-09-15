import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';

interface ScanPath {
  id: number;
  path: string;
  isActive: boolean;
  lastScanCompleted?: Date;
  filesFound: number;
  foldersFound: number;
}

interface Props {
  onStartScan: () => void;
  isScanning: boolean;
}

const ScanPathManager: React.FC<Props> = ({ onStartScan, isScanning }) => {
  const [paths, setPaths] = useState<ScanPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const loadedPaths = await (window as any).electronAPI.scanPath.getAll();
      setPaths(loadedPaths);
    } catch (err: any) {
      setError(err.message || 'Failed to load paths');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPath = async () => {
    try {
      const selectedPath = await (window as any).electronAPI.selectDirectory();
      if (selectedPath) {
        await (window as any).electronAPI.scanPath.add(selectedPath);
        await loadPaths();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add path');
    }
  };

  const handleRemovePath = async (id: number) => {
    try {
      await (window as any).electronAPI.scanPath.remove(id);
      await loadPaths();
    } catch (err: any) {
      setError(err.message || 'Failed to remove path');
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Scan Paths</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPath}
            disabled={isScanning}
            sx={{ mr: 1 }}
          >
            Add Path
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayIcon />}
            onClick={onStartScan}
            disabled={isScanning || paths.length === 0}
          >
            Start Scan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {paths.length === 0 ? (
        <Box textAlign="center" py={4}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            No paths added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Add Path" to select directories to scan for duplicates
          </Typography>
        </Box>
      ) : (
        <List>
          {paths.map((path, index) => (
            <React.Fragment key={path.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={path.path}
                  secondary={
                    <>
                      Files: {path.filesFound} | Folders: {path.foldersFound}
                      <br />
                      Last scan: {formatDate(path.lastScanCompleted)}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemovePath(path.id)}
                    disabled={isScanning}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ScanPathManager;