// frontend/src/services/api.js
import axios from 'axios';

// API URL'yi konsola yazdır (debug için)
// Make sure the API URL doesn't have a trailing slash
const apiUrl = (process.env.REACT_APP_API_URL || 'https://career-path.onrender.com/api').replace(/\/$/, '');
console.log('Using API URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  timeout: 120000, // Increase timeout to 2 minutes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false, // CORS sorunlarını önlemek için false yapıldı
  // Add retry logic
  retry: 3,
  retryDelay: 1000
});

// Log all requests in development and production
console.log('API Configuration:', {
  baseURL: apiUrl,
  withCredentials: false,
  timeout: 120000
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
      
      // Check for empty or missing data
      if (data === null || data === undefined) {
        console.warn('⚠️ API response is empty (null/undefined):', response.config.url);
      } else if (
        (Array.isArray(data) && data.length === 0) || 
        (typeof data === 'object' && Object.keys(data).length === 0)
      ) {
        console.warn('⚠️ API response is empty array or object:', response.config.url);
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
      
      // Custom error messages
      if (error.response.status === 500) {
        console.error('🔴 Server error! Check backend logs.');
      } else if (error.response.status === 404) {
        console.error('🔍 Resource not found! Is the API endpoint correct?');
      } else if (error.response.status === 401) {
        console.error('🔒 Authorization error! Session may have expired.');
      } else if (error.response.status === 400) {
        console.error('⚠️ Invalid request! Request parameters:', error.config.params || {}, 'Request data:', error.config.data || {});
      }
    } else if (error.request) {
      console.error('Network Error:', error.message);
      console.error('🌐 Network error! Is backend running? Are CORS settings correct?');
    } else {
      console.error('Error:', error.message);
    }
    
    // Print error details to developer console
    console.groupCollapsed('📋 Error Details');
    console.log('Error Message:', error.message);
    console.log('Request Configuration:', error.config);
    if (error.response) {
      console.log('Response Data:', error.response.data);
      console.log('Response Headers:', error.response.headers);
    }
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

// Yanıt doğrulama fonksiyonu
const validateResponse = (response, expectedKeys = []) => {
  // Yanıt boş mu kontrol et
  if (!response) {
    console.error('API response is empty or undefined:', response);
    throw new Error('API response is empty or undefined');
  }

  // Yanıt bir obje mi kontrol et
  if (typeof response !== 'object') {
    console.error('API response is not an object:', response);
    throw new Error('API response is not an object');
  }

  // Check if expected keys exist
  if (expectedKeys.length > 0) {
    const missingKeys = expectedKeys.filter(key => !response.hasOwnProperty(key));
    if (missingKeys.length > 0) {
      console.error(`API response missing keys: ${missingKeys.join(', ')}`, response);
      throw new Error(`API response missing keys: ${missingKeys.join(', ')}`);
    }
  }

  return response;
};

// Export both as default and named export
export { api, validateResponse };
export default api;
