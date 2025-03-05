// backend/routes/jobs.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/jobs - İş ilanlarını arama
router.get('/', async (req, res) => {
  try {
    const { query, analysis, page = 1, location } = req.query;
    
    // Jooble API anahtarını kontrol et
    const joobleApiKey = process.env.JOOBLE_API_KEY || '0b1d44cd-b23c-4bc2-8f0b-c4b17262f948';
    
    if (!joobleApiKey) {
      return res.status(500).json({ error: 'Jooble API key is not configured' });
    }

    // Varsayılan arama sorgusu
    let searchQuery = query || "software developer";
    let jobType = ""; // Varsayılan olarak tüm iş türleri
    let searchLocation = location || "";

    // Analiz verisi varsa, daha akıllı bir arama sorgusu oluştur
    if (analysis) {
      console.log('Raw analysis data:', analysis);
      
      try {
        const parsedAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
        
        // Önerilen iş başlıklarını çıkar
        const jobTitles = parsedAnalysis.recommendedJobTitles || 
                         parsedAnalysis.jobTitles || 
                         [];
        
        // Anahtar becerileri çıkar
        const skills = parsedAnalysis.keySkills || 
                      parsedAnalysis.skills || 
                      parsedAnalysis.personalSkills || 
                      parsedAnalysis.technicalSkills || 
                      [];
        
        // Sektör bilgisini çıkar
        const industry = parsedAnalysis.industryFit || 
                        parsedAnalysis.industry || 
                        '';
        
        console.log('Parsed data:', {
          jobTitles,
          skills,
          industry
        });
        
        // Arama sorgusunu oluştur
        if (jobTitles.length > 0) {
          // İlk 2 önerilen iş başlığını kullan
          const primaryJobTitles = jobTitles.slice(0, 2);
          
          // Anahtar becerilerden en önemli 3 tanesini seç
          const topSkills = skills.slice(0, 3);
          
          // Arama sorgusunu oluştur
          searchQuery = primaryJobTitles.join(' ');
          
          // Becerileri ekle
          if (topSkills.length > 0) {
            searchQuery += ` ${topSkills.join(' ')}`;
          }
          
          console.log('Generated search query:', searchQuery);
        }
      } catch (parseError) {
        console.error('Error parsing analysis data:', parseError);
        // Analiz verisi ayrıştırılamazsa, varsayılan sorguyu kullan
      }
    }

    console.log('Final search query:', searchQuery);
    console.log('Location:', searchLocation);

    // Jooble API'ye istek gönder
    console.log('Sending request to Jooble API...');
    const joobleResponse = await axios.post(
      `https://jooble.org/api/${joobleApiKey}`,
      {
        keywords: searchQuery,
        location: searchLocation,
        page: page
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 saniye timeout
      }
    );

    // Yanıt kontrolü
    if (!joobleResponse.data || !joobleResponse.data.jobs) {
      console.error('Invalid response from Jooble API:', joobleResponse.data);
      return res.status(500).json({ error: 'Invalid response from Jooble API' });
    }

    // İş ilanlarını işle
    const jobs = joobleResponse.data.jobs.map(job => ({
      id: job.id || `jooble-${Math.random().toString(36).substring(7)}`,
      title: job.title || 'No Title',
      company: job.company || 'Company not specified',
      location: job.location || 'Location not specified',
      description: job.snippet || job.description || '',
      url: job.link || '',
      salary: job.salary || null,
      employmentType: job.type || null,
      highlights: job.snippet ? [{ title: 'Description', items: [job.snippet] }] : []
    }));
    
    const totalResults = joobleResponse.data.totalCount || jobs.length;
    
    console.log(`Jooble API returned ${jobs.length} jobs`);

    // Yanıtı döndür
    return res.json({
      jobs,
      totalResults,
      currentPage: page,
      searchQuery,
      apiUsed: 'Jooble'
    });

  } catch (error) {
    console.error('Error fetching job listings:', error.message);
    
    if (error.response) {
      console.error('Jooble API response error:', error.response.data);
      return res.status(error.response.status || 500).json({ 
        error: `Error from Jooble API: ${error.response.data?.error || error.response.data || 'Unknown error'}` 
      });
    } else if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Jooble API timeout' });
    } else if (error.request) {
      return res.status(500).json({ error: 'No response from Jooble API' });
    } else {
      return res.status(500).json({ error: `Error fetching job listings: ${error.message}` });
    }
  }
});

// POST /api/jobs/trackClick - İş ilanı tıklamalarını takip et
router.post('/trackClick', async (req, res) => {
  try {
    const { jobId, jobTitle, jobCompany, jobUrl } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    console.log('Job click tracked:', {
      jobId,
      jobTitle,
      jobCompany,
      jobUrl,
      timestamp: new Date().toISOString()
    });
    
    // Burada veritabanına kayıt yapılabilir
    
    return res.json({ success: true, message: 'Job click tracked successfully' });
  } catch (error) {
    console.error('Error tracking job click:', error.message);
    return res.status(500).json({ error: `Error tracking job click: ${error.message}` });
  }
});

// PUT /api/jobs/updateStatus - İş başvuru durumunu güncelle
router.put('/updateStatus', async (req, res) => {
  try {
    const { jobId, status, notes } = req.body;
    
    if (!jobId || !status) {
      return res.status(400).json({ error: 'Job ID and status are required' });
    }
    
    console.log('Job application status updated:', {
      jobId,
      status,
      notes,
      timestamp: new Date().toISOString()
    });
    
    // Burada veritabanına kayıt yapılabilir
    
    return res.json({ success: true, message: 'Job application status updated successfully' });
  } catch (error) {
    console.error('Error updating job application status:', error.message);
    return res.status(500).json({ error: `Error updating job application status: ${error.message}` });
  }
});

module.exports = router;
