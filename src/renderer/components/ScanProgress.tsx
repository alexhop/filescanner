import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Grid,
  Button,
  Chip
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';

interface Props {
  progress: {
    filesScanned: number;
    foldersScanned: number;
    currentPath: string;
    filesHashed: number;
    duplicatesFound: number;
  };
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const ScanProgress: React.FC<Props> = ({ progress, onPause, onResume, onStop }) => {
  const [isPaused, setIsPaused] = React.useState(false);

  const handlePauseResume = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
    setIsPaused(!isPaused);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Scanning in Progress
      </Typography>

      <LinearProgress variant="indeterminate" sx={{ mb: 2 }} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2" color="text.secondary">
            Current Path:
          </Typography>
          <Typography variant="body1" noWrap title={progress.currentPath}>
            {progress.currentPath || 'Starting...'}
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip
            label={`Files: ${progress.filesScanned}`}
            color="primary"
            variant="outlined"
            sx={{ width: '100%' }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip
            label={`Folders: ${progress.foldersScanned}`}
            color="primary"
            variant="outlined"
            sx={{ width: '100%' }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip
            label={`Hashed: ${progress.filesHashed}`}
            color="secondary"
            variant="outlined"
            sx={{ width: '100%' }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip
            label={`Duplicates: ${progress.duplicatesFound}`}
            color="error"
            variant="outlined"
            sx={{ width: '100%' }}
          />
        </Grid>
      </Grid>

      <Box display="flex" gap={1}>
        <Button
          variant="outlined"
          startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<StopIcon />}
          onClick={onStop}
        >
          Stop
        </Button>
      </Box>
    </Box>
  );
};

export default ScanProgress;