// frontend/src/App.js
import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert,
  Snackbar,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ResumeUpload from './components/ResumeUpload';
import AnalysisResults from './components/AnalysisResults';
import JobListings from './components/JobListings';
import JobMatching from './components/JobMatching';
import ApplicationTracker from './components/ApplicationTracker';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import { Link } from 'react-router-dom';
import Dashboard from '@mui/icons-material/Dashboard';
import Work from '@mui/icons-material/Work';
import Assignment from '@mui/icons-material/Assignment';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Analytics from '@mui/icons-material/Analytics';
import Person from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import Notifications from '@mui/icons-material/Notifications';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#2563eb',
    },
    secondary: {
      main: '#f472b6',
      light: '#f9a8d4',
      dark: '#db2777',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#059669',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(30, 41, 59, 0.9))',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px -1px rgb(0 0 0 / 0.4), 0 4px 8px -2px rgb(0 0 0 / 0.4)',
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          }
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Main App Content
const MainContent = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Mock data for fallback
  const mockAnalysisData = {
    summary: "John Doe is a skilled software engineer with 5+ years of experience in web development.",
    strengths: ["JavaScript expertise", "React development", "Problem-solving skills", "Team collaboration", "Project management", "Technical communication", "Code optimization"],
    areasToImprove: ["Could expand cloud experience", "Add more quantifiable achievements", "Enhance leadership skills", "Broaden industry knowledge"],
    recommendations: ["Add metrics to achievements", "Highlight leadership experience", "Obtain cloud certifications", "Expand portfolio with diverse projects"],
    skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "Git", "HTML/CSS", "RESTful APIs", "TypeScript", "MongoDB"],
    resumeScore: 85,
    jobTitles: ["Software Engineer", "Frontend Developer", "Full Stack Developer", "React Developer", "JavaScript Developer"],
    detailedAnalysis: {
      professionalProfile: "Experienced software developer with strong frontend skills and a passion for creating responsive, user-friendly web applications. Has consistently delivered high-quality code and contributed to successful project completions.",
      keyAchievements: ["Developed responsive web applications", "Improved site performance by 40%", "Implemented CI/CD pipelines", "Reduced bug count by 30%", "Mentored junior developers", "Led frontend migration to React", "Optimized database queries"],
      industryFit: ["Technology", "E-commerce", "Finance", "Healthcare", "Education", "Media", "Consulting"],
      recommendedJobTitles: ["Senior Frontend Developer", "React Developer", "JavaScript Engineer", "UI Developer", "Web Application Developer"],
      skillGaps: ["DevOps", "Mobile Development", "Cloud Architecture", "Machine Learning", "UI/UX Design"]
    }
  };

  const handleUploadSuccess = async (uploadedFilePath) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Original file path:', uploadedFilePath);
      
      const filePath = uploadedFilePath.split('/').pop();
      console.log('Sending file path:', filePath);
      
      try {
        const analysisRes = await api.post('/analyze', { filePath });
        console.log('Analysis data:', analysisRes.data);

        if (analysisRes.data) {
          // Enrich analysis data
          const enhancedAnalysis = {
            ...analysisRes.data,
            // If data from API is missing, we add some basic data
            skills: analysisRes.data.skills || [],
            jobTitles: analysisRes.data.jobTitles || analysisRes.data.recommendedJobs || [],
            improvements: analysisRes.data.improvements || analysisRes.data.areasOfImprovement || [],
            strengths: analysisRes.data.strengths || [],
            recommendations: analysisRes.data.recommendations || []
          };
          
          setAnalysisData(enhancedAnalysis);
        } else {
          console.log('No data returned from analysis API, using mock data');
          setAnalysisData(mockAnalysisData);
        }
      } catch (analysisError) {
        console.error("Analysis API error:", analysisError);
        console.log('Using mock data due to API error');
        setAnalysisData(mockAnalysisData);
      }
      
      try {
        // Create keywords to search for jobs based on analysis data
        const currentData = analysisData || mockAnalysisData;
        
        const keySkills = currentData.skills && currentData.skills.length > 0 
          ? currentData.skills.slice(0, 3).join(' ') 
          : 'JavaScript React';
        
        const keyRoles = currentData.jobTitles && currentData.jobTitles.length > 0 
          ? currentData.jobTitles[0] 
          : 'Software Developer';
        
        // Create search query
        const searchQuery = `${keyRoles} ${keySkills}`.trim();
        
        if (searchQuery) {
          try {
            const jobsRes = await api.get('/jobs', {
              params: { 
                query: searchQuery
              }
            });
            
            if (jobsRes.data && jobsRes.data.jobs) {
              setJobs(jobsRes.data.jobs);
            }
          } catch (jobError) {
            console.error("Error fetching jobs:", jobError);
            // No need to show error for this, it's secondary functionality
          }
        }
      } catch (jobError) {
        console.error("Error in job search logic:", jobError);
      }
    } catch (error) {
      console.error("Overall error in upload success handler:", error);
      setError("An error occurred during analysis. Using sample data instead.");
      // Still show mock data even if there's an error
      setAnalysisData(mockAnalysisData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
        backgroundSize: '200% 200%',
      }}
    >
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ 
          pt: 8,
          pb: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }
        }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #60a5fa 30%, #f472b6 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              mb: 4,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transform: 'translateZ(0)',
              transition: 'transform 0.3s ease-out',
              '&:hover': {
                transform: 'translateZ(10px) scale(1.02)',
              }
            }}
          >
            CareerLens
          </Typography>
          
          <Paper elevation={3} sx={{ 
            p: 3, 
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, transparent 100%)',
              pointerEvents: 'none',
            }
          }}>
            <ResumeUpload onUploadSuccess={handleUploadSuccess} />
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && analysisData && (
            <>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <AnalysisResults analysis={analysisData} />
              </Paper>
            </>
          )}
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

const drawerItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Job Search', icon: <Work />, path: '/jobs' },
  { text: 'Job Matching', icon: <Work />, path: '/job-matching' },
  { text: 'Applications', icon: <Assignment />, path: '/applications' },
  { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { text: 'Resume Analysis', icon: <Analytics />, path: '/resume-analysis' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
];

function App() {
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainContent />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/job-matching"
              element={
                <ProtectedRoute>
                  <JobMatching />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
