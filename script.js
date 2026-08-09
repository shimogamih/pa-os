// Improved upload handler with iPhone fallbacks and on-screen debug logs
(function(){
  const SCREENSHOT_KEY = 'portfolio_image';
  function el(id){ return document.getElementById(id); }

  function showImportStatus(msg){ const s = el('import-status'); if(s) s.textContent = msg; debug('status: '+msg); }

  function showPortfolioImage(dataUrl){ const preview = el('preview'); if(!preview) return; let img = el('portfolio-preview'); if(!img){ img = document.createElement('img'); img.id = 'portfolio-preview'; img.alt = 'Portfolio screenshot'; img.style.maxWidth='100%'; img.style.height='auto'; preview.innerHTML=''; preview.appendChild(img); } img.src = dataUrl; }

  // Simple on-screen debug log (only shown on iPhone or when ?debug=1 in URL)
  const isIphone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const showDebug = isIphone || location.search.indexOf('debug=1') !== -1;
  let debugEl = null;
  function ensureDebug(){ if(!showDebug) return; if(debugEl) return; debugEl = document.createElement('div'); debugEl.id = 'paos-debug'; debugEl.style.position='fixed'; debugEl.style.bottom='8px'; debugEl.style.left='8px'; debugEl.style.right='8px'; debugEl.style.maxHeight='30vh'; debugEl.style.overflow='auto'; debugEl.style.background='rgba(0,0,0,0.6)'; debugEl.style.color='white'; debugEl.style.fontSize='12px'; debugEl.style.padding='8px'; debugEl.style.borderRadius='8px'; debugEl.style.zIndex='9999'; document.body.appendChild(debugEl); }
  function debug(msg){ try{ console.log('[paos-debug] ', msg); if(showDebug){ ensureDebug(); const d = document.createElement('div'); d.textContent = (new Date()).toLocaleTimeString() + ' — ' + msg; debugEl.insertBefore(d, debugEl.firstChild); } }catch(e){} }

  function handlePortfolioUpload(event){ debug('change event fired'); const file = event && event.target && event.target.files ? event.target.files[0] : null; if(!file){ debug('no file in event'); showImportStatus('No file selected'); return; }
    debug('file selected: '+file.name+' ('+file.type+', '+file.size+' bytes)');
    if(!file.type || !file.type.startsWith('image/')){ console.error('Selected file is not an image'); showImportStatus('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = function(){ try{ const dataUrl = reader.result; try{ localStorage.setItem(SCREENSHOT_KEY, dataUrl); debug('saved to localStorage'); }catch(err){ console.warn('localStorage.setItem failed', err); debug('localStorage.setItem failed: '+err); showImportStatus('Unable to save image locally'); return; }
        showPortfolioImage(dataUrl); showImportStatus('Image saved — Ready for OCR'); const ocrStatus = el('ocr-status'); if(ocrStatus) ocrStatus.textContent = 'OCR: ready'; }catch(err){ console.error('Failed to handle portfolio image', err); debug('handlePortfolioUpload error: '+err); showImportStatus('Image upload failed'); } };
    reader.onerror = function(){ console.error('Failed to read portfolio image'); debug('FileReader.onerror'); showImportStatus('Image upload failed'); };
    try{ reader.readAsDataURL(file); }catch(err){ debug('readAsDataURL threw: '+err); showImportStatus('Image upload failed'); }
  }

  function attachLabelFallbacks(input){ try{
    const labels = Array.from(document.querySelectorAll('.file-label'));
    labels.forEach(label => {
      // ensure label is clickable and focusable
      label.setAttribute('tabindex','0');
      const onClick = function(ev){ ev.preventDefault(); debug('label click -> forwarding to input.click()'); try{ input.click(); }catch(e){ debug('input.click() failed: '+e); } };
      label.addEventListener('click', onClick, {passive:false});
      label.addEventListener('touchend', function(ev){ ev.preventDefault(); debug('label touchend -> forwarding to input.click()'); try{ input.click(); }catch(e){ debug('input.click() failed: '+e); } }, {passive:false});
    });
  }catch(e){ debug('attachLabelFallbacks error: '+e); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = el('portfolio-input');
    if(!input){ console.error('portfolio-input not found'); debug('portfolio-input not found'); return; }

    // Set recommended attributes to ensure camera option appears on iPhone
    try{ input.setAttribute('accept','image/*'); input.setAttribute('capture','environment'); }catch(e){ debug('failed to set attributes: '+e); }

    input.addEventListener('change', handlePortfolioUpload);
    input.addEventListener('click', function(){ debug('input.click event'); showImportStatus('File picker opened'); });
    input.addEventListener('focus', function(){ debug('input focus'); });

    attachLabelFallbacks(input);

    try{ const saved = localStorage.getItem(SCREENSHOT_KEY); if(saved){ showPortfolioImage(saved); showImportStatus('Image loaded from local storage — Ready for OCR'); const ocrStatus = el('ocr-status'); if(ocrStatus) ocrStatus.textContent = 'OCR: ready'; debug('loaded saved image from localStorage'); } else { debug('no saved image in localStorage'); } }catch(err){ console.warn('Failed to read saved portfolio image from localStorage', err); debug('localStorage read failed: '+err); }

    debug('upload handler initialized');
  });
})();
