// Added wrapper for portfolio upload preview + localStorage key
(function(){
  const SCREENSHOT_KEY = 'portfolio_image';
  function el(id){ return document.getElementById(id); }

  function showImportStatus(msg){ const s = el('import-status'); if(s) s.textContent = msg; }

  function showPortfolioImage(dataUrl){ const preview = el('preview'); if(!preview) return; let img = el('portfolio-preview'); if(!img){ img = document.createElement('img'); img.id = 'portfolio-preview'; img.alt = 'Portfolio screenshot'; img.style.maxWidth='100%'; img.style.height='auto'; preview.innerHTML=''; preview.appendChild(img); } img.src = dataUrl; }

  function handlePortfolioUpload(event){ const file = event && event.target && event.target.files ? event.target.files[0] : null; if(!file) return; if(!file.type || !file.type.startsWith('image/')){ console.error('Selected file is not an image'); showImportStatus('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = function(){ try{ const dataUrl = reader.result; try{ localStorage.setItem(SCREENSHOT_KEY, dataUrl); }catch(err){ console.warn('localStorage.setItem failed', err); showImportStatus('Unable to save image locally'); return; }
        showPortfolioImage(dataUrl); showImportStatus('Image saved — Ready for OCR'); const ocrStatus = el('ocr-status'); if(ocrStatus) ocrStatus.textContent = 'OCR: ready'; }catch(err){ console.error('Failed to handle portfolio image', err); showImportStatus('Image upload failed'); } };
    reader.onerror = function(){ console.error('Failed to read portfolio image'); showImportStatus('Image upload failed'); };
    reader.readAsDataURL(file);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = el('portfolio-input');
    if(!input){ console.error('portfolio-input not found'); return; }
    input.addEventListener('change', handlePortfolioUpload);

    try{ const saved = localStorage.getItem(SCREENSHOT_KEY); if(saved){ showPortfolioImage(saved); showImportStatus('Image loaded from local storage — Ready for OCR'); const ocrStatus = el('ocr-status'); if(ocrStatus) ocrStatus.textContent = 'OCR: ready'; } }catch(err){ console.warn('Failed to read saved portfolio image from localStorage', err); }
  });
})();
