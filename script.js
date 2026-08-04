// script.js — handles import, screenshot upload, iPhone compatibility, and localStorage
(function(){
  const IMPORT_FLAG = 'paos_imported_v1';
  const SCREENSHOT_KEY = 'paos_screenshot_v1';
  const OCR_KEY = 'portfolio_ocr';

  const modal = document.getElementById('import-modal');
  const modalStatus = document.getElementById('modal-status');
  const modalInput = document.getElementById('modalScreenshotFileInput');
  const modalClose = document.getElementById('modal-close');
  const openImportBtn = document.getElementById('open-import');

  const input = document.getElementById('screenshotFileInput');
  const preview = document.getElementById('preview');
  const importStatus = document.getElementById('import-status');
  const ocrBtn = document.getElementById('ocr-btn');
  const ocrStatus = document.getElementById('ocr-status');

  // Show modal if first launch
  function checkFirstLaunch(){
    const imported = localStorage.getItem(IMPORT_FLAG);
    if(!imported){
      showModal();
    } else {
      // if screenshot present, show preview and OCR text
      const data = localStorage.getItem(SCREENSHOT_KEY);
      if(data) showPreviewFromDataURL(data);
      const savedOCR = localStorage.getItem(OCR_KEY);
      if(savedOCR) showOCRResult(savedOCR);
    }
  }

  function showModal(){
    modal.setAttribute('aria-hidden','false');
  }
  function hideModal(){
    modal.setAttribute('aria-hidden','true');
  }

  openImportBtn.addEventListener('click', showModal);
  modalClose.addEventListener('click', ()=>{
    // mark that user dismissed
    localStorage.setItem(IMPORT_FLAG, 'dismissed');
    hideModal();
  });

  // Create or get OCR result container (below preview)
  function getOCRContainer(){
    let el = document.getElementById('ocr-result');
    if(!el){
      el = document.createElement('div');
      el.id = 'ocr-result';
      el.className = 'card ocr-result';
      el.style.marginTop = '12px';
      el.innerHTML = '<h3>Extracted Text</h3><pre id="ocr-text" style="white-space:pre-wrap; word-break:break-word; margin:0; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px"></pre>';
      // insert after preview
      if(preview && preview.parentNode){
        preview.parentNode.insertBefore(el, preview.nextSibling);
      }
    }
    return el;
  }

  function showOCRResult(text){
    const container = getOCRContainer();
    const pre = document.getElementById('ocr-text');
    if(pre) pre.textContent = text;
  }

  // Unified handler for file inputs
  async function handleFileInput(file, statusElement, showComplete=true){
    if(!file) return;
    statusElement.textContent = 'Importing Portfolio...';
    ocrStatus.textContent = 'OCR: pending...';

    // Use FileReader to get data URL, then re-encode via canvas for compatibility (iOS fix)
    const reader = new FileReader();
    reader.onload = async function(e){
      const dataURL = e.target.result;

      // Create image and draw to canvas to ensure orientation & reliability across Safari
      const img = new Image();
      img.onload = async function(){
        try{
          const canvas = document.createElement('canvas');
          const maxW = Math.min(img.width, 2000);
          const scale = Math.min(1, maxW / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const outData = canvas.toDataURL('image/jpeg', 0.9);
          // Save to localStorage (may be large — but per requirements save locally).
          try{
            localStorage.setItem(SCREENSHOT_KEY, outData);
          } catch(err){
            console.warn('localStorage set failed', err);
            statusElement.textContent = 'Error: unable to save image locally.';
            return;
          }

          showPreviewFromDataURL(outData);

          // Run OCR automatically
          try{
            const ocrText = await runOCR(outData);
            // Save OCR result
            try{
              localStorage.setItem(OCR_KEY, ocrText);
            } catch(err){ console.warn('Failed to save OCR to localStorage', err); }
            showOCRResult(ocrText);
            // Mark import complete on first-launch
            localStorage.setItem(IMPORT_FLAG, 'imported');
            if(showComplete){
              statusElement.textContent = 'Import Complete';
            } else {
              statusElement.textContent = 'Saved';
            }
          } catch(err){
            console.error('OCR failed', err);
            ocrStatus.textContent = 'OCR failed';
            // still mark imported
            localStorage.setItem(IMPORT_FLAG, 'imported');
            statusElement.textContent = 'Import Complete';
          }

        } catch(err){
          console.error('image processing failed', err);
          // As fallback save raw dataURL
          try{
            localStorage.setItem(SCREENSHOT_KEY, dataURL);
            showPreviewFromDataURL(dataURL);
            // Try OCR on raw data
            try{
              const ocrText = await runOCR(dataURL);
              localStorage.setItem(OCR_KEY, ocrText);
              showOCRResult(ocrText);
            } catch(e){ console.warn('OCR on raw data failed', e); }
            localStorage.setItem(IMPORT_FLAG, 'imported');
            statusElement.textContent = 'Import Complete';
          } catch(e){
            statusElement.textContent = 'Error saving image.';
          }
        }
      };

      img.onerror = async function(){
        // fallback: store dataURL directly and attempt OCR
        try{
          localStorage.setItem(SCREENSHOT_KEY, dataURL);
          showPreviewFromDataURL(dataURL);
          try{
            const ocrText = await runOCR(dataURL);
            localStorage.setItem(OCR_KEY, ocrText);
            showOCRResult(ocrText);
          } catch(e){ console.warn('OCR on error fallback failed', e); }
          localStorage.setItem(IMPORT_FLAG, 'imported');
          statusElement.textContent = 'Import Complete';
        } catch(e){
          statusElement.textContent = 'Error saving image.';
        }
      };

      img.src = dataURL;

    };
    reader.onerror = function(){ statusElement.textContent = 'Failed to read file'; };
    reader.readAsDataURL(file);
  }

  function showPreviewFromDataURL(dataURL){
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataURL;
    img.alt = 'Portfolio screenshot preview';
    preview.appendChild(img);
  }

  async function runOCR(dataURL){
    if(!window.Tesseract){
      ocrStatus.textContent = 'OCR library not available.';
      return '';
    }
    ocrStatus.textContent = 'OCR: running...';
    let lastProgress = 0;
    const result = await window.Tesseract.recognize(dataURL, 'eng', {
      logger: m => {
        if(m && m.status && typeof m.progress === 'number'){
          const pct = Math.round(m.progress * 100);
          if(pct !== lastProgress){
            lastProgress = pct;
            ocrStatus.textContent = `OCR: ${pct}% (${m.status})`;
          }
        }
      }
    });
    const text = (result && result.text) ? result.text : '';
    ocrStatus.textContent = 'OCR: done';
    return text;
  }

  input.addEventListener('change', function(e){
    const file = e.target.files && e.target.files[0];
    handleFileInput(file, importStatus, true);
  });

  modalInput.addEventListener('change', function(e){
    const file = e.target.files && e.target.files[0];
    handleFileInput(file, modalStatus, true);
    // close modal after short delay to show status
    setTimeout(()=> hideModal(), 1000);
  });

  // OCR placeholder button now triggers OCR again on saved image
  ocrBtn.addEventListener('click', async function(){
    const data = localStorage.getItem(SCREENSHOT_KEY);
    if(!data){ ocrStatus.textContent = 'No screenshot to OCR.'; return; }
    ocrStatus.textContent = 'OCR: running (manual)';
    try{
      const ocrText = await runOCR(data);
      localStorage.setItem(OCR_KEY, ocrText);
      showOCRResult(ocrText);
      ocrStatus.textContent = 'OCR complete (manual)';
    } catch(err){
      console.error('Manual OCR failed', err);
      ocrStatus.textContent = 'OCR failed';
    }
  });

  // On load populate UI from saved data
  document.addEventListener('DOMContentLoaded', function(){
    checkFirstLaunch();
  });

  // Small improvement: handle orientation change on iPhone to avoid layout issues
  window.addEventListener('orientationchange', function(){
    document.body.style.height = window.innerHeight + 'px';
    setTimeout(()=>{ document.body.style.height = ''; }, 500);
  });

})();
