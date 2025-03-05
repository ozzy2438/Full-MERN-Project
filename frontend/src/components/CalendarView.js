// frontend/src/components/CalendarView.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Stack, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import api from '../services/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Status color mapping
const STATUS_COLORS = {
  'Applied': '#3498db',
  'Under Review': '#f39c12',
  'Interview': '#2ecc71',
  'Offer': '#9b59b6',
  'Accepted': '#27ae60',
  'Rejected': '#e74c3c',
  'Cancelled': '#95a5a6'
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
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <Chip
            key={status}
            label={STATUS_DISPLAY_MAP[status]}
            sx={{
              backgroundColor: color,
              color: 'white',
              '&:hover': {
                backgroundColor: color,
                opacity: 0.9
              }
            }}
          />
        ))}
      </Box>

      <Paper elevation={3} sx={{ p: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={applications}
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
        />
      </Paper>
    </Box>
  );
};

export default CalendarView;
