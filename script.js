// script.js — handles import, screenshot upload, iPhone compatibility, and localStorage
(function(){
  const IMPORT_FLAG = 'paos_imported_v1';
  const SCREENSHOT_KEY = 'paos_screenshot_v1';

  const modal = document.getElementById('import-modal');
  const modalStatus = document.getElementById('modal-status');
  const modalInput = document.getElementById('modal-screenshot');
  const modalClose = document.getElementById('modal-close');
  const openImportBtn = document.getElementById('open-import');

  const input = document.getElementById('screenshot-input');
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
      // if screenshot present, show preview
      const data = localStorage.getItem(SCREENSHOT_KEY);
      if(data) showPreviewFromDataURL(data);
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

  // Unified handler for file inputs
  function handleFileInput(file, statusElement, showComplete=true){
    if(!file) return;
    statusElement.textContent = 'Importing...';

    // Use FileReader to get data URL, then re-encode via canvas for compatibility (iOS fix)
    const reader = new FileReader();
    reader.onload = function(e){
      const dataURL = e.target.result;

      // Create image and draw to canvas to ensure orientation & reliability across Safari
      const img = new Image();
      img.onload = function(){
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

          // Mark import complete on first-launch
          localStorage.setItem(IMPORT_FLAG, 'imported');

          if(showComplete){
            statusElement.textContent = 'Import Complete';
          } else {
            statusElement.textContent = 'Saved';
          }

        } catch(err){
          console.error('image processing failed', err);
          // As fallback save raw dataURL
          try{
            localStorage.setItem(SCREENSHOT_KEY, dataURL);
            showPreviewFromDataURL(dataURL);
            localStorage.setItem(IMPORT_FLAG, 'imported');
            statusElement.textContent = 'Import Complete';
          } catch(e){
            statusElement.textContent = 'Error saving image.';
          }
        }
      };

      img.onerror = function(){
        // fallback: store dataURL directly
        try{
          localStorage.setItem(SCREENSHOT_KEY, dataURL);
          showPreviewFromDataURL(dataURL);
          localStorage.setItem(IMPORT_FLAG, 'imported');
          statusElement.textContent = 'Import Complete';
        } catch(e){
          statusElement.textContent = 'Error saving image.';
        }
      };

      // iOS Safari fix: setting crossOrigin may prevent tainting; not strictly needed here
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

  // OCR placeholder — prepare Tesseract if available but do not run heavy work
  ocrBtn.addEventListener('click', async function(){
    const data = localStorage.getItem(SCREENSHOT_KEY);
    if(!data){ ocrStatus.textContent = 'No screenshot to OCR.'; return; }
    ocrStatus.textContent = 'OCR: preparing (placeholder)';

    // Placeholder hook: Tesseract loaded and hooked but we DO NOT perform recognition now
    if(window.Tesseract){
      // Example placeholder: create a worker variable for future use
      window._paos_ocr_worker = window._paos_ocr_worker || null;
      ocrStatus.textContent = 'OCR ready (placeholder). Tesseract loaded.';
    } else {
      ocrStatus.textContent = 'OCR library not loaded.';
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
