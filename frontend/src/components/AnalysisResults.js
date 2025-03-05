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
  CardActions
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

const AnalysisResults = ({ analysis }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [processedAnalysis, setProcessedAnalysis] = useState(null);

  // Analysis verilerini işle ve güvenli bir şekilde render edilebilir hale getir
  useEffect(() => {
    if (analysis) {
      try {
        console.log("Raw analysis data received:", analysis);
        
        // Nesne olabilecek tüm alanları kontrol et ve string'e dönüştür
        const processed = {
          ...analysis,
          summary: typeof analysis.summary === 'object' ? 
                  JSON.stringify(analysis.summary) : 
                  analysis.summary || '',
          // OpenAI API'den gelen veriler için özel işleme
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
          
          // Detaylı analiz verilerini insights alanına ekle
          insights: analysis.detailedAnalysis ? JSON.stringify(analysis.detailedAnalysis) : null
        };
        
        console.log("Processed analysis data:", processed);
        setProcessedAnalysis(processed);
      } catch (error) {
        console.error('Analysis verilerini işlerken hata oluştu:', error);
        // Hata durumunda basit bir processed objesi oluştur
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

      // Önceden tanımlanmış anahtar kelimeler
      const keySkills = processedAnalysis?.skills && processedAnalysis.skills.length > 0 
        ? processedAnalysis.skills.slice(0, 3).join(' ') 
        : '';
      
      const keyRoles = processedAnalysis?.jobTitles && processedAnalysis.jobTitles.length > 0 
        ? processedAnalysis.jobTitles[0] 
        : '';
      
      // Arama sorgusu oluştur
      const searchQuery = customQuery || `${keyRoles} ${keySkills}`.trim();
      
      console.log('Searching jobs with query:', searchQuery);
      console.log('Location:', location);
      
      const response = await api.get('/jobs', {
        params: { 
          query: searchQuery,
          page: pageNumber,
          location: location || ''
        },
        timeout: 60000 // 60 saniye timeout
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
        setError('İş ilanları araması zaman aşımına uğradı. Lütfen daha sonra tekrar deneyiniz.');
      } else if (err.response) {
        setError(`İş ilanları aranamadı: ${err.response.data?.error || 'Sunucu hatası'}`);
      } else if (err.request) {
        setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.');
      } else {
        setError('İş ilanları aranamadı. Lütfen daha sonra tekrar deneyiniz.');
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

  // Eğer analysis veya işlenmiş analysis yoksa, hiçbir şey render etme
  if (!analysis || !processedAnalysis) return null;

  // Güvenli bir şekilde string değeri döndür
  const getSafeString = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    try {
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    } catch (error) {
      console.error('String dönüşümü sırasında hata:', error);
      return defaultValue;
    }
  };

  // Güvenli bir şekilde array döndür
  const getSafeArray = (value, defaultValue = []) => {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value;
    try {
      return typeof value === 'object' && value !== null ? 
        Object.values(value).filter(Boolean) : defaultValue;
    } catch (error) {
      console.error('Array dönüşümü sırasında hata:', error);
      return defaultValue;
    }
  };

  return (
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
                `Özgeçmişiniz ${getSafeArray(processedAnalysis.skills).join(', ') || 'çeşitli alanlar'}da deneyiminizi gösteriyor. ` + 
                (getSafeArray(processedAnalysis.strengths).length > 0 ? 
                  `Güçlü yönleriniz: ${getSafeArray(processedAnalysis.strengths).join(', ')}. ` : '') +
                (getSafeArray(processedAnalysis.recommendations).length > 0 ? 
                  `Öneri: ${getSafeArray(processedAnalysis.recommendations)[0]}` : 'Daha spesifik başarılarınızı vurgulamanızı öneririz.'))}
            </Typography>,
            '#60a5fa'
          )}
        </Grid>

        {/* Skills Breakdown */}
        <Grid item xs={12} md={6}>
          {renderGlowingCard(
            'Skills Breakdown',
            <PsychologyIcon color="success" />,
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
                <Typography variant="body2">Özgeçmişinizde belirgin beceriler tespit edilemedi.</Typography>
              )}
            </Box>,
            '#34d399'
          )}
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          {renderGlowingCard(
            'Recommendations',
            <TrendingUpIcon color="warning" />,
            <Box>
              {getSafeArray(processedAnalysis.recommendations).length > 0 ? (
                <List dense disablePadding>
                  {getSafeArray(processedAnalysis.recommendations).map((rec, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={getSafeString(rec)}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">
                  Özgeçmişinizi geliştirmek için spesifik başarılarınızı ve sonuçlarınızı vurgulayın.
                </Typography>
              )}
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
                  Özgeçmişinizi güçlendirmek için daha fazla nicel sonuç ve başarı ekleyin.
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
                <List dense disablePadding>
                  {getSafeArray(processedAnalysis.jobTitles).map((job, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={getSafeString(job)}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">
                  Özgeçmişiniz şu pozisyonlara uygun: Yazılım Geliştirici, Veri Analisti, Proje Yöneticisi
                </Typography>
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
              {getSafeString(processedAnalysis.scoreDetails, 'İyi bir özgeçmiş, ancak gelişim için bazı alanlar var.')}
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
                    // Detaylı analiz verilerini işle
                    const rawData = processedAnalysis.insights || processedAnalysis.detailedAnalysis;
                    
                    // Eğer veri JSON formatında ise, daha okunabilir hale getir
                    if (typeof rawData === 'string' && (rawData.startsWith('{') || rawData.startsWith('['))) {
                      try {
                        const parsedData = JSON.parse(rawData);
                        
                        // Profesyonel profil
                        let result = '<span class="section-title">Profesyonel Profil</span>';
                        
                        // Profesyonel profil metnini biçimlendir - anahtar kelimeleri vurgula
                        if (parsedData.professionalProfile) {
                          const highlightedProfile = parsedData.professionalProfile
                            .replace(/(experience|expertise|skills|knowledge|proficient|advanced|expert|years|degree|education|certified|qualification)/gi, 
                              '<span class="highlight">$1</span>')
                            .replace(/(\d+%|\d+\s*[a-zA-Z]+|increased|improved|reduced|saved|generated)/gi, 
                              '<span class="achievement">$1</span>');
                          
                          result += `<p>${highlightedProfile}</p>`;
                        } else {
                          result += `<p>Özgeçmişinizden detaylı bir profesyonel profil oluşturulamamıştır.</p>`;
                        }
                        
                        // Key Achievements
                        if (parsedData.keyAchievements && Array.isArray(parsedData.keyAchievements) && parsedData.keyAchievements.length > 0) {
                          result += `<span class="section-title">Önemli Başarılar</span><ul>`;
                          parsedData.keyAchievements.forEach(achievement => {
                            // Sayısal değerleri vurgula
                            const highlightedAchievement = achievement
                              .replace(/(\d+%|\d+\s*[a-zA-Z]+|increased|improved|reduced|saved|generated)/gi, 
                                '<span class="achievement">$1</span>');
                            result += `<li>${highlightedAchievement}</li>`;
                          });
                          result += `</ul>`;
                        }
                        
                        // Industry Fit
                        if (parsedData.industryFit && Array.isArray(parsedData.industryFit) && parsedData.industryFit.length > 0) {
                          result += `<span class="section-title">Sektör Uyumu</span><ul>`;
                          parsedData.industryFit.forEach(industry => {
                            // Sektör adını vurgula
                            const parts = industry.split(' - ');
                            if (parts.length > 1) {
                              result += `<li><span class="skill-tag">${parts[0]}</span> ${parts[1]}</li>`;
                            } else {
                              result += `<li>${industry}</li>`;
                            }
                          });
                          result += `</ul>`;
                        }
                        
                        // Recommended Job Titles
                        if (parsedData.recommendedJobTitles && Array.isArray(parsedData.recommendedJobTitles) && parsedData.recommendedJobTitles.length > 0) {
                          result += `<span class="section-title">Önerilen İş Pozisyonları</span>`;
                          result += `<p>`;
                          parsedData.recommendedJobTitles.forEach((title, index) => {
                            result += `<span class="skill-tag">${title}</span>${index < parsedData.recommendedJobTitles.length - 1 ? ' ' : ''}`;
                          });
                          result += `</p>`;
                        }
                        
                        // Skill Gaps
                        if (parsedData.skillGaps && Array.isArray(parsedData.skillGaps) && parsedData.skillGaps.length > 0) {
                          result += `<span class="section-title">Geliştirilmesi Gereken Beceriler</span><ul>`;
                          parsedData.skillGaps.forEach(gap => {
                            // Geliştirilmesi gereken becerileri vurgula
                            const parts = gap.split(' - ');
                            if (parts.length > 1) {
                              result += `<li><span class="improvement">${parts[0]}</span> - ${parts[1]}</li>`;
                            } else {
                              result += `<li><span class="improvement">${gap}</span></li>`;
                            }
                          });
                          result += `</ul>`;
                        }
                        
                        return result;
                      } catch (e) {
                        console.error('JSON parse hatası:', e);
                        
                        // JSON parse hatası durumunda daha iyi bir görünüm sağla
                        try {
                          // JSON formatını düzeltmeye çalış
                          const cleanedJson = rawData
                            .replace(/\\n/g, '<br/>')
                            .replace(/\\"/g, '"')
                            .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
                          
                          // JSON'u daha okunabilir hale getir
                          const formattedJson = cleanedJson
                            .replace(/{/g, '{<br/>&nbsp;&nbsp;')
                            .replace(/}/g, '<br/>}')
                            .replace(/,/g, ',<br/>&nbsp;&nbsp;')
                            .replace(/"([^"]+)":/g, '<span class="highlight">"$1"</span>:')
                            .replace(/: "([^"]+)"/g, ': "<span class="achievement">$1</span>"')
                            .replace(/\[/g, '[<br/>&nbsp;&nbsp;')
                            .replace(/\]/g, '<br/>]')
                            .replace(/\],/g, '],<br/>&nbsp;&nbsp;');
                          
                          return `<span class="section-title">Detaylı Analiz</span>
                                  <div style="background-color: rgba(0,0,0,0.2); padding: 12px; border-radius: 4px; margin-top: 8px;">
                                    ${formattedJson}
                                  </div>`;
                        } catch (formatError) {
                          console.error('JSON format hatası:', formatError);
                          return `<span class="section-title">Detaylı Analiz</span>
                                  <p>Analiz verileri gösterilemiyor. Format hatası oluştu.</p>
                                  <pre style="background-color: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; overflow-x: auto; font-size: 0.8rem;">
                                    ${rawData}
                                  </pre>`;
                        }
                      }
                    }
                    
                    // Düz metin ise doğrudan göster ama biçimlendir
                    // Eğer veri yoksa, boş bir string döndür
                    if (!rawData) {
                      return "Özgeçmiş analizi yapılamadı. Lütfen daha sonra tekrar deneyin.";
                    }
                    
                    // Veri varsa, dinamik olarak oluştur
                    let analysisText = "";
                    
                    // Profesyonel profil
                    if (processedAnalysis.professionalProfile) {
                      analysisText += getSafeString(processedAnalysis.professionalProfile) + "\n\n";
                    }
                    
                    // Beceriler
                    if (getSafeArray(processedAnalysis.skills).length > 0) {
                      analysisText += `Becerileriniz: ${getSafeArray(processedAnalysis.skills).join(', ')}\n\n`;
                    }
                    
                    // Güçlü yönler
                    if (getSafeArray(processedAnalysis.strengths).length > 0) {
                      analysisText += `Güçlü yönleriniz: ${getSafeArray(processedAnalysis.strengths).join(', ')}\n\n`;
                    }
                    
                    // Zayıf yönler
                    if (getSafeArray(processedAnalysis.weaknesses).length > 0) {
                      analysisText += `Geliştirilebilecek alanlar: ${getSafeArray(processedAnalysis.weaknesses).join(', ')}\n\n`;
                    }
                    
                    // Öneriler
                    if (getSafeArray(processedAnalysis.recommendations).length > 0) {
                      analysisText += `Öneriler:\n- ${getSafeArray(processedAnalysis.recommendations).join('\n- ')}\n\n`;
                    }
                    
                    // Sektör uyumu
                    if (processedAnalysis.industryFit) {
                      analysisText += `Sektör uyumu: ${getSafeString(processedAnalysis.industryFit)}\n\n`;
                    }
                    
                    // Önerilen iş pozisyonları
                    if (getSafeArray(processedAnalysis.recommendedJobTitles).length > 0) {
                      analysisText += `Önerilen iş pozisyonları: ${getSafeArray(processedAnalysis.recommendedJobTitles).join(', ')}\n\n`;
                    }
                    
                    // Eksik beceriler
                    if (getSafeArray(processedAnalysis.skillGaps).length > 0) {
                      analysisText += `Geliştirilebilecek beceriler: ${getSafeArray(processedAnalysis.skillGaps).join(', ')}`;
                    }
                    
                    return analysisText || getSafeString(rawData);
                    
                    // Metni paragraflar halinde biçimlendir ve anahtar kelimeleri vurgula
                    return defaultText
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/\n/g, '<br/>')
                      .replace(/^/, '<p>')
                      .replace(/$/, '</p>')
                      .replace(/([\w\s]+):/g, '<span class="highlight">$1:</span>')
                      .replace(/(experience|expertise|skills|knowledge|proficient|advanced|expert|years|degree|education|certified|qualification)/gi, 
                        '<span class="highlight">$1</span>')
                      .replace(/(\d+%|\d+\s*[a-zA-Z]+|increased|improved|reduced|saved|generated)/gi, 
                        '<span class="achievement">$1</span>');
                  })()
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Pro Tip: {getSafeString(processedAnalysis.tips, 'Her iş başvurusunda özgeçmişinizi o pozisyona özel olarak düzenleyerek ilgili beceri ve deneyimlerinizi vurgulayın.')}
              </Typography>
            </Box>,
            '#93c5fd'
          )}
        </Grid>

        {/* Presentation Options (Spinner kaldırıldı) */}
        <Grid item xs={12}>
          {renderGlowingCard(
            'Presentation',
            <DownloadIcon color="secondary" />,
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<DownloadIcon />}>
                PDF olarak indir
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                DOCX olarak indir
              </Button>
            </Box>,
            '#f472b6'
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography 
        variant="h5" 
        component="h3" 
        gutterBottom
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          textAlign: 'center'
        }}
      >
        Matching Jobs
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => searchJobs()}
        disabled={loading}
        startIcon={<SearchIcon />}
        sx={{ 
          mt: 2, 
          display: 'block', 
          mx: 'auto',
          mb: 3 
        }}
      >
        {loading ? 'İş İlanları Aranıyor...' : 'Eşleşen İşleri Bul'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {jobs.length > 0 && (
        <JobListings 
          jobs={jobs} 
          loading={loading}
          onLoadMore={() => nextPageToken && searchJobs(nextPageToken)}
          hasMore={!!nextPageToken}
        />
      )}
    </Box>
  );
};

export default AnalysisResults;
