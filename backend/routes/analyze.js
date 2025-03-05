// backend/routes/analyze.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const router = express.Router();

// PDF'den metin çıkarma fonksiyonu
async function extractTextFromPDF(pdfPath) {
  try {
    console.log(`PDF dosyasından metin çıkarılıyor: ${pdfPath}`);
    
    // PDF dosyasını kontrol et
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF dosyası bulunamadı: ${pdfPath}`);
      throw new Error(`PDF dosyası bulunamadı: ${pdfPath}`);
    }
    
    // Dosya boyutunu kontrol et
    const stats = fs.statSync(pdfPath);
    console.log(`PDF dosya boyutu: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('PDF dosyası boş');
      throw new Error('PDF dosyası boş');
    }
    
    // PDF'yi oku
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // PDF parse seçenekleri
    const options = {
      max: 10, // Maksimum sayfa sayısı
      version: 'v2.0.550'
    };
    
    // PDF'yi parse et
    const data = await pdfParse(dataBuffer, options);
    
    console.log(`PDF'den çıkarılan metin uzunluğu: ${data.text.length}`);
    console.log(`PDF'den çıkarılan metin örneği: ${data.text.substring(0, 100)}...`);
    
    // Metin boş mu kontrol et
    if (!data.text || data.text.trim().length === 0) {
      console.error('PDF dosyasından metin çıkarılamadı veya metin boş');
      throw new Error('PDF dosyasından metin çıkarılamadı veya metin boş');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF metin çıkarma hatası:', error);
    
    // Daha açıklayıcı hata mesajı
    if (error.message.includes('file ended prematurely')) {
      throw new Error('PDF dosyası bozuk veya eksik');
    } else if (error.message.includes('not a PDF file')) {
      throw new Error('Dosya geçerli bir PDF formatında değil');
    } else {
      throw new Error(`PDF'den metin çıkarılamadı: ${error.message}`);
    }
  }
}

// POST /api/analyze
router.post('/', async (req, res) => {
  try {
    const { filePath } = req.body;

    console.log('Analiz isteği alındı, filePath:', filePath);

    if (!filePath) {
      console.error('Dosya yolu sağlanmadı');
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    // Dosya yolunu işle
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    console.log('Uploads dizini:', uploadsDir);
    
    // filePath doğrudan dosya adı olarak kabul et
    const fileName = filePath;
    console.log('Kullanılacak dosya adı:', fileName);
    
    // Tam yolu oluştur
    const fullPath = path.join(uploadsDir, fileName);
    console.log('İşlenen tam dosya yolu:', fullPath);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(fullPath)) {
      console.error(`Dosya bulunamadı: ${fullPath}`);
      
      // Debug: uploads dizinindeki dosyaları listele
      const files = fs.readdirSync(uploadsDir);
      console.log('Uploads dizinindeki dosyalar:', files);
      
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Dosyadan metin çıkar
    console.log('Dosyadan metin çıkarılıyor...');
    const resumeText = await extractTextFromPDF(fullPath);
    console.log(`Çıkarılan metin uzunluğu: ${resumeText.length} karakter`);
    
    // Metin uzunluğunu kontrol et ve gerekirse kısalt
    const maxLength = 4000;
    const truncatedText = resumeText.length > maxLength 
      ? resumeText.substring(0, maxLength) 
      : resumeText;
    
    console.log(`Truncated text length: ${truncatedText.length}`);
    console.log(`Resume text sample: \n${truncatedText.substring(0, 200)}...`);
    
    // API çağrılarını dene
    console.log('Attempting to analyze resume with available APIs');
    
    let analysisResult = null;
    let errors = [];
    
    // DeepSeek API'yi dene
    if (process.env.DEEPSEEK_REASONER_API) {
      try {
        console.log('Using DeepSeek API for analysis');
        analysisResult = await callDeepSeekAPI(truncatedText);
        console.log('DeepSeek API response received successfully');
        return res.json(analysisResult);
      } catch (deepseekError) {
        console.error('DeepSeek API failed:', deepseekError.message);
        errors.push({ api: 'DeepSeek', error: deepseekError.message });
      }
    } else {
      console.log('DeepSeek API key not configured, skipping');
    }
    
    // OpenAI API'yi dene
    if (!analysisResult && process.env.OPENAI_API_KEY) {
      try {
        console.log('Falling back to OpenAI API');
        analysisResult = await callOpenAIAPI(truncatedText);
        console.log('OpenAI API response received successfully');
        return res.json(analysisResult);
      } catch (openaiError) {
        console.error('OpenAI API failed:', openaiError.message);
        errors.push({ api: 'OpenAI', error: openaiError.message });
      }
    } else if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, skipping');
    }
    
    // Eğer hiçbir API çalışmazsa, hata döndür
    if (!analysisResult) {
      console.log('All APIs failed, returning error');
      return res.status(500).json({ error: 'Failed to analyze resume with available APIs. Please try again later.' });
    }
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    return res.status(500).json({ error: error.message });
  }
});

// OpenAI API çağrısı için yardımcı fonksiyon
async function callOpenAIAPI(resumeText) {
  console.log('Preparing OpenAI API call...');
  
  // API anahtarını kontrol et
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key is not configured');
    throw new Error('OpenAI API key is not configured');
  }
  
  // Sistem mesajını hazırla
  const systemMessage = {
    role: "system",
    content: `You are an experienced HR professional and career consultant. Analyze the given resume thoroughly and provide a comprehensive response in English only. Your analysis should be detailed, insightful, and actionable.

    Respond in the following JSON format:
    {
      "summary": "// A comprehensive executive summary (at least 300 words) highlighting the candidate's background, key qualifications, notable achievements, and overall career trajectory. Be specific and detailed, mentioning actual metrics and accomplishments from the resume.",
      
      "strengths": [
        // At least 7 strengths with detailed explanations and specific examples from the resume
        "Strong analytical skills - Proven in data science projects with measurable outcomes such as X",
        "Technical expertise - Comprehensive experience in Python, SQL with specific applications"
      ],
      
      "areasToImprove": [
        // 4-5 areas for improvement with constructive and specific suggestions
        "Management experience - Can gain more experience in team leadership roles by pursuing X",
        "Industry diversity - Can take on projects in different industries such as Y and Z"
      ],
      
      "personalSkills": [
        // At least 10 technical and personal skills with level (Beginner/Intermediate/Advanced/Expert) and specific experience
        "Python (Advanced) - NumPy, Pandas, Scikit-learn with 5+ years experience",
        "Data Analysis (Expert) - Statistical analysis, forecasting, A/B testing"
      ],
      
      "detailedAnalysis": {
        "professionalProfile": "// 300-400 word detailed profile summary including experience, achievements, career goals, and unique value proposition. Be specific about the candidate's professional journey, highlighting transitions, growth, and specializations.",
        
        "keyAchievements": [
          // At least 7 concrete achievements with specific metrics and impact
          "Increased average order size by 7% with recommendation engine, resulting in $1.2M additional annual revenue",
          "Improved operational efficiency by 30% with machine learning model, reducing processing time from 3 days to 1"
        ],
        
        "industryFit": [
          // At least 7 suitable industry and role suggestions with detailed rationale
          "Fintech - Ideal for data analysis and forecasting experience, particularly the work with financial datasets and predictive models",
          "E-commerce - Valuable customer analysis and segmentation expertise demonstrated in previous retail analytics projects"
        ],
        
        "recommendedJobTitles": [
          // 7-8 most suitable job titles based on resume with brief explanation
          "Senior Data Scientist - Well-aligned with statistical analysis background and machine learning expertise",
          "Machine Learning Engineer - Matches programming skills and algorithm development experience"
        ],
        
        "skillGaps": [
          // 5-6 skills that might be needed for target roles with specific recommendations
          "Cloud Computing - AWS certification recommended, particularly Solutions Architect or Machine Learning Specialty",
          "Deep Learning - Neural Networks experience can be enhanced through projects with TensorFlow or PyTorch"
        ]
      }
    }
    
    IMPORTANT: Your response MUST be a valid JSON object. Do not include any text outside the JSON structure. Do not include markdown formatting, explanations, or any other content outside the JSON object.
    
    IMPORTANT: Analyze the resume content carefully and extract the actual education, skills, and experience from the document. Do not make assumptions or use generic responses. The job titles and industry recommendations should be directly based on the resume content.
    
    IMPORTANT: ALL content must be in ENGLISH only. Do not use any other language in your response.
    
    IMPORTANT: Be specific and detailed in your analysis. Include actual metrics, project names, technologies, and other concrete details from the resume whenever possible.`
  };

  // API çağrısı için model seçimi
  const model = process.env.USE_GPT4 === 'true' ? "gpt-4" : "gpt-3.5-turbo";
  console.log(`Using OpenAI model: ${model}`);
  
  // Özgeçmiş metnini kısalt (çok uzunsa)
  const maxTextLength = 3000;
  const truncatedResumeText = resumeText.length > maxTextLength 
    ? resumeText.substring(0, maxTextLength) + "..." 
    : resumeText;
  
  console.log(`Resume text length for OpenAI API: ${truncatedResumeText.length} characters`);
  
  try {
    // API isteği gönder
    console.log('Sending request to OpenAI API...');
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [systemMessage, {
          role: "user",
          content: `Please analyze this resume thoroughly and provide a detailed analysis in English only. Return your analysis in JSON format as specified: ${truncatedResumeText}`
        }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        timeout: 120000 // 120 saniye timeout (2 dakika)
      }
    );
    
    // Yanıtı kontrol et
    if (!openaiResponse.data || !openaiResponse.data.choices || !openaiResponse.data.choices[0]) {
      console.error('Invalid response from OpenAI API:', openaiResponse.data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    // Yanıtı işle
    const analysis = openaiResponse.data.choices[0].message.content;
    console.log('OpenAI API response received, length:', analysis.length);
    console.log('OpenAI API response sample:', analysis.substring(0, 100) + '...');
    
    return processAPIResponse(analysis);
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    
    if (error.response) {
      console.error('OpenAI API response error:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.data.error || 'Unknown error'}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('OpenAI API timeout - request took too long');
    } else if (error.request) {
      throw new Error('No response from OpenAI API');
    } else {
      throw error;
    }
  }
}

// DeepSeek API çağrısı
async function callDeepSeekAPI(resumeText) {
  console.log('Calling DeepSeek API...');
  
  const apiKey = process.env.DEEPSEEK_REASONER_API;
  if (!apiKey) {
    throw new Error('DEEPSEEK_REASONER_API key is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-reasoner",
        messages: [
          {
            role: "system",
            content: `You are a professional resume analyst. Analyze the given resume thoroughly and provide a comprehensive response in ENGLISH ONLY. Your analysis should be detailed, insightful, and actionable.

Respond in the following JSON format:
{
  "summary": "A comprehensive executive summary (at least 300 words) highlighting the candidate's background, key qualifications, notable achievements, and overall career trajectory.",
  "professionalProfile": "Detailed professional profile (300-400 words) including experience, achievements, and career goals",
  "keySkills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Area to improve 1", "Area to improve 2", ...],
  "resumeScore": 85, // Score from 0-100
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "keyAchievements": "Candidate's key achievements (detailed paragraph)",
  "industryFit": "Industries the candidate is well-suited for with detailed explanation",
  "recommendedJobTitles": ["Recommended position 1", "Recommended position 2", ...],
  "skillGaps": ["Missing skill 1", "Missing skill 2", ...]
}

IMPORTANT: Your response MUST be a valid JSON object. Do not include any text outside the JSON structure.
IMPORTANT: ALL content must be in ENGLISH only. Do not use any other language in your response.
IMPORTANT: Be specific and detailed in your analysis. Include actual metrics, project names, technologies, and other concrete details from the resume whenever possible.`
          },
          {
            role: "user",
            content: resumeText
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 // 60 saniye timeout
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('Invalid response from DeepSeek API:', response.data);
      throw new Error('Invalid response from DeepSeek API');
    }

    const content = response.data.choices[0].message.content;
    
    try {
      // JSON yanıtını ayrıştır
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON response not found in API response');
      }
      
      const jsonContent = jsonMatch[0];
      const parsedResult = JSON.parse(jsonContent);
      
      return parsedResult;
    } catch (parseError) {
      console.error('Error parsing DeepSeek API response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse DeepSeek API response');
    }
  } catch (error) {
    console.error('DeepSeek API error:', error.message);
    
    if (error.response) {
      console.error('DeepSeek API response error:', error.response.data);
      throw new Error(`DeepSeek API error: ${error.response.data.error || 'Unknown error'}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('DeepSeek API timeout');
    } else if (error.request) {
      throw new Error('No response from DeepSeek API');
    } else {
      throw error;
    }
  }
}

// API yanıtını işle
const processAPIResponse = (data) => {
  try {
    // Veri zaten bir obje ise doğrudan kullan
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // Veri bir string ise JSON olarak parse et
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error('Error parsing API response as JSON:', parseError);
        
        // JSON parse edilemezse, metin içindeki JSON'u bulmaya çalış
        const jsonMatch = data.match(/```json\n([\s\S]*?)\n```/) || 
                         data.match(/{[\s\S]*}/);
        
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch (nestedParseError) {
            console.error('Error parsing extracted JSON:', nestedParseError);
          }
        }
      }
    }
    
    // Hiçbir şekilde parse edilemezse, basit bir obje döndür
    console.warn('Could not parse API response, returning simplified object');
    return {
      professionalProfile: typeof data === 'string' ? data : 'Could not analyze resume',
      keySkills: [],
      strengths: [],
      weaknesses: [],
      recommendedJobTitles: [],
      resumeScore: 50
    };
  } catch (error) {
    console.error('Error processing API response:', error);
    return {
      error: 'Failed to process API response',
      message: error.message
    };
  }
};

// Basit metin analizi yapan fonksiyon
function createBasicAnalysis(resumeText) {
  console.log('Creating basic analysis from resume text');
  
  // Metin içinde anahtar kelimeleri ara
  const skills = extractSkills(resumeText);
  const education = extractEducation(resumeText);
  const experience = extractExperience(resumeText);
  const achievements = extractAchievements(resumeText);
  const industries = extractIndustries(resumeText);
  const jobTitles = extractJobTitles(resumeText, skills);
  const skillGaps = generateSkillGaps(skills, jobTitles);
  
  // Özgeçmiş puanını hesapla
  const resumeScore = calculateResumeScore({
    skills,
    education,
    experience,
    achievements,
    textLength: resumeText.length
  });
  
  // Profesyonel profil oluştur
  const professionalProfile = generateProfessionalProfile(resumeText, {
    skills,
    education,
    experience,
    industries
  });
  
  // Güçlü yönleri belirle
  const strengths = determineStrengths(resumeText, {
    skills,
    education,
    experience,
    achievements
  });
  
  // Zayıf yönleri belirle
  const weaknesses = determineWeaknesses(resumeText, {
    skills,
    education,
    experience,
    achievements
  });
  
  // Önerileri belirle
  const recommendations = generateRecommendations(weaknesses);
  
  // Basit bir analiz objesi oluştur
  return {
    professionalProfile,
    keySkills: skills,
    strengths,
    weaknesses,
    resumeScore,
    recommendations,
    keyAchievements: achievements.length > 0 
      ? achievements.join(". ") 
      : "Özgeçmişinizden önemli başarılar çıkarılamadı. Lütfen özgeçmişinize somut başarılarınızı ekleyin.",
    industryFit: industries.length > 0 
      ? `Özgeçmişiniz şu sektörlere uygun görünüyor: ${industries.join(", ")}` 
      : "Özgeçmişiniz genel olarak profesyonel bir profil gösteriyor.",
    recommendedJobTitles: jobTitles,
    skillGaps
  };
}

// Özgeçmiş puanını hesaplayan fonksiyon
function calculateResumeScore({ skills, education, experience, achievements, textLength }) {
  let score = 50; // Başlangıç puanı
  
  // Beceri sayısına göre puan ekle (max 15 puan)
  score += Math.min(skills.length * 2, 15);
  
  // Eğitim durumuna göre puan ekle
  if (education) score += 10;
  
  // Deneyim durumuna göre puan ekle
  if (experience) score += 10;
  
  // Başarı sayısına göre puan ekle (max 10 puan)
  score += Math.min(achievements.length * 2, 10);
  
  // Özgeçmiş uzunluğuna göre puan ekle (max 5 puan)
  score += Math.min(Math.floor(textLength / 500), 5);
  
  // Puanı 0-100 aralığında sınırla
  return Math.max(0, Math.min(100, score));
}

// Profesyonel profil oluşturan fonksiyon
function generateProfessionalProfile(text, { skills, education, experience, industries }) {
  let profile = "Özgeçmişiniz analiz edildi. ";
  
  if (skills.length > 0) {
    profile += `${skills.slice(0, 3).join(", ")} gibi becerilere sahip bir profesyonel olarak görünüyorsunuz. `;
  }
  
  if (experience) {
    profile += "Profesyonel iş deneyiminiz özgeçmişinizde belirtilmiş. ";
  }
  
  if (education) {
    profile += "Eğitim geçmişiniz özgeçmişinizde yer alıyor. ";
  }
  
  if (industries.length > 0) {
    profile += `Özgeçmişiniz ${industries.join(", ")} sektörlerinde deneyim gösteriyor. `;
  }
  
  profile += "Daha detaylı bir analiz için özgeçmişinizi güncelleyerek tekrar deneyebilirsiniz.";
  
  return profile;
}

// Güçlü yönleri belirleyen fonksiyon
function determineStrengths(text, { skills, education, experience, achievements }) {
  const strengths = [];
  
  if (skills.length >= 5) {
    strengths.push("Geniş beceri seti");
  }
  
  if (skills.length > 0) {
    strengths.push(`${skills[0]} alanında uzmanlık`);
  }
  
  if (education) {
    strengths.push("Eğitim geçmişi");
  }
  
  if (experience) {
    strengths.push("Profesyonel deneyim");
  }
  
  if (achievements.length > 0) {
    strengths.push("Kanıtlanmış başarılar");
  }
  
  // Eğer hiç güçlü yön bulunamazsa, varsayılan değerler ekle
  if (strengths.length === 0) {
    strengths.push(
      "Özgeçmişinizde belirtilen beceriler",
      "Profesyonel yaklaşım",
      "Kendini ifade etme yeteneği"
    );
  }
  
  return strengths;
}

// Zayıf yönleri belirleyen fonksiyon
function determineWeaknesses(text, { skills, education, experience, achievements }) {
  const weaknesses = [];
  
  if (skills.length < 5) {
    weaknesses.push("Sınırlı beceri seti");
  }
  
  if (!education) {
    weaknesses.push("Eğitim bilgileri eksik veya yetersiz");
  }
  
  if (!experience) {
    weaknesses.push("İş deneyimi eksik veya yetersiz");
  }
  
  if (achievements.length === 0) {
    weaknesses.push("Somut başarılar belirtilmemiş");
  }
  
  if (text.length < 1000) {
    weaknesses.push("Özgeçmiş içeriği kısa ve yetersiz");
  }
  
  // Eğer hiç zayıf yön bulunamazsa, varsayılan değerler ekle
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Özgeçmişiniz daha fazla nicel sonuç içerebilir",
      "Başarılarınızı daha detaylı anlatabilirsiniz",
      "Sektöre özel anahtar kelimeler ekleyebilirsiniz"
    );
  }
  
  return weaknesses;
}

// Önerileri oluşturan fonksiyon
function generateRecommendations(weaknesses) {
  const recommendationMap = {
    "Sınırlı beceri seti": "Özgeçmişinize daha fazla teknik ve kişisel beceri ekleyin",
    "Eğitim bilgileri eksik veya yetersiz": "Eğitim bilgilerinizi detaylandırın ve ilgili kursları ekleyin",
    "İş deneyimi eksik veya yetersiz": "İş deneyimlerinizi kronolojik sırayla ve detaylı olarak belirtin",
    "Somut başarılar belirtilmemiş": "Her iş deneyiminiz için ölçülebilir başarılar ekleyin",
    "Özgeçmiş içeriği kısa ve yetersiz": "Özgeçmişinizi daha kapsamlı hale getirin"
  };
  
  // Zayıf yönlere göre öneriler oluştur
  const recommendations = weaknesses.map(weakness => 
    recommendationMap[weakness] || `${weakness} konusunda gelişim sağlayın`
  );
  
  // Eğer hiç öneri yoksa, varsayılan öneriler ekle
  if (recommendations.length === 0) {
    return [
      "Özgeçmişinize nicel başarılar ekleyin",
      "Becerilerinizi daha detaylı açıklayın",
      "Her iş deneyiminiz için somut sonuçlar belirtin"
    ];
  }
  
  return recommendations;
}

// Metinden başarıları çıkaran yardımcı fonksiyon
function extractAchievements(text) {
  // Başarı ile ilgili anahtar kelimeler
  const achievementKeywords = [
    'achieved', 'improved', 'increased', 'decreased', 'reduced', 'saved',
    'developed', 'created', 'implemented', 'launched', 'led', 'managed',
    'award', 'recognition', 'certificate', 'honor', 'prize', 'scholarship',
    'başarı', 'geliştirdi', 'artırdı', 'azalttı', 'tasarruf', 'ödül', 'sertifika'
  ];
  
  // Metni cümlelere böl
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Başarı içeren cümleleri bul
  const achievementSentences = sentences.filter(sentence => 
    achievementKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  // En fazla 5 başarı cümlesi döndür
  return achievementSentences.slice(0, 5);
}

// Metinden sektörleri çıkaran yardımcı fonksiyon
function extractIndustries(text) {
  // Yaygın sektör anahtar kelimeleri
  const industryKeywords = [
    'Technology', 'IT', 'Software', 'Healthcare', 'Finance', 'Banking',
    'Education', 'Manufacturing', 'Retail', 'E-commerce', 'Marketing',
    'Advertising', 'Media', 'Entertainment', 'Hospitality', 'Tourism',
    'Construction', 'Real Estate', 'Automotive', 'Aerospace', 'Energy',
    'Telecommunications', 'Consulting', 'Legal', 'Government', 'Non-profit',
    'Teknoloji', 'Yazılım', 'Sağlık', 'Finans', 'Bankacılık', 'Eğitim',
    'Üretim', 'Perakende', 'E-ticaret', 'Pazarlama', 'Reklam', 'Medya',
    'Eğlence', 'Turizm', 'İnşaat', 'Otomotiv', 'Enerji', 'Telekomünikasyon',
    'Danışmanlık', 'Hukuk', 'Kamu', 'Sivil Toplum'
  ];
  
  // Metni küçük harfe çevir ve her sektörü kontrol et
  const lowerText = text.toLowerCase();
  const foundIndustries = industryKeywords.filter(industry => 
    lowerText.includes(industry.toLowerCase())
  );
  
  // En fazla 3 sektör döndür
  return foundIndustries.slice(0, 3);
}

// Beceri açıklarını oluşturan fonksiyon
function generateSkillGaps(skills, jobTitles) {
  // Yaygın iş unvanları için gerekli beceriler
  const jobSkillsMap = {
    'Software Developer': ['JavaScript', 'Python', 'Java', 'C#', 'Git', 'Agile'],
    'Software Engineer': ['Data Structures', 'Algorithms', 'System Design', 'CI/CD'],
    'Web Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Node.js'],
    'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'UI/UX'],
    'Full Stack Developer': ['Frontend', 'Backend', 'Database', 'API Design'],
    'Data Analyst': ['SQL', 'Excel', 'Data Visualization', 'Statistics'],
    'Data Engineer': ['SQL', 'ETL', 'Data Warehousing', 'Big Data'],
    'Database Administrator': ['SQL', 'Database Design', 'Performance Tuning'],
    'Project Manager': ['Project Management', 'Agile', 'Scrum', 'Leadership'],
    'Business Analyst': ['Requirements Analysis', 'Process Modeling', 'Documentation'],
    'Marketing Specialist': ['Digital Marketing', 'SEO', 'Content Marketing'],
    'Administrative Assistant': ['Microsoft Office', 'Organization', 'Communication'],
    'Customer Service Representative': ['Communication', 'Problem Solving', 'Patience']
  };
  
  // Mevcut becerileri küçük harfe çevir
  const lowerSkills = skills.map(skill => skill.toLowerCase());
  
  // İş unvanlarına göre gerekli becerileri belirle
  let requiredSkills = new Set();
  jobTitles.forEach(title => {
    const skillsForJob = jobSkillsMap[title] || [];
    skillsForJob.forEach(skill => requiredSkills.add(skill));
  });
  
  // Eksik becerileri bul
  const missingSkills = Array.from(requiredSkills).filter(skill => 
    !lowerSkills.includes(skill.toLowerCase())
  );
  
  // Eğer hiç eksik beceri bulunamazsa, varsayılan değerler döndür
  if (missingSkills.length === 0) {
    return [
      "Sektöre özel sertifikalar",
      "Liderlik deneyimi",
      "Proje yönetimi becerileri"
    ];
  }
  
  // En fazla 5 eksik beceri döndür
  return missingSkills.slice(0, 5);
}

// Metinden becerileri çıkaran yardımcı fonksiyon
function extractSkills(text) {
  // Yaygın beceri anahtar kelimeleri
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'SQL', 'NoSQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', 'Firebase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub',
    'Machine Learning', 'AI', 'Data Science', 'Big Data', 'Data Analysis',
    'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence',
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Outlook',
    'Marketing', 'Sales', 'Customer Service', 'SEO', 'SEM', 'Content Marketing',
    'Accounting', 'Finance', 'Budgeting', 'Forecasting', 'Financial Analysis',
    'HR', 'Recruitment', 'Talent Management', 'Employee Relations', 'Training'
  ];
  
  // Metni küçük harfe çevir ve her kelimeyi kontrol et
  const lowerText = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => 
    lowerText.includes(skill.toLowerCase())
  );
  
  // Eğer hiç beceri bulunamazsa, genel beceriler döndür
  if (foundSkills.length === 0) {
    return ['İletişim', 'Problem Çözme', 'Takım Çalışması', 'Analitik Düşünme', 'Organizasyon'];
  }
  
  return foundSkills.slice(0, 10); // En fazla 10 beceri döndür
}

// Metinden eğitim bilgilerini çıkaran yardımcı fonksiyon
function extractEducation(text) {
  // Eğitim ile ilgili anahtar kelimeler
  const educationKeywords = [
    'Bachelor', 'Master', 'PhD', 'Doctorate', 'BSc', 'MSc', 'BA', 'MA', 'MBA',
    'University', 'College', 'School', 'Institute', 'Academy',
    'Degree', 'Diploma', 'Certificate', 'Certification', 'Graduate', 'Undergraduate',
    'Lisans', 'Yüksek Lisans', 'Doktora', 'Üniversite', 'Okul', 'Mezun'
  ];
  
  // Metinde eğitim anahtar kelimeleri ara
  const hasEducation = educationKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return hasEducation;
}

// Metinden deneyim bilgilerini çıkaran yardımcı fonksiyon
function extractExperience(text) {
  // Deneyim ile ilgili anahtar kelimeler
  const experienceKeywords = [
    'Experience', 'Work', 'Job', 'Career', 'Employment', 'Position', 'Role',
    'Manager', 'Director', 'Lead', 'Senior', 'Junior', 'Intern', 'Specialist',
    'Coordinator', 'Supervisor', 'Assistant', 'Associate', 'Consultant',
    'Deneyim', 'İş', 'Kariyer', 'Pozisyon', 'Rol', 'Yönetici', 'Direktör', 'Lider'
  ];
  
  // Metinde deneyim anahtar kelimeleri ara
  const hasExperience = experienceKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return hasExperience;
}

// Metinden ve becerilerden iş unvanları çıkaran yardımcı fonksiyon
function extractJobTitles(text, skills) {
  // Yaygın iş unvanları
  const commonTitles = [
    'Software Engineer', 'Software Developer', 'Web Developer', 'Frontend Developer',
    'Backend Developer', 'Full Stack Developer', 'Mobile Developer', 'iOS Developer',
    'Android Developer', 'Data Scientist', 'Data Analyst', 'Business Analyst',
    'Product Manager', 'Project Manager', 'Scrum Master', 'DevOps Engineer',
    'System Administrator', 'Network Engineer', 'Cloud Engineer', 'Security Engineer',
    'QA Engineer', 'Test Engineer', 'UX Designer', 'UI Designer', 'Graphic Designer',
    'Marketing Manager', 'Sales Manager', 'Account Manager', 'Customer Success Manager',
    'HR Manager', 'Recruiter', 'Financial Analyst', 'Accountant', 'Content Writer'
  ];
  
  // Beceriler ve metin içeriğine göre uygun iş unvanlarını belirle
  let recommendedTitles = [];
  
  // Programlama dilleri ve teknolojiler
  const techSkills = ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin'];
  const webSkills = ['React', 'Angular', 'Vue', 'HTML', 'CSS', 'Node.js', 'Express', 'Django', 'Flask'];
  const dataSkills = ['SQL', 'NoSQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Data Analysis', 'Machine Learning', 'AI'];
  
  // Becerilere göre iş unvanları öner
  const foundTechSkills = skills.filter(skill => techSkills.includes(skill));
  const foundWebSkills = skills.filter(skill => webSkills.includes(skill));
  const foundDataSkills = skills.filter(skill => dataSkills.includes(skill));
  
  if (foundTechSkills.length > 0) {
    recommendedTitles.push('Software Developer', 'Software Engineer');
  }
  
  if (foundWebSkills.length > 0) {
    recommendedTitles.push('Web Developer', 'Frontend Developer', 'Full Stack Developer');
  }
  
  if (foundDataSkills.length > 0) {
    recommendedTitles.push('Data Analyst', 'Database Administrator', 'Data Engineer');
  }
  
  // Eğer hiç uygun unvan bulunamazsa, genel unvanlar öner
  if (recommendedTitles.length === 0) {
    recommendedTitles = [
      'Project Manager',
      'Business Analyst',
      'Marketing Specialist',
      'Administrative Assistant',
      'Customer Service Representative'
    ];
  }
  
  // Tekrarlanan unvanları kaldır ve en fazla 5 unvan döndür
  return [...new Set(recommendedTitles)].slice(0, 5);
}

module.exports = router;
