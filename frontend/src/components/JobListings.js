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
  'Başvuruldu',
  'Değerlendiriliyor',
  'Mülakat',
  'Teklif',
  'Kabul Edildi',
  'Reddedildi',
  'İptal'
];

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

const JobListings = ({ jobs = [], onSearch, onApplicationSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Başvuruldu');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Kullanıcı pencereye geri döndüğünde başvuru diyaloğunu göster
  useEffect(() => {
    const handleWindowFocus = () => {
      const lastClickedJob = localStorage.getItem('lastClickedJob');
      if (lastClickedJob) {
        try {
          const job = JSON.parse(lastClickedJob);
          setSelectedJob(job);
          setDialogOpen(true);
          // İşlem tamamlandıktan sonra localStorage'ı temizle
          localStorage.removeItem('lastClickedJob');
        } catch (error) {
          console.error('Son tıklanan iş ilanı alınırken hata:', error);
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
          message: 'Başvuru bağlantısı bulunamadı!',
          severity: 'error'
        });
        return;
      }

      // URL'yi düzgün formatta hazırla
      let applicationUrl = job.url;
      
      // URL'nin geçerli olup olmadığını kontrol et
      try {
        // URL'yi doğru formata getir
        if (!applicationUrl.startsWith('http://') && !applicationUrl.startsWith('https://')) {
          applicationUrl = 'https://' + applicationUrl;
        }
        
        // URL'yi doğrula
        new URL(applicationUrl);
      } catch (urlError) {
        console.error('Geçersiz URL:', urlError);
        setSnackbar({
          open: true,
          message: 'Geçersiz başvuru bağlantısı!',
          severity: 'error'
        });
        return;
      }

      console.log('Açılacak URL:', applicationUrl);
      
      // İş ilanı tıklamasını takip et
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
      
      // Son tıklanan iş ilanını localStorage'a kaydet
      localStorage.setItem('lastClickedJob', JSON.stringify(job));
      
      // Başvuru bağlantısını yeni sekmede aç
      window.open(applicationUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Başvuru işlemi sırasında hata:', error);
      setSnackbar({
        open: true,
        message: 'Başvuru sırasında bir hata oluştu.',
        severity: 'error'
      });
    }
  };

  const handleSubmitApplication = async () => {
    try {
      if (!selectedJob?.id) {
        setSnackbar({
          open: true,
          message: 'İş ilanı bilgisi eksik!',
          severity: 'error'
        });
        return;
      }
      
      // İş başvuru durumunu güncelle
      const updateResponse = await api.put('/jobs/updateStatus', {
        jobId: selectedJob.id,
        status,
        notes
      });
      
      console.log('Status update response:', updateResponse.data);
      
      // Uygulama verilerini hazırla (eski applications API'si için)
      const applicationData = {
        job: {
          title: selectedJob?.title || 'Başlık Belirtilmemiş',
          company: selectedJob?.company || 'Şirket Belirtilmemiş',
          location: selectedJob?.location || 'Konum Belirtilmemiş',
          description: selectedJob?.description || '',
          salary: selectedJob?.salary || '',
          employmentType: selectedJob?.employmentType || '',
          applicationUrl: selectedJob?.url || ''
        },
        status,
        notes: notes ? [{ content: notes }] : []
      };

      console.log('Gönderilen uygulama verileri:', applicationData);

      // Eski API'yi de çağır (geriye dönük uyumluluk için)
      try {
        const response = await api.post('/applications', applicationData);
        console.log('Applications API yanıtı:', response.data);
        
        // Callback fonksiyonu varsa çağır
        if (onApplicationSubmit) {
          onApplicationSubmit(response.data);
        }
      } catch (appError) {
        console.error('Applications API hatası (önemli değil):', appError);
      }
      
      // Başarılı bildirim göster
      setSnackbar({
        open: true,
        message: 'Başvuru durumu başarıyla güncellendi!',
        severity: 'success'
      });

      // Dialog'u kapat
      handleCloseDialog();
    } catch (error) {
      console.error('Başvuru kaydedilirken hata oluştu:', error);
      
      // Hata mesajını göster
      setSnackbar({
        open: true,
        message: 'Başvuru kaydedilirken bir hata oluştu: ' + (error.response?.data?.error || error.message),
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedJob(null);
    setNotes('');
    setStatus('Başvuruldu');
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
        <DialogTitle>Başvuru Takibi</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
              {selectedJob?.title} pozisyonuna başvurdunuz mu? Başvurunuzu profilinizde takip etmek ister misiniz?
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>Pozisyon:</strong> {selectedJob?.title}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Şirket:</strong> {selectedJob?.company}
            </Typography>
            
            <TextField
              select
              fullWidth
              label="Başvuru Durumu"
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
              label="Notlar"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              placeholder="Başvurunuzla ilgili notlar ekleyin..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            İptal
          </Button>
          <Button 
            onClick={handleSubmitApplication} 
            variant="contained" 
            color="primary"
          >
            Başvuruyu Kaydet
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
