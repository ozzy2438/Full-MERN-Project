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

// Status color mapping
const STATUS_COLORS = {
  'Başvuruldu': '#60a5fa', // Blue
  'Değerlendiriliyor': '#a78bfa', // Purple
  'Mülakat': '#f59e0b', // Amber
  'Teklif': '#10b981', // Green
  'Kabul Edildi': '#10b981', // Green
  'Reddedildi': '#ef4444', // Red
  'İptal': '#6b7280' // Gray
};

// English to Turkish status mapping for display purposes
const STATUS_DISPLAY_MAP = {
  'Başvuruldu': 'Applied',
  'Değerlendiriliyor': 'Under Review',
  'Mülakat': 'Interview',
  'Teklif': 'Offer',
  'Kabul Edildi': 'Accepted',
  'Reddedildi': 'Rejected',
  'İptal': 'Cancelled'
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
            status: 'Başvuruldu',
            appliedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            timeline: [
              {
                status: 'Başvuruldu',
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
            status: 'Mülakat',
            appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            timeline: [
              {
                status: 'Başvuruldu',
                notes: 'Initial application submitted',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                status: 'Mülakat',
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
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" gutterBottom>Calendar View - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
          {/* Calendar Header */}
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Sun</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Mon</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Tue</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Wed</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Thu</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Fri</div>
          <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>Sat</div>
          
          {/* Calendar Days */}
          {calendarDays.map((dayObj, index) => {
            const dayApplications = dayObj.date ? getApplicationsForDay(dayObj.date) : [];
            
            return (
              <div key={`day-${index}`} style={{ 
                height: '100px', 
                border: '1px solid #eee', 
                padding: '5px',
                position: 'relative',
                backgroundColor: dayObj.day ? 'transparent' : '#f9fafb'
              }}>
                {dayObj.day && (
                  <>
                    <div style={{ position: 'absolute', top: '5px', left: '5px' }}>{dayObj.day}</div>
                    <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayApplications.map((app, appIndex) => (
                        <div key={`app-${appIndex}`} style={{ 
                          backgroundColor: STATUS_COLORS[app.status] || '#60a5fa', 
                          color: 'white', 
                          padding: '2px 5px', 
                          borderRadius: '3px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%'
                        }}>
                          {STATUS_DISPLAY_MAP[app.status] || app.status}: {app.job?.title || 'Job Application'}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Color Legend:</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label="Applied" sx={{ bgcolor: STATUS_COLORS['Başvuruldu'], color: 'white' }} />
            <Chip label="Under Review" sx={{ bgcolor: STATUS_COLORS['Değerlendiriliyor'], color: 'white' }} />
            <Chip label="Interview" sx={{ bgcolor: STATUS_COLORS['Mülakat'], color: 'white' }} />
            <Chip label="Offer" sx={{ bgcolor: STATUS_COLORS['Teklif'], color: 'white' }} />
            <Chip label="Accepted" sx={{ bgcolor: STATUS_COLORS['Kabul Edildi'], color: 'white' }} />
            <Chip label="Rejected" sx={{ bgcolor: STATUS_COLORS['Reddedildi'], color: 'white' }} />
            <Chip label="Cancelled" sx={{ bgcolor: STATUS_COLORS['İptal'], color: 'white' }} />
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default CalendarView;
