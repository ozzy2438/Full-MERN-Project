const fs = require('fs');
const path = require('path');

console.log('PDF işleme için gerekli sembolik bağlantılar oluşturuluyor...');

// pdf-parse modülünün yolu
const pdfParsePath = path.join(__dirname, 'node_modules', 'pdf-parse');
// pdfjs-dist modülünün yolu
const pdfjsDistPath = path.join(__dirname, 'node_modules', 'pdfjs-dist');

// pdf.js dizini yolu
const pdfJsPath = path.join(pdfParsePath, 'pdf.js');
// v1.10.100 dizini yolu
const versionPath = path.join(pdfJsPath, 'v1.10.100');
// build dizini yolu
const buildLinkPath = path.join(versionPath, 'build');
// pdfjs-dist build dizini yolu
const pdfjsDistBuildPath = path.join(pdfjsDistPath, 'build');

// Dizinlerin var olup olmadığını kontrol et ve oluştur
try {
  if (!fs.existsSync(pdfJsPath)) {
    console.log(`${pdfJsPath} dizini oluşturuluyor...`);
    fs.mkdirSync(pdfJsPath, { recursive: true });
  }

  if (!fs.existsSync(versionPath)) {
    console.log(`${versionPath} dizini oluşturuluyor...`);
    fs.mkdirSync(versionPath, { recursive: true });
  }

  // Sembolik bağlantı var mı kontrol et
  if (fs.existsSync(buildLinkPath)) {
    console.log(`${buildLinkPath} sembolik bağlantısı zaten var.`);
  } else {
    // Sembolik bağlantı oluştur
    console.log(`${buildLinkPath} sembolik bağlantısı oluşturuluyor...`);
    
    // Windows ve diğer işletim sistemleri için farklı komutlar
    if (process.platform === 'win32') {
      // Windows için junction kullan
      fs.symlinkSync(pdfjsDistBuildPath, buildLinkPath, 'junction');
    } else {
      // Unix/Linux/MacOS için sembolik bağlantı kullan
      // Göreceli yol kullan
      const relativePath = path.relative(versionPath, pdfjsDistBuildPath);
      fs.symlinkSync(relativePath, buildLinkPath);
    }
    
    console.log('Sembolik bağlantı başarıyla oluşturuldu.');
  }

  console.log('PDF işleme için gerekli sembolik bağlantılar başarıyla oluşturuldu.');
} catch (error) {
  console.error('Sembolik bağlantı oluşturulurken hata oluştu:', error);
} 