// frontend/src/components/ApplicationTracker.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Collapse,
  Divider,
  Grid,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Notes as NotesIcon,
  Link as LinkIcon
} from '@mui/icons-material';

const APPLICATION_STATUSES = [
  'Applied',
  'Under Review',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Cancelled'
];

// English to Turkish status mapping for display purposes
const STATUS_DISPLAY_MAP = {
  'Applied': 'Applied',
  'Under Review': 'Under Review',
  'Interview': 'Interview',
  'Offer': 'Offer',
  'Accepted': 'Accepted',
  'Rejected': 'Rejected',
  'Cancelled': 'Cancelled'
};

const ApplicationTracker = ({ userId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastUpdated');

  const fetchApplications = async (effectiveUserId) => {
    try {
      setLoading(true);
      console.log(`Fetching applications for user: ${effectiveUserId}`);
      const res = await api.get(`/applications/${effectiveUserId}`);
      console.log('Applications fetched:', res.data);
      setApplications(res.data);
      setError(null);
    } catch (error) {
      console.error("Applications could not be loaded:", error);
      setError("An error occurred while loading applications.");
      
      // If we get an error, try to show some mock data for demonstration
      if (applications.length === 0) {
        console.log('Using mock application data for demonstration');
        setApplications([
          {
            _id: 'mock-app-1',
            job: {
              title: 'Software Engineer',
              company: 'Tech Company Inc.',
              location: 'Remote',
              applicationUrl: 'https://example.com/job/123'
            },
            status: 'Applied',
            appliedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            timeline: [
              {
                status: 'Applied',
                notes: 'Initial application submitted',
                date: new Date().toISOString()
              }
            ],
            notes: [
              {
                content: 'Excited about this opportunity!',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use a default user ID if none is provided
    const effectiveUserId = userId || 'demoUserId123';
    console.log('ApplicationTracker: Using userId:', effectiveUserId);
    
    fetchApplications(effectiveUserId);
    
    // Set up a timer to periodically refresh the applications
    const refreshInterval = setInterval(() => {
      console.log('ApplicationTracker: Refreshing applications...');
      fetchApplications(effectiveUserId);
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [userId]);

  const handleUpdateStatus = async () => {
    try {
      const response = await api.put(`/applications/${selectedApp._id}`, {
        status: newStatus,
        notes: [{ content: newNote }]
      });

      setApplications(apps => 
        apps.map(app => 
          app._id === response.data._id ? response.data : app
        )
      );

      handleCloseDialog();
    } catch (error) {
      console.error('Error updating application:', error);
      setError('An error occurred while updating the application.');
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await api.delete(`/applications/${appId}`);
        setApplications(apps => apps.filter(app => app._id !== appId));
      } catch (error) {
        console.error('Error deleting application:', error);
        setError('An error occurred while deleting the application.');
      }
    }
  };

  const handleOpenDialog = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setNewNote('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedApp(null);
    setNewStatus('');
    setNewNote('');
  };

  const handleExpandClick = (appId) => {
    setExpandedId(expandedId === appId ? null : appId);
  };

  const filteredApplications = applications
    .filter(app => statusFilter === 'all' || app.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'lastUpdated') {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          My Applications
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {APPLICATION_STATUSES.map(status => (
                <MenuItem key={status} value={status}>
                  {STATUS_DISPLAY_MAP[status] || status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="lastUpdated">Last Updated</MenuItem>
              <MenuItem value="appliedAt">Applied At</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {applications.length === 0 ? (
        <Alert severity="info">No applications have been applied for yet.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredApplications.map(app => (
            <Grid item xs={12} key={app._id}>
              <Card sx={{ 
                mb: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }
              }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {app.job?.title || 'No job title'}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {app.job?.company || 'No company information'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={STATUS_DISPLAY_MAP[app.status] || app.status}
                      color={
                        app.status === 'Accepted' ? 'success' :
                        app.status === 'Rejected' ? 'error' :
                        app.status === 'Interview' ? 'warning' : 'default'
                      }
                    />
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: {new Date(app.lastUpdated).toLocaleDateString()}
                    </Typography>
                  </Stack>

                  <IconButton
                    onClick={() => handleExpandClick(app._id)}
                    sx={{ 
                      transform: expandedId === app._id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: '0.3s'
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </CardContent>

                <Collapse in={expandedId === app._id}>
                  <CardContent>
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Application Timeline
                    </Typography>
                    
                    {app.timeline.map((event, index) => (
                      <Box key={index} sx={{ ml: 3, mb: 2, position: 'relative' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -8,
                            top: 10,
                            width: 2,
                            height: '100%',
                            bgcolor: 'primary.light',
                            display: index === app.timeline.length - 1 ? 'none' : 'block'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -12,
                            top: 8,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'primary.main'
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                          {event.status}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(event.date).toLocaleString()}
                        </Typography>
                        {event.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {event.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}

                    {app.notes.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                          <NotesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Notes
                        </Typography>
                        {app.notes.map((note, index) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Typography variant="body2">{note.content}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(note.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Collapse>

                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    startIcon={<LinkIcon />}
                    href={app.job?.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Application Link
                  </Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(app)}
                  >
                    Update
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDeleteApplication(app._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Application Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              margin="normal"
            >
              {APPLICATION_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {STATUS_DISPLAY_MAP[status] || status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="New Note"
              multiline
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationTracker;
