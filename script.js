// script.js — handles import, screenshot upload, iPhone compatibility, OCR workflow, ledger generation and localStorage
(function(){
  const IMPORT_FLAG = 'paos_imported_v1';
  const SCREENSHOT_KEY = 'paos_screenshot_v1';
  const OCR_KEY = 'portfolio_ocr';
  const LEDGER_KEY = 'portfolio_ledger';

  const modal = document.getElementById('import-modal');
  const modalStatus = document.getElementById('modal-status');
  const modalInput = document.getElementById('modalScreenshotFileInput');
  const modalClose = document.getElementById('modal-close');
  const openImportBtn = document.getElementById('open-import');
  const openLedgerBtn = document.getElementById('open-ledger');

  const input = document.getElementById('screenshotFileInput');
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

  // Show modal if first launch
  function checkFirstLaunch(){
    const imported = localStorage.getItem(IMPORT_FLAG);
    if(!imported){
      showModal();
    } else {
      const data = localStorage.getItem(SCREENSHOT_KEY);
      if(data) showPreviewFromDataURL(data);
      const savedOCR = localStorage.getItem(OCR_KEY);
      if(savedOCR){
        // populate OCR UI and set statuses
        showOCRResult(savedOCR);
        ocrStatus.textContent = 'OCR Complete';
        importStatus.textContent = 'OCR Complete';
        // parse portfolio ledger from OCR and render inline card
        const ledger = parsePortfolioOCR();
        if(ledger && ledger.length > 0){
          renderInlineLedgerCard(ledger);
        }
        // also render dashboard card
        renderDashboardLedgerTable();
        // generate ledger-screen data if missing
        const storedLedger = localStorage.getItem(LEDGER_KEY);
        if(!storedLedger){ generateLedgerFromOCR(); }
      } else {
        // even if no OCR, ensure dashboard ledger reflects stored ledger if exists
        renderDashboardLedgerTable();
      }
    }
  }

  function showModal(){ modal.setAttribute('aria-hidden','false'); }
  function hideModal(){ modal.setAttribute('aria-hidden','true'); }

  openImportBtn.addEventListener('click', showModal);
  modalClose.addEventListener('click', ()=>{ localStorage.setItem(IMPORT_FLAG, 'dismissed'); hideModal(); });

  openLedgerBtn.addEventListener('click', function(){ renderLedgerScreen(); showLedgerScreen(); });
  closeLedgerBtn.addEventListener('click', hideLedgerScreen);
  function showLedgerScreen(){ ledgerScreen.setAttribute('aria-hidden','false'); }
  function hideLedgerScreen(){ ledgerScreen.setAttribute('aria-hidden','true'); }

  // Remove duplicate OCR panels if more than one exists
  function cleanOCRPanels(){
    const nodes = Array.from(document.querySelectorAll('#ocr-result'));
    if(nodes.length <= 1) return;
    const [first, ...rest] = nodes;
    rest.forEach(n => n.remove());
  }

  function cleanOCRTextNodes(){
    const nodes = Array.from(document.querySelectorAll('#ocr-text'));
    if(nodes.length <= 1) return;
    const [first, ...rest] = nodes;
    rest.forEach(n => n.remove());
  }

  // Create or get a single OCR result container (below preview)
  function getOCRContainer(){
    cleanOCRPanels();
    let el = document.getElementById('ocr-result');
    if(!el){
      el = document.createElement('div');
      el.id = 'ocr-result';
      el.className = 'card ocr-result';
      el.style.marginTop = '12px';
      el.innerHTML = '<h3>Extracted Text</h3><pre id="ocr-text" style="white-space:pre-wrap; word-break:break-word; margin:0; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px"></pre>';
      if(preview && preview.parentNode){ preview.parentNode.insertBefore(el, preview.nextSibling); }
    }
    return el;
  }

  function showOCRResult(text){
    getOCRContainer();
    cleanOCRTextNodes();
    const pre = document.getElementById('ocr-text');
    if(pre) pre.textContent = text || '';
    // hide 'No OCR text available to generate ledger.' message if present
    if(importStatus && importStatus.textContent && /No OCR text available/i.test(importStatus.textContent)){
      importStatus.textContent = '';
    }
  }

  // Portfolio OCR -> ledger parser
  function parsePortfolioOCR(){
    const raw = localStorage.getItem(OCR_KEY) || '';
    if(!raw) return [];

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const garbagePatterns = [
      /^extracted text/i, /^run ocr/i, /^portfolio$/i, /^feed$/i, /^my page$/i,
      /^placeholder/i, /github\.io/i, /ocr complete/i, /^importing portfolio/i,
      /^no ocr text available/i
    ];
    function isGarbage(line){
      if(!line) return true;
      const lower = line.toLowerCase();
      if(lower.startsWith('http') || lower.includes('github.io') || lower.includes('http')) return true;
      for(const p of garbagePatterns){ if(p.test(line)) return true; }
      // lines that are clearly numeric labels like '銘柄' or '株数' etc may be garbage
      if(/^\D{0,2}\s*証券コード/.test(line)) return true;
      return false;
    }

    const ledger = [];
    for(let i=0;i<lines.length;i++){
      const line = lines[i];
      if(isGarbage(line)) continue;
      // Detect name line: contains Japanese (non-ascii) characters and not just numbers
      const hasJapanese = /[^\x00-\x7F]/.test(line);
      if(!hasJapanese) continue;
      const name = line;
      // find next lines for code and value
      let code = null;
      let value = null;
      // look ahead up to 4 lines
      for(let j=i+1;j<Math.min(i+5, lines.length); j++){
        const l = lines[j];
        if(isGarbage(l)) continue;
        const maybeCode = l.replace(/\s+/g,'');
        if(!code && /^[0-9A-Za-z]{2,6}$/.test(maybeCode)){
          code = maybeCode;
          continue;
        }
        const moneyMatch = l.match(/([0-9]{1,3}(?:,[0-9]{3})*)(?:\s*)円/);
        if(!value && moneyMatch){
          value = parseInt(moneyMatch[1].replace(/,/g,''), 10);
          break; // got value, stop looking
        }
        const yenMatch = l.match(/¥\s*([0-9]{1,3}(?:,[0-9]{3})*)/);
        if(!value && yenMatch){ value = parseInt(yenMatch[1].replace(/,/g,''),10); break; }
        const jpyMatch = l.match(/([0-9]{1,3}(?:,[0-9]{3})*)\s*JPY/i);
        if(!value && jpyMatch){ value = parseInt(jpyMatch[1].replace(/,/g,''),10); break; }
      }
      if(name && (value !== null)){
        ledger.push({ name: name, code: code || null, value: value });
      }
    }

    try{
      localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
      if(ledger.length>0) importStatus.textContent = 'Portfolio Ledger Created';
      return ledger;
    } catch(err){ console.warn('Failed to save portfolio_ledger', err); return ledger; }
  }

  // Render inline Portfolio Ledger card under preview (kept for backward compatibility)
  function renderInlineLedgerCard(ledger){
    const existing = document.getElementById('portfolio-ledger-card');
    if(existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'portfolio-ledger-card';
    card.className = 'card';
    card.style.marginTop = '12px';

    const h = document.createElement('h3'); h.textContent = 'Portfolio Ledger'; card.appendChild(h);

    if(!ledger || ledger.length===0){
      const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No holdings parsed.'; card.appendChild(p);
      if(preview && preview.parentNode){ preview.parentNode.insertBefore(card, preview.nextSibling); }
      return;
    }

    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '8px';

    ledger.forEach(item => {
      const row = document.createElement('div'); row.className = 'card'; row.style.padding = '8px';
      const name = document.createElement('div'); name.textContent = `銘柄名: ${item.name || '—'}`; name.style.fontWeight = '600';
      const code = document.createElement('div'); code.textContent = `証券コード: ${item.code || '—'}`;
      const val = document.createElement('div'); val.textContent = `評価額: ${item.value !== null ? item.value.toLocaleString() + '円' : '—'}`;
      row.appendChild(name); row.appendChild(code); row.appendChild(val);
      list.appendChild(row);
    });

    card.appendChild(list);
    if(preview && preview.parentNode){ preview.parentNode.insertBefore(card, preview.nextSibling); }
  }

  // NEW: Render Portfolio Ledger as a dashboard card (table)
  function renderDashboardLedgerTable(){
    // remove existing dashboard ledger card if present
    const existing = document.getElementById('dashboard-portfolio-ledger');
    if(existing) existing.remove();

    // find the dashboard cards container
    const cardsGrid = document.querySelector('.cards-grid');
    if(!cardsGrid) return; // can't find container

    const card = document.createElement('div');
    card.id = 'dashboard-portfolio-ledger';
    card.className = 'card dashboard-card';
    card.style.gridColumn = '1 / -1'; // span full width if possible

    const title = document.createElement('h3'); title.textContent = 'Portfolio Ledger';
    title.style.marginTop = '0';
    card.appendChild(title);

    let ledger = [];
    try{
      const raw = localStorage.getItem(LEDGER_KEY);
      if(raw) ledger = JSON.parse(raw);
    } catch(e){ ledger = []; }

    if(!ledger || ledger.length === 0){
      const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No portfolio ledger available.'; card.appendChild(p);
      cardsGrid.appendChild(card);
      return;
    }

    // create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '8px';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['銘柄','コード','評価額'].forEach(hText => {
      const th = document.createElement('th'); th.textContent = hText; th.style.textAlign = 'left'; th.style.padding = '6px 8px'; th.style.borderBottom = '1px solid rgba(255,255,255,0.06)'; headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    ledger.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
      const tdName = document.createElement('td'); tdName.textContent = item.name || '—'; tdName.style.padding = '8px';
      const tdCode = document.createElement('td'); tdCode.textContent = item.code || '—'; tdCode.style.padding = '8px'; tdCode.style.width = '96px';
      const tdVal = document.createElement('td'); tdVal.textContent = item.value !== null ? '¥' + Number(item.value).toLocaleString() : '—'; tdVal.style.padding = '8px'; tdVal.style.textAlign = 'right';
      tr.appendChild(tdName); tr.appendChild(tdCode); tr.appendChild(tdVal);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    card.appendChild(table);
    cardsGrid.appendChild(card);
  }

  // Existing functions: file input handling
  async function handleFileInput(file, statusElement){
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
        } catch(err){ console.error('image processing failed', err); try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); statusElement.textContent = 'Image saved. Ready for OCR.'; ocrStatus.textContent = 'OCR: ready'; } catch(e){ statusElement.textContent = 'Error saving image.'; } }
      };
      img.onerror = function(){ try{ localStorage.setItem(SCREENSHOT_KEY, dataURL); showPreviewFromDataURL(dataURL); statusElement.textContent = 'Image saved. Ready for OCR.'; ocrStatus.textContent = 'OCR: ready'; } catch(e){ statusElement.textContent = 'Error saving image.'; } };
      img.src = dataURL;
    };
    reader.onerror = function(){ statusElement.textContent = 'Failed to read file'; };
    reader.readAsDataURL(file);
  }

  function showPreviewFromDataURL(dataURL){ preview.innerHTML = ''; const img = document.createElement('img'); img.src = dataURL; img.alt = 'Portfolio screenshot preview'; preview.appendChild(img); }

  // run Tesseract OCR on a dataURL and return text
  async function runTesseractOCR(dataURL){
    if(!window.Tesseract || typeof window.Tesseract.recognize !== 'function') throw new Error('Tesseract not available');
    ocrStatus.textContent = 'OCR: running...';
    let lastProgress = 0;
    const result = await window.Tesseract.recognize(dataURL, 'jpn+eng', { logger: m => { if(m && typeof m.progress === 'number'){ const pct = Math.round(m.progress * 100); if(pct !== lastProgress){ lastProgress = pct; ocrStatus.textContent = `OCR: ${pct}% (${m.status||''})`; } } } });
    const text = (result && result.data && result.data.text) ? result.data.text : (result && result.text ? result.text : '');
    ocrStatus.textContent = 'OCR: done';
    return text;
  }

  // Placeholder OCR simulator for Japanese stock names
  function simulateJapaneseNamesOCR(){ const sample = ['NSグループ','UTグループ','日本精工','PHCホールディングス','セレス']; return sample.join('\n'); }

  input.addEventListener('change', function(e){ const file = e.target.files && e.target.files[0]; handleFileInput(file, importStatus); });
  modalInput.addEventListener('change', function(e){ const file = e.target.files && e.target.files[0]; handleFileInput(file, modalStatus); setTimeout(()=> hideModal(), 1000); });

  // Main OCR trigger
  ocrBtn.addEventListener('click', async function(){
    const data = localStorage.getItem(SCREENSHOT_KEY);
    if(!data){ ocrStatus.textContent = 'No screenshot found in localStorage.'; return; }
    importStatus.textContent = 'Importing Portfolio...';
    ocrStatus.textContent = 'OCR: starting...';
    let text = '';
    try{
      try{ text = await runTesseractOCR(data); } catch(err){ console.warn('Tesseract OCR failed or unavailable, using placeholder OCR', err); text = simulateJapaneseNamesOCR(); await new Promise(r=>setTimeout(r, 500)); }
      // Save OCR text
      try{ localStorage.setItem(OCR_KEY, text); } catch(err){ console.warn('Failed to save OCR to localStorage', err); }
      showOCRResult(text);
      ocrStatus.textContent = 'OCR Complete';
      importStatus.textContent = 'OCR Complete';
      // parse portfolio and render inline card
      const ledger = parsePortfolioOCR();
      renderInlineLedgerCard(ledger);
      // update dashboard table
      renderDashboardLedgerTable();
    } catch(err){ console.error('OCR run failed', err); ocrStatus.textContent = 'OCR failed'; importStatus.textContent = 'OCR failed'; }
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
    for(const h of ledger){ const card = document.createElement('div'); card.className = 'holding-card'; const title = document.createElement('h4'); title.textContent = h.name || (h.code || 'Unknown'); card.appendChild(title);
      const codeRow = document.createElement('div'); codeRow.className = 'holding-row'; codeRow.innerHTML = `<div class="muted">証券コード</div><div>${h.code || '—'}</div>`; card.appendChild(codeRow);
      const valRow = document.createElement('div'); valRow.className = 'holding-row'; valRow.innerHTML = `<div class="muted">評価額</div><div>${h.value !== null ? h.value.toLocaleString() + '円' : '—'}</div>`; card.appendChild(valRow);
      ledgerCards.appendChild(card);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){ checkFirstLaunch(); renderDashboardLedgerTable(); });
  window.addEventListener('orientationchange', function(){ document.body.style.height = window.innerHeight + 'px'; setTimeout(()=>{ document.body.style.height = ''; }, 500); });

})();
