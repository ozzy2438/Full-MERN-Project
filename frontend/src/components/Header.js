// frontend/src/components/Header.js
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Logout as LogoutIcon,
  WorkHistory as WorkHistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApplicationTracker from './ApplicationTracker';
import CalendarView from './CalendarView';

const Header = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenJobTrack = () => {
    setTrackDialogOpen(true);
  };

  const handleCloseJobTrack = () => {
    setTrackDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        p: 2,
        zIndex: 1000,
        display: 'flex',
        gap: 2,
        alignItems: 'center'
      }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenJobTrack}
        startIcon={<WorkHistoryIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 2,
          mr: 2
        }}
      >
        Job Track Progress
      </Button>
      
      <Stack direction="row" spacing={1}>
        <Tooltip title="GitHub">
          <IconButton
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'white' }}
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="LinkedIn">
          <IconButton
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'white' }}
          >
            <LinkedInIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Twitter">
          <IconButton
            href="https://twitter.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'white' }}
          >
            <TwitterIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Tooltip title="Logout">
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          Logout
        </Button>
      </Tooltip>

      {/* Job Track Progress Dialog */}
      <Dialog
        open={trackDialogOpen}
        onClose={handleCloseJobTrack}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Job Application Tracker
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="job tracking tabs">
              <Tab label="My Applications" />
              <Tab label="Calendar View" />
              <Tab label="Statistics" />
            </Tabs>
          </Box>
          
          {tabValue === 0 && (
            <Box sx={{ p: 1 }}>
              <ApplicationTracker userId={user?.id} />
            </Box>
          )}
          
          {tabValue === 1 && (
            <CalendarView userId={user?.id} />
          )}
          
          {tabValue === 2 && (
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom>Application Statistics</Typography>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography>
                  Statistics view will be implemented in the next update. This view will show metrics
                  about your job applications, response rates, and more.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Header;
