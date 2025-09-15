import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  FileCopy as FileCopyIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';

interface Statistics {
  totalFiles: number;
  totalDuplicates: number;
  totalWastedSpace: number;
  duplicatesByType: { [key: string]: number };
}

interface Props {
  refreshTrigger: number;
}

const Statistics: React.FC<Props> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [refreshTrigger]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await (window as any).electronAPI.duplicates.getStatistics();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, icon, color = 'primary.main' }) => (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box sx={{ color, mr: 2 }}>{icon}</Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ color }}>
        {value}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Typography color="text.secondary" align="center">
        No statistics available. Run a scan first.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Scan Statistics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Files"
            value={stats.totalFiles.toLocaleString()}
            icon={<FolderIcon fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Duplicate Files"
            value={stats.totalDuplicates.toLocaleString()}
            icon={<FileCopyIcon fontSize="large" />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Wasted Space"
            value={formatFileSize(stats.totalWastedSpace)}
            icon={<StorageIcon fontSize="large" />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Space Savings"
            value={`${
              stats.totalFiles > 0
                ? ((stats.totalDuplicates / stats.totalFiles) * 100).toFixed(1)
                : 0
            }%`}
            icon={<DeleteIcon fontSize="large" />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {Object.keys(stats.duplicatesByType).length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Duplicates by File Type
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {Object.entries(stats.duplicatesByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([type, count]) => (
                  <Grid item xs={6} sm={4} md={3} key={type}>
                    <Box
                      sx={{
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {type}
                      </Typography>
                      <Typography variant="h6">{count}</Typography>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Statistics;