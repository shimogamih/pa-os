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
      // if screenshot present, show preview and OCR text
      const data = localStorage.getItem(SCREENSHOT_KEY);
      if(data) showPreviewFromDataURL(data);
      const savedOCR = localStorage.getItem(OCR_KEY);
      if(savedOCR) showOCRResult(savedOCR);
      // If OCR exists but ledger missing, try to generate ledger
      const ledger = localStorage.getItem(LEDGER_KEY);
      if(savedOCR && !ledger){
        generateLedgerFromOCR();
      }
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

  openLedgerBtn.addEventListener('click', function(){
    renderLedgerScreen();
    showLedgerScreen();
  });
  closeLedgerBtn.addEventListener('click', hideLedgerScreen);

  function showLedgerScreen(){
    ledgerScreen.setAttribute('aria-hidden','false');
  }
  function hideLedgerScreen(){
    ledgerScreen.setAttribute('aria-hidden','true');
  }

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

  // Parsing helpers — conservative: return null if not certain
  function numberFromStringStrict(s){
    if(!s) return null;
    // match numbers with optional commas and decimals
    const m = s.replace(/\s+/g,'').match(/^[+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?|^[+-]?\d+\.\d+$/);
    if(!m) return null;
    const num = parseFloat(m[0].replace(/,/g,''));
    return isNaN(num) ? null : num;
  }

  function extractAllNumbers(line){
    const matches = line.match(/([+-]?\d{1,3}(?:,\d{3})*(?:\.\d+)?|[+-]?\d+\.\d+)/g);
    if(!matches) return [];
    return matches.map(s => parseFloat(s.replace(/,/g,''))).filter(n => !isNaN(n));
  }

  function parseOCRLineToHolding(line){
    // Conservative parsing: only assign numeric fields if clearly parseable
    const cleaned = line.replace(/\u2013|\u2014|–/g,'-').trim();
    if(!cleaned) return null;

    // Try to find code in parentheses or trailing token like (ABC) or ABC
    let code = null;
    const paren = cleaned.match(/\(([^)]+)\)/);
    if(paren && paren[1]){
      const maybe = paren[1].trim();
      if(/^[A-Z0-9.-]{1,10}$/i.test(maybe)) code = maybe;
    }

    // Extract numbers conservatively
    const numbers = extractAllNumbers(cleaned);
    // We'll not guess positions; instead we'll try patterns commonly seen:
    // Patterns: Name Code Shares Avg Current P/L  OR Name (Code) Shares Avg Current P/L

    // Extract name: take text before first number or before code token
    let name = null;
    const numIdx = cleaned.search(/[0-9]/);
    if(numIdx > 0){
      name = cleaned.slice(0, numIdx).replace(/\([^)]*\)/g,'').trim();
    } else {
      // no numbers — use full line minus parentheses
      name = cleaned.replace(/\([^)]*\)/g,'').trim();
    }
    if(!name) name = null;

    // Heuristic assignment: if numbers length >= 1 -> shares maybe; >=2 avgPrice etc
    let shares = null, averagePrice = null, currentPrice = null, profitLoss = null, marketValue = null;
    if(numbers.length >= 1) shares = Number.isFinite(numbers[0]) ? numbers[0] : null;
    if(numbers.length >= 2) averagePrice = Number.isFinite(numbers[1]) ? numbers[1] : null;
    if(numbers.length >= 3) currentPrice = Number.isFinite(numbers[2]) ? numbers[2] : null;
    if(numbers.length >= 4) profitLoss = Number.isFinite(numbers[3]) ? numbers[3] : null;

    // marketValue: only compute if shares and currentPrice present
    if(shares !== null && currentPrice !== null) marketValue = shares * currentPrice; else marketValue = null;
    // profitLoss: if not present but we have avgPrice and marketValue and shares, compute
    if(profitLoss === null){
      if(shares !== null && averagePrice !== null && currentPrice !== null){
        profitLoss = (currentPrice - averagePrice) * shares;
      } else {
        profitLoss = null;
      }
    }

    return {
      name: name || null,
      code: code || null,
      shares: (shares === null || isNaN(shares)) ? null : shares,
      averagePrice: (averagePrice === null || isNaN(averagePrice)) ? null : averagePrice,
      currentPrice: (currentPrice === null || isNaN(currentPrice)) ? null : currentPrice,
      marketValue: (marketValue === null || isNaN(marketValue)) ? null : marketValue,
      profitLoss: (profitLoss === null || isNaN(profitLoss)) ? null : profitLoss
    };
  }

  function generateLedgerFromOCR(){
    const ocr = localStorage.getItem(OCR_KEY) || '';
    if(!ocr){
      importStatus.textContent = 'No OCR text available to generate ledger.';
      return null;
    }
    const lines = ocr.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
    const entries = [];
    for(const line of lines){
      // skip headings or totals
      if(/^total/i.test(line) || /^value/i.test(line) || /^cash/i.test(line) || /^portfolio/i.test(line)) continue;
      const holding = parseOCRLineToHolding(line);
      if(!holding) continue;
      // Require at least a name or code; also skip lines with no numeric and no code
      const hasNumeric = (holding.shares !== null || holding.averagePrice !== null || holding.currentPrice !== null || holding.profitLoss !== null || holding.marketValue !== null);
      if(!holding.name && !holding.code) continue;
      if(!hasNumeric && !holding.code) continue;
      entries.push(holding);
    }
    try{
      localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
      importStatus.textContent = 'Portfolio Ledger Created';
      // After creation render ledger screen
      renderLedgerScreen();
      showLedgerScreen();
      return entries;
    } catch(err){
      console.error('Failed to save ledger', err);
      importStatus.textContent = 'Failed to create ledger';
      return null;
    }
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

            // Generate ledger from OCR
            generateLedgerFromOCR();

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
              generateLedgerFromOCR();
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
            generateLedgerFromOCR();
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
      // regenerate ledger each time OCR runs manually
      generateLedgerFromOCR();
      ocrStatus.textContent = 'OCR complete (manual)';
    } catch(err){
      console.error('Manual OCR failed', err);
      ocrStatus.textContent = 'OCR failed';
    }
  });

  function renderLedgerScreen(){
    // Read ledger from localStorage (if not present, generate from OCR)
    let ledger = [];
    const raw = localStorage.getItem(LEDGER_KEY);
    if(raw){
      try{ ledger = JSON.parse(raw); } catch(e){ ledger = []; }
    } else {
      const generated = generateLedgerFromOCR();
      ledger = generated || [];
    }

    // Calculate totals (sum only defined numbers)
    let totalAssets = 0;
    let totalProfit = 0;
    let count = ledger.length;
    for(const h of ledger){
      if(h.marketValue !== null && !isNaN(h.marketValue)) totalAssets += Number(h.marketValue);
      if(h.profitLoss !== null && !isNaN(h.profitLoss)) totalProfit += Number(h.profitLoss);
    }

    totalAssetsEl.textContent = totalAssets ? totalAssets.toLocaleString() : '—';
    totalProfitEl.textContent = totalProfit ? totalProfit.toLocaleString() : '—';
    numHoldingsEl.textContent = count;

    ledgerCards.innerHTML = '';
    if(ledger.length === 0){
      const msg = document.createElement('div');
      msg.className = 'card';
      msg.textContent = 'No holdings found in OCR data.';
      ledgerCards.appendChild(msg);
      return;
    }

    for(const h of ledger){
      const card = document.createElement('div');
      card.className = 'holding-card';
      const title = document.createElement('h4');
      title.textContent = h.name || (h.code || 'Unknown');
      card.appendChild(title);

      const codeRow = document.createElement('div'); codeRow.className = 'holding-row';
      codeRow.innerHTML = `<div class="muted">Code</div><div>${h.code || '—'}</div>`;
      card.appendChild(codeRow);

      const sharesRow = document.createElement('div'); sharesRow.className = 'holding-row';
      sharesRow.innerHTML = `<div class="muted">Shares</div><div>${h.shares !== null ? h.shares : '—'}</div>`;
      card.appendChild(sharesRow);

      const avgRow = document.createElement('div'); avgRow.className = 'holding-row';
      avgRow.innerHTML = `<div class="muted">Average Price</div><div>${h.averagePrice !== null ? h.averagePrice : '—'}</div>`;
      card.appendChild(avgRow);

      const curRow = document.createElement('div'); curRow.className = 'holding-row';
      curRow.innerHTML = `<div class="muted">Current Price</div><div>${h.currentPrice !== null ? h.currentPrice : '—'}</div>`;
      card.appendChild(curRow);

      const mvRow = document.createElement('div'); mvRow.className = 'holding-row';
      mvRow.innerHTML = `<div class="muted">Market Value</div><div>${h.marketValue !== null ? h.marketValue : '—'}</div>`;
      card.appendChild(mvRow);

      const plRow = document.createElement('div'); plRow.className = 'holding-row';
      plRow.innerHTML = `<div class="muted">Profit/Loss</div><div>${h.profitLoss !== null ? h.profitLoss : '—'}</div>`;
      card.appendChild(plRow);

      ledgerCards.appendChild(card);
    }
  }

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
