// frontend/src/components/AnalysisResults.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Paper,
  Chip,
  Stack,
  Link,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  WorkspacePremium as CertificateIcon,
  Timeline as TimelineIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  GetApp as DownloadIcon,
  Insights as InsightsIcon,
  PersonSearch as PersonSearchIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import JobListings from './JobListings';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AnalysisResults = ({ analysis }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [processedAnalysis, setProcessedAnalysis] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Process analysis data and make it safe to render
  useEffect(() => {
    if (analysis) {
      try {
        console.log("Raw analysis data received:", analysis);
        
        // Check all fields that could be objects and convert to string
        const processed = {
          ...analysis,
          summary: typeof analysis.summary === 'object' ? 
                  JSON.stringify(analysis.summary) : 
                  analysis.summary || '',
          // Special processing for data from OpenAI API
          skills: Array.isArray(analysis.personalSkills) ? analysis.personalSkills : 
                 Array.isArray(analysis.skills) ? analysis.skills : 
                 Array.isArray(analysis.keySkills) ? analysis.keySkills :
                 (typeof analysis.skills === 'object' && analysis.skills !== null) ? 
                 Object.values(analysis.skills).filter(Boolean) : [],
          
          jobTitles: Array.isArray(analysis.recommendedJobTitles) ? analysis.recommendedJobTitles :
                    Array.isArray(analysis.jobTitles) ? analysis.jobTitles : 
                    (typeof analysis.jobTitles === 'object' && analysis.jobTitles !== null) ? 
                    Object.values(analysis.jobTitles).filter(Boolean) : [],
          
          strengths: Array.isArray(analysis.strengths) ? analysis.strengths : 
                    (typeof analysis.strengths === 'object' && analysis.strengths !== null) ? 
                    Object.values(analysis.strengths).filter(Boolean) : [],
          
          improvements: Array.isArray(analysis.areasToImprove) ? analysis.areasToImprove :
                       Array.isArray(analysis.weaknesses) ? analysis.weaknesses :
                       Array.isArray(analysis.improvements) ? analysis.improvements : 
                       (typeof analysis.improvements === 'object' && analysis.improvements !== null) ? 
                       Object.values(analysis.improvements).filter(Boolean) : [],
          
          recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : 
                          (typeof analysis.recommendations === 'object' && analysis.recommendations !== null) ? 
                          Object.values(analysis.recommendations).filter(Boolean) : [],
          
          professionalProfile: analysis.detailedAnalysis?.professionalProfile || 
                              analysis.professionalProfile || '',
          
          keyAchievements: Array.isArray(analysis.detailedAnalysis?.keyAchievements) ? 
                          analysis.detailedAnalysis.keyAchievements.join(". ") :
                          typeof analysis.keyAchievements === 'object' ? 
                          JSON.stringify(analysis.keyAchievements) : 
                          analysis.keyAchievements || '',
          
          industryFit: Array.isArray(analysis.detailedAnalysis?.industryFit) ?
                      analysis.detailedAnalysis.industryFit.join(". ") :
                      typeof analysis.industryFit === 'object' ? 
                      JSON.stringify(analysis.industryFit) : 
                      analysis.industryFit || '',
          
          recommendedJobTitles: Array.isArray(analysis.detailedAnalysis?.recommendedJobTitles) ?
                               analysis.detailedAnalysis.recommendedJobTitles :
                               Array.isArray(analysis.recommendedJobTitles) ? analysis.recommendedJobTitles : 
                               (typeof analysis.recommendedJobTitles === 'object' && analysis.recommendedJobTitles !== null) ? 
                               Object.values(analysis.recommendedJobTitles).filter(Boolean) : [],
          
          skillGaps: Array.isArray(analysis.detailedAnalysis?.skillGaps) ?
                    analysis.detailedAnalysis.skillGaps :
                    Array.isArray(analysis.skillGaps) ? analysis.skillGaps : 
                    (typeof analysis.skillGaps === 'object' && analysis.skillGaps !== null) ? 
                    Object.values(analysis.skillGaps).filter(Boolean) : [],
          
          // Add detailed analysis data to insights field
          insights: analysis.detailedAnalysis ? JSON.stringify(analysis.detailedAnalysis) : null
        };
        
        console.log("Processed analysis data:", processed);
        setProcessedAnalysis(processed);
      } catch (error) {
        console.error('Error processing analysis data:', error);
        // Create a simple processed object in case of error
        setProcessedAnalysis({
          ...analysis,
          summary: String(analysis.summary || ''),
          skills: [],
          jobTitles: [],
          strengths: [],
          improvements: [],
          recommendations: [],
          professionalProfile: '',
          keyAchievements: '',
          industryFit: '',
          recommendedJobTitles: [],
          skillGaps: []
        });
      }
    }
  }, [analysis]);

  const searchJobs = async (pageNumber = 1, customQuery = null, location = null) => {
    try {
      setLoading(true);
      setError(null);

      // Predefined keywords
      const keySkills = processedAnalysis?.skills && processedAnalysis.skills.length > 0 
        ? processedAnalysis.skills.slice(0, 3).join(' ') 
        : '';
      
      const keyRoles = processedAnalysis?.jobTitles && processedAnalysis.jobTitles.length > 0 
        ? processedAnalysis.jobTitles[0] 
        : '';
      
      // Create search query
      const searchQuery = customQuery || `${keyRoles} ${keySkills}`.trim();
      
      console.log('Searching jobs with query:', searchQuery);
      console.log('Location:', location);
      
      const response = await api.get('/jobs', {
        params: { 
          query: searchQuery,
          page: pageNumber,
          location: location || ''
        },
        timeout: 60000 // 60 seconds timeout
      });

      console.log('Job search response:', response.data);

      if (response.data) {
        if (pageNumber > 1) {
          setJobs(prevJobs => [...prevJobs, ...response.data.jobs]);
        } else {
          setJobs(response.data.jobs || []);
        }
        
        setNextPageToken(pageNumber + 1);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Job search timed out. Please try again later.');
      } else if (err.response) {
        setError(`Could not search for jobs: ${err.response.data?.error || 'Server error'}`);
      } else if (err.request) {
        setError('Could not connect to server. Please check your internet connection.');
      } else {
        setError('Could not search for jobs. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const testJobSearch = async () => {
    try {
      const response = await api.get('/jobs', {
        params: {
          query: 'software developer'
        }
      });
      console.log('Test job search response:', response.data);
    } catch (error) {
      console.error('Test job search error:', error);
    }
  };

  const renderGlowingCard = (title, icon, content, color = '#60a5fa') => {
    return (
      <Card
        sx={{
          height: '100%',
          borderRadius: 2,
          position: 'relative',
          overflow: 'visible',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(96, 165, 250, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease, transform 0.4s ease-out, height 0.4s ease-out',
          '&:hover': {
            transform: 'translateY(-5px) scale(1.02)',
            boxShadow: `0 0 20px ${color}`,
            zIndex: 10
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: `linear-gradient(45deg, ${color} 0%, transparent 100%)`,
            zIndex: -1,
            borderRadius: '10px',
            opacity: 0.5,
            filter: 'blur(8px)',
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 0.8,
          }
        }}
      >
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2, 
            pb: 1, 
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`
          }}>
            <Box sx={{ 
              mr: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 1,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              {icon}
            </Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          {content}
        </CardContent>
      </Card>
    );
  };

  // If analysis or processed analysis doesn't exist, don't render anything
  if (!analysis || !processedAnalysis) return null;

  // Return a string value safely
  const getSafeString = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    try {
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    } catch (error) {
      console.error('Error during string conversion:', error);
      return defaultValue;
    }
  };

  // Return an array safely
  const getSafeArray = (value, defaultValue = []) => {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value;
    try {
      return typeof value === 'object' && value !== null ? 
        Object.values(value).filter(Boolean) : defaultValue;
    } catch (error) {
      console.error('Error during array conversion:', error);
      return defaultValue;
    }
  };

  return (
    <>
      <Box sx={{ mt: 4, width: '100%' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 3,
            color: 'primary.main',
            textAlign: 'center'
          }}
        >
          Resume Analysis
        </Typography>

        <Grid container spacing={3}>
          {/* Executive Summary */}
          <Grid item xs={12}>
            {renderGlowingCard(
              'Executive Summary',
              <AssessmentIcon color="primary" />,
              <Typography variant="body1">
                {getSafeString(processedAnalysis.summary, 
                  `Your resume ${getSafeArray(processedAnalysis.skills).join(', ') || 'covers various areas'} and showcases your experience. ` + 
                  (getSafeArray(processedAnalysis.strengths).length > 0 ? 
                    `Strong points: ${getSafeArray(processedAnalysis.strengths).join(', ')}. ` : '') +
                  (getSafeArray(processedAnalysis.recommendations).length > 0 ? 
                    `Recommendation: ${getSafeArray(processedAnalysis.recommendations)[0]}` : 'We recommend highlighting specific achievements.')
                )}
              </Typography>,
              '#60a5fa'
            )}
          </Grid>

          {/* Skills Breakdown */}
          <Grid item xs={12} md={6}>
            {renderGlowingCard(
              'Skills Breakdown',
              <AssessmentIcon color="primary" />,
              <Box>
                {getSafeArray(processedAnalysis.skills).length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                    {getSafeArray(processedAnalysis.skills).map((skill, index) => (
                      <Chip 
                        key={index} 
                        label={getSafeString(skill)} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderRadius: '4px',
                          backgroundColor: 'rgba(96, 165, 250, 0.1)',
                          '&:hover': { backgroundColor: 'rgba(96, 165, 250, 0.2)' }
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2">No specific skills were identified in your resume.</Typography>
                )}
              </Box>,
              '#93c5fd'
            )}
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={6}>
            {renderGlowingCard(
              'Recommendations',
              <TrendingUpIcon color="warning" />,
              <Box>
                {/* Always show at least default recommendations */}
                <List dense disablePadding>
                  {getSafeArray(processedAnalysis.recommendations).length > 0 ? (
                    getSafeArray(processedAnalysis.recommendations).map((rec, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={getSafeString(rec)}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))
                  ) : (
                    // Default recommendations if none are provided
                    <>
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary="Add quantitative achievements to your resume"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary="Enhance your skills section with specific technologies and proficiency levels"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary="Include relevant certifications and professional development activities"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </Box>,
              '#fbbf24'
            )}
          </Grid>

          {/* Areas of Improvement */}
          <Grid item xs={12} md={6}>
            {renderGlowingCard(
              'Areas of Improvement',
              <SchoolIcon color="error" />,
              <Box>
                {getSafeArray(processedAnalysis.improvements).length > 0 ? (
                  <List dense disablePadding>
                    {getSafeArray(processedAnalysis.improvements).map((improvement, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={getSafeString(improvement)}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2">
                    Add more quantitative results and achievements to strengthen your resume.
                  </Typography>
                )}
              </Box>,
              '#f87171'
            )}
          </Grid>

          {/* Job Matching */}
          <Grid item xs={12} md={6}>
            {renderGlowingCard(
              'Job Matching',
              <WorkIcon color="info" />,
              <Box>
                {getSafeArray(processedAnalysis.jobTitles).length > 0 ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Your resume is a strong match for:
                    </Typography>
                    <ul style={{ 
                      listStyleType: 'disc', 
                      paddingLeft: '1.5rem',
                      marginTop: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {getSafeArray(processedAnalysis.jobTitles).map((job, index) => (
                        <li key={index} style={{ 
                          marginBottom: '0.5rem',
                          fontSize: '1rem',
                          lineHeight: '1.5'
                        }}>
                          {getSafeString(job)}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => searchJobs(1)}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Find Matching Jobs'}
                    </Button>
                    {jobs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Found {jobs.length} matching positions
                        </Typography>
                        <List dense disablePadding>
                          {jobs.slice(0, 3).map((job, index) => (
                            <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={job.title}
                                secondary={job.company}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                              <Link 
                                href={job.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                sx={{ ml: 1, fontSize: '0.75rem' }}
                              >
                                View
                              </Link>
                            </ListItem>
                          ))}
                        </List>
                        {jobs.length > 3 && (
                          <Button 
                            variant="text" 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={() => setDialogOpen('jobs')}
                          >
                            View All {jobs.length} Jobs
                          </Button>
                        )}
                      </Box>
                    )}
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    <Typography variant="body2">
                      Your resume matches these positions: Software Developer, Data Analyst, Project Manager
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => searchJobs(1)}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Find Matching Jobs'}
                    </Button>
                    {jobs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Found {jobs.length} matching positions
                        </Typography>
                        <List dense disablePadding>
                          {jobs.slice(0, 3).map((job, index) => (
                            <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={job.title}
                                secondary={job.company}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                              <Link 
                                href={job.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                sx={{ ml: 1, fontSize: '0.75rem' }}
                              >
                                View
                              </Link>
                            </ListItem>
                          ))}
                        </List>
                        {jobs.length > 3 && (
                          <Button 
                            variant="text" 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={() => setDialogOpen('jobs')}
                          >
                            View All {jobs.length} Jobs
                          </Button>
                        )}
                      </Box>
                    )}
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </>
                )}
              </Box>,
              '#60a5fa'
            )}
          </Grid>

          {/* Resume Score */}
          <Grid item xs={12} md={6}>
            {renderGlowingCard(
              'Resume Score',
              <PieChartIcon color="secondary" />,
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Box sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 50%, transparent 70%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      border: '10px solid rgba(96, 165, 250, 0.7)',
                      borderRightColor: 'transparent',
                      borderBottomColor: 'rgba(96, 165, 250, 0.3)',
                      transform: 'rotate(-45deg)',
                    }
                  }}
                >
                  <Typography variant="h4" color="primary.light" sx={{ fontWeight: 700 }}>
                    {getSafeString(processedAnalysis.score, '75%')}
                  </Typography>
                </Box>
              </Box>,
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                {getSafeString(processedAnalysis.scoreDetails, 'Good resume, but some areas need improvement.')}
              </Typography>,
              '#93c5fd'
            )}
          </Grid>

          {/* Tailored Insights */}
          <Grid item xs={12}>
            {renderGlowingCard(
              'Detailed Insights',
              <InsightsIcon color="info" />,
              <Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'white',
                    '& span.highlight': {
                      color: '#f472b6',
                      fontWeight: 500
                    },
                    '& .section-title': {
                      color: '#60a5fa',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      marginTop: '16px',
                      marginBottom: '8px',
                      display: 'block',
                      borderBottom: '1px solid rgba(96, 165, 250, 0.3)',
                      paddingBottom: '4px'
                    },
                    '& ul': {
                      paddingLeft: '20px',
                      marginTop: '8px',
                      marginBottom: '12px',
                      listStyleType: 'none'
                    },
                    '& li': {
                      marginBottom: '8px',
                      position: 'relative',
                      paddingLeft: '16px',
                      '&:before': {
                        content: '"•"',
                        color: '#60a5fa',
                        position: 'absolute',
                        left: 0,
                        fontWeight: 'bold'
                      }
                    },
                    '& p': {
                      marginBottom: '12px',
                      textAlign: 'justify'
                    },
                    '& .skill-tag': {
                      display: 'inline-block',
                      backgroundColor: 'rgba(96, 165, 250, 0.15)',
                      color: '#93c5fd',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      margin: '2px 4px 2px 0',
                      fontSize: '0.9rem'
                    },
                    '& .achievement': {
                      color: '#34d399'
                    },
                    '& .improvement': {
                      color: '#f87171'
                    }
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      // Process detailed analysis data
                      const rawData = processedAnalysis.insights || processedAnalysis.detailedAnalysis;
                      
                      // If data is JSON format, make it more readable
                      if (typeof rawData === 'string' && (rawData.startsWith('{') || rawData.startsWith('['))) {
                        try {
                          const parsedData = JSON.parse(rawData);
                          
                          // Professional profile
                          let result = '<span class="section-title">Professional Profile</span>';
                          
                          // Format professional profile text - highlight keywords
                          if (parsedData.professionalProfile) {
                            const highlightedProfile = parsedData.professionalProfile
                              .replace(/(experience|expertise|skills|knowledge|proficient|advanced|expert|years|degree|education|certified|qualification)/gi, 
                                '<span class="highlight">$1</span>')
                              .replace(/(\d+%|\d+\s*[a-zA-Z]+|increased|improved|reduced|saved|generated)/gi, 
                                '<span class="achievement">$1</span>');
                            
                            result += `<p>${highlightedProfile}</p>`;
                          } else {
                            result += `<p>A detailed professional profile could not be generated from your resume.</p>`;
                          }
                          
                          // Key Achievements
                          if (parsedData.keyAchievements && Array.isArray(parsedData.keyAchievements) && parsedData.keyAchievements.length > 0) {
                            result += `<span class="section-title">Key Achievements</span><ul>`;
                            parsedData.keyAchievements.forEach(achievement => {
                              // Highlight numerical values
                              const highlightedAchievement = achievement
                                .replace(/(\d+%|\d+\s*[a-zA-Z]+|increased|improved|reduced|saved|generated)/gi, 
                                  '<span class="achievement">$1</span>');
                              result += `<li>${highlightedAchievement}</li>`;
                            });
                            result += `</ul>`;
                          }
                          
                          // Industry Fit
                          if (parsedData.industryFit && Array.isArray(parsedData.industryFit) && parsedData.industryFit.length > 0) {
                            result += `<span class="section-title">Industry Fit</span><ul>`;
                            parsedData.industryFit.forEach(industry => {
                              result += `<li>${industry}</li>`;
                            });
                            result += `</ul>`;
                          }
                          
                          // Recommended Job Titles
                          if (parsedData.recommendedJobTitles && Array.isArray(parsedData.recommendedJobTitles) && parsedData.recommendedJobTitles.length > 0) {
                            result += `<span class="section-title">Recommended Job Titles</span><ul>`;
                            parsedData.recommendedJobTitles.forEach(job => {
                              result += `<li>${job}</li>`;
                            });
                            result += `</ul>`;
                          }
                          
                          // Skill Gaps
                          if (parsedData.skillGaps && Array.isArray(parsedData.skillGaps) && parsedData.skillGaps.length > 0) {
                            result += `<span class="section-title">Skill Gaps</span><ul>`;
                            parsedData.skillGaps.forEach(gap => {
                              result += `<li>${gap}</li>`;
                            });
                            result += `</ul>`;
                          }
                          
                          return result;
                        } catch (error) {
                          console.error('Error parsing detailed analysis data:', error);
                          return 'Could not parse detailed analysis data.';
                        }
                      } else {
                        return rawData || 'No detailed analysis data available.';
                      }
                    })()
                  }}
                />
              </Box>,
              '#93c5fd'
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Job Listings Dialog */}
      <Dialog 
        open={dialogOpen === 'jobs'} 
        onClose={() => setDialogOpen(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Typography variant="h6">
            Matching Job Positions
          </Typography>
        </DialogTitle>
        <DialogContent>
          {jobs.length > 0 ? (
            <List>
              {jobs.map((job, index) => (
                <ListItem 
                  key={index}
                  divider={index < jobs.length - 1}
                  alignItems="flex-start"
                  sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}
                >
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" component="div" fontWeight="medium">
                      {job.title}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // Save job to applications
                        api.post('/applications', {
                          user: user?.id,
                          job: {
                            title: job.title,
                            company: job.company,
                            location: job.location || 'Not specified',
                            description: job.description || '',
                            applicationUrl: job.url
                          },
                          status: 'Applied',
                          timeline: [{
                            status: 'Applied',
                            notes: 'Applied through CareerLens'
                          }]
                        })
                        .then(() => {
                          alert('Job application saved successfully!');
                          // Open job URL in new tab
                          window.open(job.url, '_blank');
                        })
                        .catch(err => {
                          console.error('Error saving application:', err);
                          // Still open the URL even if saving fails
                          window.open(job.url, '_blank');
                        });
                      }}
                    >
                      Apply & Track
                    </Button>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {job.company} • {job.location || 'Remote/Various'}
                  </Typography>
                  
                  {job.salary && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Salary: {job.salary}
                    </Typography>
                  )}
                  
                  {job.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {job.description.length > 250 
                        ? `${job.description.substring(0, 250)}...` 
                        : job.description}
                    </Typography>
                  )}
                  
                  {job.highlights && job.highlights.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {job.highlights.map((highlight, i) => (
                        <Typography key={i} variant="body2" sx={{ mt: 0.5 }}>
                          • {highlight.items && highlight.items[0]}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
              No job listings found. Try adjusting your search query.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Close</Button>
          {nextPageToken && (
            <Button 
              onClick={() => searchJobs(nextPageToken)} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              Load More
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AnalysisResults;
