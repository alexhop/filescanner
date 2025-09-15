import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Tab,
  Tabs,
  Alert,
  Snackbar
} from '@mui/material';
import ScanPathManager from './components/ScanPathManager';
import ScanProgress from './components/ScanProgress';
import DuplicatesList from './components/DuplicatesList';
import Statistics from './components/Statistics';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshDuplicates, setRefreshDuplicates] = useState(0);

  useEffect(() => {
    (window as any).electronAPI.scan.onProgress((progress: any) => {
      setScanProgress(progress);
      setIsScanning(true);
    });

    (window as any).electronAPI.scan.onCompleted((progress: any) => {
      setScanProgress(progress);
      setIsScanning(false);
      setRefreshDuplicates(prev => prev + 1);
    });

    (window as any).electronAPI.scan.onError((errorMsg: string) => {
      setError(errorMsg);
      setIsScanning(false);
    });

    (window as any).electronAPI.menu.onAddPath(() => {
      setActiveTab(0);
    });

    (window as any).electronAPI.menu.onStartScan(() => {
      handleStartScan();
    });

    checkScanningStatus();
  }, []);

  const checkScanningStatus = async () => {
    try {
      const scanning = await (window as any).electronAPI.scan.isScanning();
      setIsScanning(scanning);
      if (scanning) {
        const progress = await (window as any).electronAPI.scan.getProgress();
        setScanProgress(progress);
      }
    } catch (err) {
      console.error('Error checking scan status:', err);
    }
  };

  const handleStartScan = async () => {
    try {
      await (window as any).electronAPI.scan.start();
      setIsScanning(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start scan');
    }
  };

  const handlePauseScan = async () => {
    try {
      await (window as any).electronAPI.scan.pause();
    } catch (err: any) {
      setError(err.message || 'Failed to pause scan');
    }
  };

  const handleResumeScan = async () => {
    try {
      await (window as any).electronAPI.scan.resume();
    } catch (err: any) {
      setError(err.message || 'Failed to resume scan');
    }
  };

  const handleStopScan = async () => {
    try {
      await (window as any).electronAPI.scan.stop();
      setIsScanning(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stop scan');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              FileScanner - Duplicate File Detector
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ mt: 2 }}>
          {isScanning && scanProgress && (
            <Paper sx={{ mb: 2, p: 2 }}>
              <ScanProgress
                progress={scanProgress}
                onPause={handlePauseScan}
                onResume={handleResumeScan}
                onStop={handleStopScan}
              />
            </Paper>
          )}

          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Scan Paths" />
                <Tab label="Duplicates" />
                <Tab label="Statistics" />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <ScanPathManager
                onStartScan={handleStartScan}
                isScanning={isScanning}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <DuplicatesList refreshTrigger={refreshDuplicates} />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Statistics refreshTrigger={refreshDuplicates} />
            </TabPanel>
          </Paper>
        </Container>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;