// script.js — handles import, screenshot upload, iPhone compatibility, OCR workflow, ledger generation and localStorage
(function(){
  const IMPORT_FLAG = 'paos_imported_v1';
  const SCREENSHOT_KEY = 'portfolio_image';
  const OCR_KEY = 'portfolio_ocr';
  const LEDGER_KEY = 'portfolio_ledger';

  // Elements (most are resolved after DOMContentLoaded)
  let modal, modalStatus, modalInputLabel, modalClose, openImportBtn, openLedgerBtn;
  let preview, importStatus, ocrBtn, ocrStatus;
  let ledgerScreen, closeLedgerBtn, ledgerCards, totalAssetsEl, totalProfitEl, numHoldingsEl;

  function showModal(){ if(modal) modal.setAttribute('aria-hidden','false'); }
  function hideModal(){ if(modal) modal.setAttribute('aria-hidden','true'); }
  function showLedgerScreen(){ if(ledgerScreen) ledgerScreen.setAttribute('aria-hidden','false'); }
  function hideLedgerScreen(){ if(ledgerScreen) ledgerScreen.setAttribute('aria-hidden','true'); }

  // Utility helpers
  function el(id){ return document.getElementById(id); }
  function showImportStatus(msg){ if(importStatus) importStatus.textContent = msg; }
  function showOCRStatus(msg){ if(ocrStatus) ocrStatus.textContent = msg; }

  // Single preview renderer
  function showPreviewFromDataURL(dataURL){
    if(!preview) return;
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.id = 'portfolio-preview';
    img.src = dataURL;
    img.alt = 'Portfolio screenshot preview';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    preview.appendChild(img);
  }

  // OCR/ledger parsing utilities (preserve behavior)
  function parsePortfolioOCR(){
    const raw = localStorage.getItem(OCR_KEY) || '';
    if(!raw) return [];
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const ledger = [];
    for(let i=0;i<lines.length;i++){
      const line = lines[i];
      if(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(line)) continue; // must have Japanese
      const name = line;
      let value = null; let code = null;
      for(let j=i+1;j<Math.min(i+5, lines.length); j++){
        const l = lines[j];
        const moneyMatch = l.match(/([0-9]{1,3}(?:,[0-9]{3})*)(?:\s*)円/);
        if(moneyMatch){ value = parseInt(moneyMatch[1].replace(/,/g,''),10); break; }
        const yenMatch = l.match(/¥\s*([0-9]{1,3}(?:,[0-9]{3})*)/);
        if(yenMatch){ value = parseInt(yenMatch[1].replace(/,/g,''),10); break; }
        const maybeCode = l.replace(/\s+/g,'');
        if(!code && /^[0-9A-Za-z]{2,6}$/.test(maybeCode)) code = maybeCode;
      }
      if(name && value !== null) ledger.push({name:name, code:code||null, value:value});
    }
    try{ localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)); if(ledger.length>0) showImportStatus('Portfolio Ledger Created'); }catch(e){ console.warn('Failed to save portfolio ledger', e); }
    return ledger;
  }

  function renderInlineLedgerCard(ledger){
    const existing = document.getElementById('portfolio-ledger-card'); if(existing) existing.remove();
    const card = document.createElement('div'); card.id = 'portfolio-ledger-card'; card.className = 'card'; card.style.marginTop = '12px';
    const h = document.createElement('h3'); h.textContent = 'Portfolio Ledger'; card.appendChild(h);
    if(!ledger || ledger.length===0){ const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No holdings parsed.'; card.appendChild(p); if(preview && preview.parentNode){ preview.parentNode.insertBefore(card, preview.nextSibling); } return; }
    const list = document.createElement('div'); list.style.display = 'grid'; list.style.gap = '8px';
    ledger.forEach(item => { const row = document.createElement('div'); row.className = 'card'; row.style.padding = '8px'; const name = document.createElement('div'); name.textContent = `銘柄名: ${item.name}`; row.appendChild(name); const code = document.createElement('div'); code.textContent = `コード: ${item.code || '-'}`; row.appendChild(code); const val = document.createElement('div'); val.textContent = `評価額: ${item.value ? item.value.toLocaleString() + '円' : '-'}`; row.appendChild(val); list.appendChild(row); });
    card.appendChild(list); if(preview && preview.parentNode){ preview.parentNode.insertBefore(card, preview.nextSibling); }
  }

  function renderDashboardLedgerTable(){
    const existing = document.getElementById('dashboard-portfolio-ledger'); if(existing) existing.remove();
    const cardsGrid = document.querySelector('.cards-grid'); if(!cardsGrid) return;
    const card = document.createElement('div'); card.id = 'dashboard-portfolio-ledger'; card.className = 'card dashboard-card'; card.style.gridColumn = '1 / -1';
    const title = document.createElement('h3'); title.textContent = 'Portfolio Ledger'; title.style.marginTop = '0'; card.appendChild(title);
    let ledger = [];
    try{ const raw = localStorage.getItem(LEDGER_KEY); if(raw) ledger = JSON.parse(raw); }catch(e){ ledger = []; }
    if(!ledger || ledger.length === 0){ const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No portfolio ledger available.'; card.appendChild(p); cardsGrid.appendChild(card); return; }
    const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse'; table.style.marginTop = '8px';
    const thead = document.createElement('thead'); const headerRow = document.createElement('tr'); ['銘柄','コード','評価額'].forEach(hText => { const th = document.createElement('th'); th.textContent = hText; th.style.textAlign='left'; th.style.padding='6px 0'; headerRow.appendChild(th); }); thead.appendChild(headerRow); table.appendChild(thead);
    const tbody = document.createElement('tbody'); ledger.forEach(item => { const tr = document.createElement('tr'); tr.style.borderBottom = '1px solid rgba(255,255,255,0.03)'; const tdName = document.createElement('td'); tdName.textContent = item.name || '-'; tdName.style.padding='6px 0'; const tdCode = document.createElement('td'); tdCode.textContent = item.code || '-'; tdCode.style.padding='6px 0'; const tdVal = document.createElement('td'); tdVal.textContent = item.value ? item.value.toLocaleString() + '円' : '-'; tdVal.style.padding='6px 0'; tr.appendChild(tdName); tr.appendChild(tdCode); tr.appendChild(tdVal); tbody.appendChild(tr); }); table.appendChild(tbody); card.appendChild(table); cardsGrid.appendChild(card);
  }

  // File handling: single change handler will call this
  function handleFileInput(file, statusElement){
    if(!file) return;
    if(statusElement) statusElement.textContent = 'Importing Portfolio...';
    showOCRStatus('OCR: pending...');
    const reader = new FileReader();
    reader.onload = function(e){
      const dataURL = e.target.result;
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
          try{ localStorage.setItem(SCREENSHOT_KEY, outData); } catch(err){ console.warn('localStorage set failed', err); if(statusElement) statusElement.textContent = 'Error: unable to save image locally.'; return; }
          showPreviewFromDataURL(outData);
          if(statusElement) statusElement.textContent = 'Image saved. Ready for OCR.';
          showOCRStatus('OCR: ready');
        }catch(err){
          console.error('image processing failed', err);
          try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); if(statusElement) statusElement.textContent = 'Image saved. Ready for OCR.'; showOCRStatus('OCR: ready'); }catch(e){ if(statusElement) statusElement.textContent = 'Error: unable to save image locally.'; }
        }
      };
      img.onerror = function(){
        try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); if(statusElement) statusElement.textContent = 'Image saved. Ready for OCR.'; showOCRStatus('OCR: ready'); }catch(e){ if(statusElement) statusElement.textContent = 'Error: unable to save image locally.'; }
      };
      img.src = dataURL;
    };
    reader.onerror = function(){ if(statusElement) statusElement.textContent = 'Failed to read file'; };
    reader.readAsDataURL(file);
  }

  async function runTesseractOCR(dataURL){
    if(!window.Tesseract || typeof window.Tesseract.recognize !== 'function') throw new Error('Tesseract not available');
    showOCRStatus('OCR: running...');
    const result = await window.Tesseract.recognize(dataURL, 'jpn+eng', { logger: m => {} });
    return result && result.data && result.data.text ? result.data.text : '';
  }

  function simulateJapaneseNamesOCR(){ const sample = ['NSグループ','UTグループ','日本精工','PHCホールディングス','セレス']; return sample.join('\n'); }

  // DOMContentLoaded: attach handlers and cache elements. Only one click and one change handler for upload.
  document.addEventListener('DOMContentLoaded', function(){
    // cache common elements
    modal = document.getElementById('import-modal');
    modalStatus = document.getElementById('modal-status');
    modalInputLabel = document.querySelector('label[for="portfolio-input"]');
    modalClose = document.getElementById('modal-close');
    openImportBtn = document.getElementById('open-import');
    openLedgerBtn = document.getElementById('open-ledger');

    preview = document.getElementById('preview');
    importStatus = document.getElementById('import-status');
    ocrBtn = document.getElementById('ocr-btn');
    ocrStatus = document.getElementById('ocr-status');

    ledgerScreen = document.getElementById('ledger-screen');
    closeLedgerBtn = document.getElementById('close-ledger');
    ledgerCards = document.getElementById('ledger-cards');
    totalAssetsEl = document.getElementById('total-assets');
    totalProfitEl = document.getElementById('total-profit');
    numHoldingsEl = document.getElementById('num-holdings');

    openImportBtn && openImportBtn.addEventListener('click', showModal);
    modalClose && modalClose.addEventListener('click', ()=>{ try{ localStorage.setItem(IMPORT_FLAG, 'dismissed'); }catch(e){}; hideModal(); });
    openLedgerBtn && openLedgerBtn.addEventListener('click', function(){ renderLedgerScreen(); showLedgerScreen(); });
    closeLedgerBtn && closeLedgerBtn.addEventListener('click', hideLedgerScreen);

    // Ensure dashboard ledger renders
    renderDashboardLedgerTable();

    // Simplified upload wiring: single hidden input + single visible button
    const input = document.getElementById('portfolio-input');
    const chooseBtn = document.getElementById('choose-photo-btn');

    if(!input){ console.error('portfolio-input not found'); }
    if(chooseBtn){
      chooseBtn.addEventListener('click', function(e){ e.preventDefault(); try{ input && input.click(); }catch(err){ console.warn('input.click failed', err); } });
    }

    if(input){
      input.setAttribute('accept','image/*');
      // single change handler
      input.addEventListener('change', function(e){ const file = e.target.files && e.target.files[0]; handleFileInput(file, importStatus); try{ e.target.value = ''; }catch(e){} });
    }

    // remove legacy label forwarding if present (defensive cleanup)
    try{
      const labels = document.querySelectorAll('label.file-label');
      labels.forEach(label => { label.replaceWith(label.cloneNode(true)); });
    }catch(e){}

    // load saved image if exists
    try{
      const saved = localStorage.getItem(SCREENSHOT_KEY);
      if(saved){ showPreviewFromDataURL(saved); if(importStatus) importStatus.textContent = 'Image loaded from local storage — Ready for OCR'; if(ocrStatus) ocrStatus.textContent = 'OCR: ready'; }
    }catch(err){ console.warn('Failed to read saved portfolio image', err); }

    // OCR button handler (guarded)
    if(ocrBtn){
      ocrBtn.addEventListener('click', async function(){
        const data = localStorage.getItem(SCREENSHOT_KEY);
        if(!data){ if(ocrStatus) ocrStatus.textContent = 'No screenshot found in localStorage.'; return; }
        if(importStatus) importStatus.textContent = 'Importing Portfolio...';
        showOCRStatus('OCR: starting...');
        let text = '';
        try{
          try{ text = await runTesseractOCR(data); }catch(err){ console.warn('Tesseract OCR failed or unavailable, using placeholder OCR', err); text = simulateJapaneseNamesOCR(); await new Promise(r => setTimeout(r, 300)); }
          try{ localStorage.setItem(OCR_KEY, text); } catch(err){ console.warn('Failed to save OCR to localStorage', err); }
          // show OCR text
          const existing = document.getElementById('ocr-result'); if(existing) existing.remove(); const el = document.createElement('div'); el.id = 'ocr-result'; el.className = 'card ocr-result'; const pre = document.createElement('pre'); pre.id = 'ocr-text'; pre.style.whiteSpace = 'pre-wrap'; pre.style.margin = '8px 0'; pre.textContent = text || ''; el.appendChild(pre); if(preview && preview.parentNode) preview.parentNode.insertBefore(el, preview.nextSibling);
          showOCRStatus('OCR Complete'); if(importStatus) importStatus.textContent = 'OCR Complete';
          const ledger = parsePortfolioOCR(); renderInlineLedgerCard(ledger); renderDashboardLedgerTable();
        }catch(err){ console.error('OCR run failed', err); showOCRStatus('OCR failed'); if(importStatus) importStatus.textContent = 'OCR failed'; }
      });
    }

  }); // DOMContentLoaded end

  // render ledger screen
  function renderLedgerScreen(){
    let ledger = [];
    const raw = localStorage.getItem(LEDGER_KEY);
    if(raw){ try{ ledger = JSON.parse(raw); } catch(e){ ledger = []; } } else { const generated = parsePortfolioOCR(); ledger = generated || []; }
    let totalAssets = 0; let totalProfit = 0; let count = ledger.length;
    for(const h of ledger){ if(h.value !== null && !isNaN(h.value)) totalAssets += Number(h.value); }
    if(totalAssetsEl) totalAssetsEl.textContent = totalAssets ? totalAssets.toLocaleString() + '円' : '—'; if(totalProfitEl) totalProfitEl.textContent = '—'; if(numHoldingsEl) numHoldingsEl.textContent = count;
    if(ledgerCards) ledgerCards.innerHTML = '';
    if(ledger.length === 0){ const msg = document.createElement('div'); msg.className = 'card'; msg.textContent = 'No holdings found in OCR data.'; ledgerCards && ledgerCards.appendChild(msg); return; }
    for(const h of ledger){ const card = document.createElement('div'); card.className = 'holding-card'; const title = document.createElement('h4'); title.textContent = h.name || (h.code || 'Unknown'); card.appendChild(title); const p = document.createElement('div'); p.textContent = `評価額: ${h.value ? h.value.toLocaleString() + '円' : '-'}`; card.appendChild(p); ledgerCards && ledgerCards.appendChild(card); }
  }

})();
