import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

interface DuplicateFile {
  id: number;
  filePath: string;
  fileName: string;
  fileExtension?: string;
  size: number;
  createdDate: Date;
  modifiedDate: Date;
  hash: string;
}

interface DuplicateGroup {
  hash: string;
  files: DuplicateFile[];
  totalSize: number;
  wastedSpace: number;
}

interface Props {
  refreshTrigger: number;
}

const DuplicatesList: React.FC<Props> = ({ refreshTrigger }) => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [filteredDuplicates, setFilteredDuplicates] = useState<DuplicateGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file?: DuplicateFile }>({
    open: false
  });

  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('wastedSpace');
  const [searchPath, setSearchPath] = useState<string>('');

  useEffect(() => {
    loadDuplicates();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [duplicates, filterType, sortBy, searchPath]);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      const filter: any = {};

      const data = await (window as any).electronAPI.duplicates.get(filter);
      setDuplicates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...duplicates];

    if (filterType !== 'all') {
      const typeMap: { [key: string]: string[] } = {
        image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
        video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
        document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
        code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h'],
        pst: ['.pst'],
        exe: ['.exe', '.msi', '.app', '.dmg']
      };

      const extensions = typeMap[filterType];
      if (extensions) {
        filtered = filtered.filter(group =>
          group.files.some(file =>
            extensions.includes(file.fileExtension?.toLowerCase() || '')
          )
        );
      }
    }

    if (searchPath) {
      filtered = filtered.filter(group =>
        group.files.some(file =>
          file.filePath.toLowerCase().includes(searchPath.toLowerCase())
        )
      );
    }

    switch (sortBy) {
      case 'wastedSpace':
        filtered.sort((a, b) => b.wastedSpace - a.wastedSpace);
        break;
      case 'fileSize':
        filtered.sort((a, b) => b.totalSize - a.totalSize);
        break;
      case 'fileName':
        filtered.sort((a, b) =>
          a.files[0].fileName.localeCompare(b.files[0].fileName)
        );
        break;
    }

    setFilteredDuplicates(filtered);
  };

  const toggleGroup = (hash: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(hash)) {
      newExpanded.delete(hash);
    } else {
      newExpanded.add(hash);
    }
    setExpandedGroups(newExpanded);
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

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const handleDeleteFile = async (file: DuplicateFile) => {
    setDeleteDialog({ open: true, file });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.file) return;

    try {
      await (window as any).electronAPI.duplicates.removeFile(deleteDialog.file.id);
      await loadDuplicates();
      setDeleteDialog({ open: false });
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>File Type</InputLabel>
              <Select
                value={filterType}
                label="File Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="document">Documents</MenuItem>
                <MenuItem value="code">Source Code</MenuItem>
                <MenuItem value="pst">PST Files</MenuItem>
                <MenuItem value="exe">Executables</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="wastedSpace">Wasted Space</MenuItem>
                <MenuItem value="fileSize">File Size</MenuItem>
                <MenuItem value="fileName">File Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Search Path"
              value={searchPath}
              onChange={(e) => setSearchPath(e.target.value)}
              placeholder="Filter by path..."
            />
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredDuplicates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No duplicates found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {duplicates.length === 0
              ? 'Run a scan to detect duplicate files'
              : 'No duplicates match the current filter'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Found {filteredDuplicates.length} duplicate groups with{' '}
            {formatFileSize(
              filteredDuplicates.reduce((sum, g) => sum + g.wastedSpace, 0)
            )}{' '}
            of wasted space
          </Typography>

          <List>
            {filteredDuplicates.map((group) => (
              <Paper key={group.hash} sx={{ mb: 1 }}>
                <ListItem
                  onClick={() => toggleGroup(group.hash)}
                  sx={{ bgcolor: 'grey.50', cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {group.files[0].fileName}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${group.files.length} copies`}
                          color="error"
                        />
                        <Chip
                          size="small"
                          label={formatFileSize(group.totalSize)}
                          color="primary"
                        />
                        <Chip
                          size="small"
                          label={`${formatFileSize(group.wastedSpace)} wasted`}
                          color="warning"
                        />
                      </Box>
                    }
                    secondary={`Hash: ${group.hash.substring(0, 16)}...`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      {expandedGroups.has(group.hash) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>

                <Collapse in={expandedGroups.has(group.hash)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.files.map((file, index) => (
                      <ListItem key={file.id} sx={{ pl: 4 }}>
                        <ListItemText
                          primary={file.filePath}
                          secondary={
                            <>
                              Created: {formatDate(file.createdDate)} | Modified:{' '}
                              {formatDate(file.modifiedDate)}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          {index > 0 && (
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Paper>
            ))}
          </List>
        </>
      )}

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this file?
            <br />
            <br />
            <strong>{deleteDialog.file?.filePath}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuplicatesList;