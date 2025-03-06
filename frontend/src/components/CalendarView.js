// frontend/src/components/CalendarView.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Stack, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Tooltip,
  IconButton,
  Popover,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import api from '../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Status color mapping - Daha canlı ve kontrast renkler
const STATUS_COLORS = {
  'Applied': '#2196f3', // Daha parlak mavi
  'Under Review': '#ff9800', // Daha parlak turuncu
  'Interview': '#4caf50', // Daha parlak yeşil
  'Offer': '#9c27b0', // Daha parlak mor
  'Accepted': '#00c853', // Daha parlak yeşil
  'Rejected': '#f44336', // Daha parlak kırmızı
  'Cancelled': '#757575' // Daha koyu gri
};

// Function to render event content in the calendar
const renderEventContent = (eventInfo) => {
  const { event } = eventInfo;
  const status = event.extendedProps.status || 'Applied';
  const title = event.title || (event.extendedProps.job?.title || 'Job Application');
  const company = event.extendedProps.job?.company || '';
  
  return (
    <div className="event-content" style={{ width: '100%', maxWidth: '100%' }}>
      <Tooltip title={title} placement="top">
        <div style={{ 
          backgroundColor: STATUS_COLORS[status] || '#2196f3',
          color: 'white',
          padding: '2px 3px',
          borderRadius: '3px',
          fontSize: '0.7rem',
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          maxWidth: '100%'
        }}>
          {title}
        </div>
      </Tooltip>
      {company && (
        <Tooltip title={company} placement="bottom">
          <div style={{
            fontSize: '0.65rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#333',
            maxWidth: '100%'
          }}>
            {company}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

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

const CalendarView = ({ userId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [hoveredDate, setHoveredDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverContent, setPopoverContent] = useState([]);
  const calendarRef = useRef(null);
  const [newApplication, setNewApplication] = useState({
    jobTitle: '',
    company: '',
    status: 'Applied',
    notes: ''
  });

  // Fetch applications
  const fetchApplications = async (effectiveUserId) => {
    try {
      setLoading(true);
      console.log(`CalendarView: Fetching applications for user: ${effectiveUserId}`);
      const res = await api.get(`/applications/${effectiveUserId}`);
      console.log('CalendarView: Applications fetched:', res.data);
      setApplications(res.data);
      setError(null);
    } catch (error) {
      console.error("CalendarView: Applications could not be loaded:", error);
      setError("An error occurred while loading applications.");
      
      // If we get an error, try to show some mock data for demonstration
      if (applications.length === 0) {
        console.log('CalendarView: Using mock application data for demonstration');
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
          },
          {
            _id: 'mock-app-2',
            job: {
              title: 'Frontend Developer',
              company: 'Web Solutions Inc.',
              location: 'Remote',
              applicationUrl: 'https://example.com/job/456'
            },
            status: 'Interview',
            appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            timeline: [
              {
                status: 'Applied',
                notes: 'Initial application submitted',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                status: 'Interview',
                notes: 'Scheduled for interview',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            notes: [
              {
                content: 'Interview scheduled for next week',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Generate array of days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }
    
    // Add empty cells to complete the last week if needed
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        days.push({ day: null, date: null });
      }
    }
    
    setCalendarDays(days);
  };

  // Get applications for a specific day
  const getApplicationsForDay = (date) => {
    if (!date) return [];
    
    return applications.filter(app => {
      const appDate = new Date(app.appliedAt);
      return (
        appDate.getDate() === date.getDate() &&
        appDate.getMonth() === date.getMonth() &&
        appDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Handle date click
  const handleDateClick = (info) => {
    // Önce o güne ait başvuruları kontrol et
    const date = info.date;
    const dayApps = applications.filter(app => {
      const appDate = new Date(app.appliedAt);
      return (
        appDate.getDate() === date.getDate() &&
        appDate.getMonth() === date.getMonth() &&
        appDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Eğer başvuru varsa popover'ı göster
    if (dayApps.length > 0) {
      handlePopoverOpen(info.jsEvent, date, dayApps);
    } else {
      // Başvuru yoksa yeni başvuru eklemek için dialog'u aç
      setSelectedDate(info.date);
      setDialogOpen(true);
      setNewApplication({
        jobTitle: '',
        company: '',
        status: 'Applied',
        notes: ''
      });
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
  };

  // Handle new application submission
  const handleSubmit = async () => {
    try {
      // Create a new application
      const newApp = {
        job: {
          title: newApplication.jobTitle,
          company: newApplication.company
        },
        status: newApplication.status,
        appliedAt: selectedDate.toISOString(),
        notes: [{
          content: newApplication.notes,
          createdAt: new Date().toISOString()
        }]
      };

      // In a real app, you would send this to your API
      console.log('Creating new application:', newApp);
      
      // For now, just add it to the local state
      setApplications([...applications, {
        _id: `mock-app-${Date.now()}`,
        ...newApp,
        lastUpdated: new Date().toISOString(),
        timeline: [{
          status: newApplication.status,
          notes: newApplication.notes,
          date: selectedDate.toISOString()
        }]
      }]);

      // Close the dialog
      handleDialogClose();
    } catch (error) {
      console.error('Error creating application:', error);
      // Handle error
    }
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      // Find the first event with the selected status
      const matchingEvent = applications.find(app => app.status === status);
      
      if (matchingEvent) {
        // Navigate to the date of the first matching event
        const eventDate = new Date(matchingEvent.appliedAt);
        calendarApi.gotoDate(eventDate);
      }
    }
  };

  // Handle mouse enter on a day
  const handleDayMouseEnter = (date, applications) => {
    setHoveredDate(date);
    setPopoverContent(applications);
  };

  // Handle mouse leave on a day
  const handleDayMouseLeave = () => {
    setHoveredDate(null);
    setPopoverContent([]);
  };

  // Handle popover open
  const handlePopoverOpen = (event, date, applications) => {
    setAnchorEl(event.currentTarget);
    setPopoverContent(applications);
  };

  // Handle popover close
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    // Use a default user ID if none is provided
    const effectiveUserId = userId || 'demoUserId123';
    console.log('CalendarView: Using userId:', effectiveUserId);
    
    fetchApplications(effectiveUserId);
    generateCalendarDays();
    
    // Set up a timer to periodically refresh the applications
    const refreshInterval = setInterval(() => {
      console.log('CalendarView: Refreshing applications...');
      fetchApplications(effectiveUserId);
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [userId, currentDate]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Application Calendar
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Chip
            key={status}
            label={STATUS_DISPLAY_MAP[status]}
            size="small"
            sx={{
              backgroundColor: color,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: color,
                opacity: 0.9,
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease'
              },
              cursor: 'pointer'
            }}
            onClick={() => handleStatusFilter(status)}
          />
        ))}
      </Box>

      <Paper elevation={3} sx={{ p: 1 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={applications.map(app => ({
            id: app._id,
            title: app.job?.title || 'Job Application',
            start: app.appliedAt,
            extendedProps: {
              status: app.status,
              job: app.job,
              notes: app.notes
            },
            backgroundColor: STATUS_COLORS[app.status],
            borderColor: STATUS_COLORS[app.status],
            textColor: 'white'
          }))}
          eventContent={renderEventContent}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week'
          }}
          dateClick={handleDateClick}
          eventMouseEnter={(info) => {
            info.el.style.transform = 'scale(1.05)';
            info.el.style.zIndex = '10';
            info.el.style.transition = 'all 0.2s ease';
            info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          }}
          eventMouseLeave={(info) => {
            info.el.style.transform = '';
            info.el.style.zIndex = '';
            info.el.style.transition = '';
            info.el.style.boxShadow = '';
          }}
          dayCellDidMount={(info) => {
            // Add custom styling and event handlers to day cells
            const date = info.date;
            const dayApps = applications.filter(app => {
              const appDate = new Date(app.appliedAt);
              return (
                appDate.getDate() === date.getDate() &&
                appDate.getMonth() === date.getMonth() &&
                appDate.getFullYear() === date.getFullYear()
              );
            });
            
            if (dayApps.length > 0) {
              // Add a subtle background color to days with applications
              info.el.style.backgroundColor = 'rgba(33, 150, 243, 0.05)';
              info.el.style.borderRadius = '4px';
              
              // Add hover effect
              info.el.addEventListener('mouseenter', () => {
                info.el.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
                info.el.style.transform = 'scale(1.02)';
                info.el.style.transition = 'all 0.2s ease';
                info.el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                handleDayMouseEnter(date, dayApps);
              });
              
              info.el.addEventListener('mouseleave', () => {
                info.el.style.backgroundColor = 'rgba(33, 150, 243, 0.05)';
                info.el.style.transform = '';
                info.el.style.transition = '';
                info.el.style.boxShadow = '';
                handleDayMouseLeave();
              });
            }
          }}
          height="auto"
          contentHeight="auto"
          aspectRatio={2.5}
          dayMaxEventRows={3}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </Paper>

      {/* Add Application Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Application for {selectedDate ? selectedDate.toLocaleDateString() : ''}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Job Title"
                fullWidth
                value={newApplication.jobTitle}
                onChange={(e) => setNewApplication({...newApplication, jobTitle: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company"
                fullWidth
                value={newApplication.company}
                onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newApplication.status}
                  label="Status"
                  onChange={(e) => setNewApplication({...newApplication, status: e.target.value})}
                >
                  {Object.keys(STATUS_COLORS).map((status) => (
                    <MenuItem key={status} value={status}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            backgroundColor: STATUS_COLORS[status],
                            mr: 1
                          }} 
                        />
                        {STATUS_DISPLAY_MAP[status]}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={4}
                value={newApplication.notes}
                onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!newApplication.jobTitle || !newApplication.company}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Applications Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            maxWidth: '280px',
            width: '100%'
          }
        }}
      >
        <Box sx={{ p: 1.5, maxWidth: 280 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
            Applications
          </Typography>
          <Stack spacing={1}>
            {popoverContent.map((app, index) => (
              <Card key={index} variant="outlined" sx={{ 
                boxShadow: 'none', 
                border: `1px solid ${STATUS_COLORS[app.status]}40`,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent sx={{ p: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
                  <Tooltip title={app.job?.title || 'Job Application'} placement="top">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {app.job?.title || 'Job Application'}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={app.job?.company || 'Unknown Company'} placement="top">
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {app.job?.company || 'Unknown Company'}
                    </Typography>
                  </Tooltip>
                  <Chip 
                    label={STATUS_DISPLAY_MAP[app.status]} 
                    size="small" 
                    sx={{ 
                      mt: 0.5, 
                      height: '20px',
                      fontSize: '0.65rem',
                      backgroundColor: STATUS_COLORS[app.status],
                      color: 'white',
                      fontWeight: 'bold',
                      maxWidth: '100%',
                      '.MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }} 
                  />
                </CardContent>
                <CardActions sx={{ p: 0.5, justifyContent: 'flex-end' }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <EditIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      <DeleteIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
};

export default CalendarView;
