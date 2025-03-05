// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 120000, // Increase timeout to 2 minutes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  // Add retry logic
  retry: 3,
  retryDelay: 1000
});

// Add a retry interceptor
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  
  // Set the variable for tracking retry count
  config.__retryCount = config.__retryCount || 0;
  
  // Check if we've maxed out the total number of retries
  if (config.__retryCount >= config.retry) {
    // Reject with the error
    return Promise.reject(err);
  }
  
  // Increase the retry count
  config.__retryCount += 1;
  
  console.log(`Retrying request (${config.__retryCount}/${config.retry}): ${config.url}`);
  
  // Create new promise to handle exponential backoff
  const backoff = new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Retry #${config.__retryCount} after ${config.retryDelay}ms`);
      resolve();
    }, config.retryDelay || 1000);
  });
  
  // Return the promise in which recalls axios to retry the request
  await backoff;
  return api(config);
});

// Request interceptor
api.interceptors.request.use(
  config => {
    console.log('Request:', config.method.toUpperCase(), config.url);
    
    // JWT token varsa ekle
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    
    // Yanıt verilerini detaylı loglama (geliştirme modunda)
    if (process.env.NODE_ENV === 'development') {
      const data = response.data;
      
      // Veri boyutunu kontrol et ve çok büyükse kısalt
      const isLargeData = JSON.stringify(data).length > 1000;
      
      console.log('Response Data:', isLargeData 
        ? { 
            preview: JSON.stringify(data).substring(0, 500) + '... (truncated)',
            keys: Object.keys(data),
            type: Array.isArray(data) ? 'array' : typeof data,
            isEmpty: Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0
          } 
        : data
      );
      
      // Boş veya eksik veri kontrolü
      if (data === null || data === undefined) {
        console.warn('⚠️ API yanıtı boş (null/undefined):', response.config.url);
      } else if (
        (Array.isArray(data) && data.length === 0) || 
        (typeof data === 'object' && Object.keys(data).length === 0)
      ) {
        console.warn('⚠️ API yanıtı boş bir dizi veya nesne:', response.config.url);
      }
    }
    
    return response;
  },
  error => {
    if (error.response) {
      console.error('Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config.url,
        method: error.config.method.toUpperCase()
      });
      
      // Özel hata mesajları
      if (error.response.status === 500) {
        console.error('🔴 Sunucu hatası! Backend loglarını kontrol edin.');
      } else if (error.response.status === 404) {
        console.error('🔍 Kaynak bulunamadı! API endpoint doğru mu?');
      } else if (error.response.status === 401) {
        console.error('🔒 Yetkilendirme hatası! Oturum süresi dolmuş olabilir.');
      } else if (error.response.status === 400) {
        console.error('⚠️ Geçersiz istek! İstek parametreleri:', error.config.params || {}, 'İstek verisi:', error.config.data || {});
      }
    } else if (error.request) {
      console.error('Network Error:', error.message);
      console.error('🌐 Ağ hatası! Backend çalışıyor mu? CORS ayarları doğru mu?');
    } else {
      console.error('Error:', error.message);
    }
    
    // Hata detaylarını geliştirici konsoluna yazdır
    console.groupCollapsed('📋 Hata Detayları');
    console.log('Hata Mesajı:', error.message);
    console.log('İstek Yapılandırması:', error.config);
    if (error.response) {
      console.log('Yanıt Verileri:', error.response.data);
      console.log('Yanıt Başlıkları:', error.response.headers);
    }
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

// Yanıt doğrulama fonksiyonu
const validateResponse = (response, expectedKeys = []) => {
  // Yanıt boş mu kontrol et
  if (!response) {
    console.error('API yanıtı boş veya tanımsız:', response);
    throw new Error('API yanıtı boş veya tanımsız');
  }

  // Yanıt bir obje mi kontrol et
  if (typeof response !== 'object') {
    console.error('API yanıtı bir obje değil:', response);
    throw new Error('API yanıtı bir obje değil');
  }

  // Beklenen anahtarlar var mı kontrol et
  if (expectedKeys.length > 0) {
    const missingKeys = expectedKeys.filter(key => !response.hasOwnProperty(key));
    if (missingKeys.length > 0) {
      console.error(`API yanıtında eksik anahtarlar: ${missingKeys.join(', ')}`, response);
      throw new Error(`API yanıtında eksik anahtarlar: ${missingKeys.join(', ')}`);
    }
  }

  return response;
};

// Hem default export hem de named export olarak dışa aktar
export { api, validateResponse };
export default api; // Default export ekledik
