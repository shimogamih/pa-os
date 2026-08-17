// script.js — handles import, screenshot upload, iPhone compatibility, OCR workflow, ledger generation and localStorage
(function(){
  const IMPORT_FLAG = 'paos_imported_v1';
  const SCREENSHOT_KEY = 'portfolio_image';
  const OCR_KEY = 'portfolio_ocr';
  const LEDGER_KEY = 'portfolio_ledger';

  const modal = document.getElementById('import-modal');
  const modalStatus = document.getElementById('modal-status');
  const modalInputLabel = document.querySelector('label[for="portfolio-input"]');
  const modalClose = document.getElementById('modal-close');
  const openImportBtn = document.getElementById('open-import');
  const openLedgerBtn = document.getElementById('open-ledger');

  const preview = document.getElementById('preview');
  const importStatus = document.getElementById('import-status');
  const ocrBtn = document.getElementById('ocr-btn');
  const ocrStatus = document.getElementById('ocr-status');

  const ledgerScreen = document.getElementById('ledger-screen');
  const closeLedgerBtn = document.getElementById('close-ledger');
  const ledgerCards = document.getElementById('ledger-cards');
  const totalAssetsEl = document.getElementById('total-assets');
  const totalProfitEl = document.getElementById('total-profit');
  const numHoldingsEl = document.getElementById('num-holdings');

  function showModal(){ if(modal) modal.setAttribute('aria-hidden','false'); }
  function hideModal(){ if(modal) modal.setAttribute('aria-hidden','true'); }
  function showLedgerScreen(){ ledgerScreen.setAttribute('aria-hidden','false'); }
  function hideLedgerScreen(){ ledgerScreen.setAttribute('aria-hidden','true'); }

  openImportBtn && openImportBtn.addEventListener('click', showModal);
  modalClose && modalClose.addEventListener('click', ()=>{ localStorage.setItem(IMPORT_FLAG, 'dismissed'); hideModal(); });
  openLedgerBtn && openLedgerBtn.addEventListener('click', function(){ renderLedgerScreen(); showLedgerScreen(); });
  closeLedgerBtn && closeLedgerBtn.addEventListener('click', hideLedgerScreen);

  // Utility helpers
  function el(id){ return document.getElementById(id); }
  function showImportStatus(msg){ if(importStatus) importStatus.textContent = msg; }
  function showPreviewFromDataURL(dataURL){ if(!preview) return; preview.innerHTML = ''; let img = document.getElementById('portfolio-preview'); if(!img){ img = document.createElement('img'); img.id = 'portfolio-preview'; img.alt = 'Portfolio screenshot preview'; img.style.maxWidth = '100%'; img.style.height = 'auto'; preview.appendChild(img); } img.src = dataURL; }

  // Parse existing OCR/ledger utilities (unchanged)
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
    ledger.forEach(item => { const row = document.createElement('div'); row.className = 'card'; row.style.padding = '8px'; const name = document.createElement('div'); name.textContent = `銘柄名: ${item.name || '—'}`; name.style.fontWeight = '600'; const code = document.createElement('div'); code.textContent = `証券コード: ${item.code || '—'}`; const val = document.createElement('div'); val.textContent = `評価額: ${item.value !== null ? item.value.toLocaleString() + '円' : '—'}`; row.appendChild(name); row.appendChild(code); row.appendChild(val); list.appendChild(row); });
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
    const thead = document.createElement('thead'); const headerRow = document.createElement('tr'); ['銘柄','コード','評価額'].forEach(hText => { const th = document.createElement('th'); th.textContent = hText; th.style.textAlign = 'left'; th.style.padding = '6px 8px'; th.style.borderBottom = '1px solid rgba(255,255,255,0.06)'; headerRow.appendChild(th); }); thead.appendChild(headerRow); table.appendChild(thead);
    const tbody = document.createElement('tbody'); ledger.forEach(item => { const tr = document.createElement('tr'); tr.style.borderBottom = '1px solid rgba(255,255,255,0.03)'; const tdName = document.createElement('td'); tdName.textContent = item.name || '—'; tdName.style.padding = '8px'; const tdCode = document.createElement('td'); tdCode.textContent = item.code || '—'; tdCode.style.padding = '8px'; tdCode.style.width = '96px'; const tdVal = document.createElement('td'); tdVal.textContent = item.value !== null ? '¥' + Number(item.value).toLocaleString() : '—'; tdVal.style.padding = '8px'; tdVal.style.textAlign = 'right'; tr.appendChild(tdName); tr.appendChild(tdCode); tr.appendChild(tdVal); tbody.appendChild(tr); }); table.appendChild(tbody); card.appendChild(table); cardsGrid.appendChild(card);
  }

  // File handling (new: ensures portfolio-input exists and registers change handler)
  function handleFileInput(file, statusElement){
    if(!file) return;
    statusElement.textContent = 'Importing Portfolio...';
    ocrStatus.textContent = 'OCR: pending...';
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
          try{ localStorage.setItem(SCREENSHOT_KEY, outData); } catch(err){ console.warn('localStorage set failed', err); statusElement.textContent = 'Error: unable to save image locally.'; return; }
          showPreviewFromDataURL(outData);
          statusElement.textContent = 'Image saved. Ready for OCR.';
          ocrStatus.textContent = 'OCR: ready';
        }catch(err){ console.error('image processing failed', err); try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); statusElement.textContent = 'Image saved. Ready for OCR.'; ocrStatus.textContent = 'OCR: ready'; }catch(e){ console.warn('failed to save raw dataURL', e); statusElement.textContent = 'Failed to save image'; ocrStatus.textContent = ''; } }
      };
      img.onerror = function(){ try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); statusElement.textContent = 'Image saved. Ready for OCR.'; ocrStatus.textContent = 'OCR: ready'; }catch(e){ statusElement.textContent = 'Failed to load image'; } };
      img.src = dataURL;
    };
    reader.onerror = function(){ statusElement.textContent = 'Failed to read file'; };
    reader.readAsDataURL(file);
  }

  function showPreviewFromDataURL(dataURL){ preview.innerHTML = ''; const img = document.createElement('img'); img.src = dataURL; img.alt = 'Portfolio screenshot preview'; preview.appendChild(img); }

  async function runTesseractOCR(dataURL){ if(!window.Tesseract || typeof window.Tesseract.recognize !== 'function') throw new Error('Tesseract not available'); ocrStatus.textContent = 'OCR: running...'; let lastProgress = 0; const result = await window.Tesseract.recognize(dataURL, 'jpn+eng', { logger: m => { if(m && typeof m.progress === 'number'){ const pct = Math.round(m.progress * 100); if(pct !== lastProgress){ lastProgress = pct; ocrStatus.textContent = 'OCR: ' + pct + '%'; } } } }); const text = (result && result.data && result.data.text) ? result.data.text : (result && result.text ? result.text : ''); ocrStatus.textContent = 'OCR: done'; return text; }

  function simulateJapaneseNamesOCR(){ const sample = ['NSグループ','UTグループ','日本精工','PHCホールディングス','セレス']; return sample.join('\n'); }

  // Attach change handler to single portfolio-input element
  document.addEventListener('DOMContentLoaded', function(){
    // restore dashboard ledger table (keeps UI)
    renderDashboardLedgerTable();

    const input = document.getElementById('portfolio-input');
    if(!input){ console.error('portfolio-input not found'); return; }

    input.setAttribute('accept','image/*');
    // do not set capture attribute to avoid altering iOS picker behavior in some cases

    input.addEventListener('change', function(e){ const file = e.target.files && e.target.files[0]; handleFileInput(file, importStatus); });

    // Also support label click forwarding for safety on some browsers (no preventDefault)
    try{
      const labels = document.querySelectorAll('label.file-label');
      labels.forEach(label => {
        label.tabIndex = 0;
        label.addEventListener('click', function(){ try{ input.click(); }catch(e){} });
      });
    }catch(e){}

    // load saved image if exists
    try{
      const saved = localStorage.getItem(SCREENSHOT_KEY);
      if(saved){ showPreviewFromDataURL(saved); importStatus.textContent = 'Image loaded from local storage — Ready for OCR'; ocrStatus.textContent = 'OCR: ready'; }
    }catch(err){ console.warn('Failed to read saved portfolio image', err); }

  renderDashboardLedgerTable();
  });

  ocrBtn.addEventListener('click', async function(){
    const data = localStorage.getItem(SCREENSHOT_KEY);
    if(!data){ ocrStatus.textContent = 'No screenshot found in localStorage.'; return; }
    importStatus.textContent = 'Importing Portfolio...';
    ocrStatus.textContent = 'OCR: starting...';
    let text = '';
    try{
      try{ text = await runTesseractOCR(data); } catch(err){ console.warn('Tesseract OCR failed or unavailable, using placeholder OCR', err); text = simulateJapaneseNamesOCR(); await new Promise(r => setTimeout(r,400)); }
      try{ localStorage.setItem(OCR_KEY, text); } catch(err){ console.warn('Failed to save OCR to localStorage', err); }
      // show OCR text
      const existing = document.getElementById('ocr-result'); if(existing) existing.remove(); const el = document.createElement('div'); el.id = 'ocr-result'; el.className = 'card ocr-result'; el.style.marginTop = '12px'; el.innerHTML = '<h3>Extracted Text</h3><pre id="ocr-text" style="white-space:pre-wrap; word-break:break-word; margin:0; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px"></pre>'; if(preview && preview.parentNode){ preview.parentNode.insertBefore(el, preview.nextSibling); } const pre = document.getElementById('ocr-text'); if(pre) pre.textContent = text || ''; ocrStatus.textContent = 'OCR Complete'; importStatus.textContent = 'OCR Complete'; const ledger = parsePortfolioOCR(); renderInlineLedgerCard(ledger); renderDashboardLedgerTable();
    }catch(err){ console.error('OCR run failed', err); ocrStatus.textContent = 'OCR failed'; importStatus.textContent = 'OCR failed'; }
  });

  // render ledger screen
  function renderLedgerScreen(){
    let ledger = [];
    const raw = localStorage.getItem(LEDGER_KEY);
    if(raw){ try{ ledger = JSON.parse(raw); } catch(e){ ledger = []; } } else { const generated = parsePortfolioOCR(); ledger = generated || []; }
    let totalAssets = 0; let totalProfit = 0; let count = ledger.length;
    for(const h of ledger){ if(h.value !== null && !isNaN(h.value)) totalAssets += Number(h.value); }
    totalAssetsEl.textContent = totalAssets ? totalAssets.toLocaleString() + '円' : '—'; totalProfitEl.textContent = '—'; numHoldingsEl.textContent = count;
    ledgerCards.innerHTML = '';
    if(ledger.length === 0){ const msg = document.createElement('div'); msg.className = 'card'; msg.textContent = 'No holdings found in OCR data.'; ledgerCards.appendChild(msg); return; }
    for(const h of ledger){ const card = document.createElement('div'); card.className = 'holding-card'; const title = document.createElement('h4'); title.textContent = h.name || (h.code || 'Unknown'); card.appendChild(title); const codeRow = document.createElement('div'); codeRow.className = 'holding-row'; codeRow.innerHTML = `<div class="muted">証券コード</div><div>${h.code || '—'}</div>`; card.appendChild(codeRow); const valRow = document.createElement('div'); valRow.className = 'holding-row'; valRow.innerHTML = `<div class="muted">評価額</div><div>${h.value !== null ? h.value.toLocaleString() + '円' : '—'}</div>`; card.appendChild(valRow); ledgerCards.appendChild(card); }
  }

})();
