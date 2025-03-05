// frontend/src/components/JobListings.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Link,
  Chip,
  Stack,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import { 
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as SalaryIcon,
  Business as CompanyIcon
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

const JobListings = ({ jobs = [], onSearch, onApplicationSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Applied');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Show application dialog when user returns to window
  useEffect(() => {
    const handleWindowFocus = () => {
      const lastClickedJob = localStorage.getItem('lastClickedJob');
      if (lastClickedJob) {
        try {
          const job = JSON.parse(lastClickedJob);
          setSelectedJob(job);
          setDialogOpen(true);
          // Clear localStorage after operation is complete
          localStorage.removeItem('lastClickedJob');
        } catch (error) {
          console.error('Error getting last clicked job:', error);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleApply = async (job) => {
    try {
      if (!job.url) {
        setSnackbar({
          open: true,
          message: 'Application link not found!',
          severity: 'error'
        });
        return;
      }

      // Prepare URL in proper format
      let applicationUrl = job.url;
      
      // Check if URL is valid
      try {
        // Format URL correctly
        if (!applicationUrl.startsWith('http://') && !applicationUrl.startsWith('https://')) {
          applicationUrl = 'https://' + applicationUrl;
        }
        
        // Validate URL
        new URL(applicationUrl);
      } catch (urlError) {
        console.error('Invalid URL:', urlError);
        setSnackbar({
          open: true,
          message: 'Invalid application link!',
          severity: 'error'
        });
        return;
      }

      console.log('URL to open:', applicationUrl);
      
      // Track job listing click
      try {
        await api.post('/jobs/trackClick', {
          jobId: job.id,
          jobTitle: job.title,
          jobCompany: job.company,
          jobUrl: applicationUrl
        });
        console.log('Job click tracked successfully');
      } catch (trackError) {
        console.error('Error tracking job click:', trackError);
      }
      
      // Save last clicked job to localStorage
      localStorage.setItem('lastClickedJob', JSON.stringify(job));
      
      // Open application link in new tab
      window.open(applicationUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error during application:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred during application.',
        severity: 'error'
      });
    }
  };

  const handleSubmitApplication = async () => {
    try {
      if (!selectedJob?.id) {
        setSnackbar({
          open: true,
          message: 'Job listing information missing!',
          severity: 'error'
        });
        return;
      }
      
      // Update job application status
      const updateResponse = await api.put('/jobs/updateStatus', {
        jobId: selectedJob.id,
        status,
        notes
      });
      
      console.log('Status update response:', updateResponse.data);
      
      // Prepare application data (for old applications API)
      const applicationData = {
        job: {
          title: selectedJob?.title || 'Title Not Specified',
          company: selectedJob?.company || 'Company Not Specified',
          location: selectedJob?.location || 'Location Not Specified',
          description: selectedJob?.description || '',
          salary: selectedJob?.salary || '',
          employmentType: selectedJob?.employmentType || '',
          applicationUrl: selectedJob?.url || ''
        },
        status,
        notes: notes ? [{ content: notes }] : []
      };

      console.log('Application data to send:', applicationData);

      // Call old API too (for backward compatibility)
      try {
        const response = await api.post('/applications', applicationData);
        console.log('Applications API response:', response.data);
        
        // Call callback function if exists
        if (onApplicationSubmit) {
          onApplicationSubmit(response.data);
        }
      } catch (appError) {
        console.error('Applications API error (not critical):', appError);
      }
      
      // Show success notification
      setSnackbar({
        open: true,
        message: 'Application status updated successfully!',
        severity: 'success'
      });

      // Close dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving application:', error);
      
      // Show error message
      setSnackbar({
        open: true,
        message: 'An error occurred while saving application: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedJob(null);
    setNotes('');
    setStatus('Applied');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      await onSearch(searchQuery);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error during job search.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search job position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
      </Box>

      {!jobs || jobs.length === 0 ? (
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" align="center">
            No job listings found yet. Please try different search criteria.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Found Job Listings ({jobs.length})
          </Typography>
          
          <Grid container spacing={3}>
            {jobs.map((job, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ 
                  p: 2, 
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.light' }}>
                      {job.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CompanyIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle1" color="text.secondary">
                          {job.company}
                        </Typography>
                      </Stack>
                      
                      {job.location && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1" color="text.secondary">
                            {job.location}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      {job.employmentType && (
                        <Chip 
                          icon={<WorkIcon />} 
                          label={job.employmentType} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                      {job.salary && (
                        <Chip 
                          icon={<SalaryIcon />} 
                          label={job.salary || 'Not Specified'} 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body1" color="text.secondary" sx={{ 
                      mb: 2,
                      maxHeight: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {job.description}
                    </Typography>

                    {job.highlights && (
                      <Box sx={{ mt: 2 }}>
                        {job.highlights.qualifications?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Qualifications:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                              {job.highlights.qualifications.slice(0, 3).map((qual, i) => (
                                <li key={i}>
                                  <Typography variant="body2" color="text.secondary">
                                    {qual}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Button 
                      variant="contained"
                      onClick={() => handleApply(job)}
                      color="primary"
                      disabled={!job.url}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {job.url ? 'Apply' : 'No Application Link'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Application Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Track Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
              Have you applied for the {selectedJob?.title} position? Would you like to track your application in your profile?
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>Position:</strong> {selectedJob?.title}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Company:</strong> {selectedJob?.company}
            </Typography>
            
            <TextField
              select
              fullWidth
              label="Application Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              label="Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              placeholder="Add notes about your application..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitApplication} 
            variant="contained" 
            color="primary"
          >
            Save Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default JobListings;
