// script.js — PA-OS Portfolio Engine (AI start behavior: check portfolio_master.json before running)
(() => {
  // Utility functions
  function fmtYen(n){
    const sign = n > 0 ? '+' : (n < 0 ? '-' : '');
    return `${sign}¥${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
  }

  async function loadPortfolio(){
    // Only load from localStorage for dashboard; remove sample fallback
    const stored = localStorage.getItem('paos_portfolio');
    if(stored){
      try{ return JSON.parse(stored); } catch(e){ console.warn('Invalid stored portfolio', e); }
    }
    return null;
  }

  // Master portfolio loader used exclusively by Portfolio AI
  async function loadMasterPortfolio(){
    try{
      const res = await fetch('./portfolio_master.json', {cache: 'no-store'});
      if(res && res.ok){
        const master = await res.json();
        return master;
      }
    } catch(e){ /* ignore */ }
    return null;
  }

  async function savePortfolio(data){
    try{
      localStorage.setItem('paos_portfolio', JSON.stringify(data));
      return true;
    } catch(e){
      console.error('ポートフォリオ保存エラー', e);
      return false;
    }
  }

  function calculateTotalAssets(data){
    if(!data) return 0;
    const membersSum = (data.members || []).reduce((s,m)=> s + (Number(m.value)||0), 0);
    const cash = (data.portfolio && Number(data.portfolio.cash)) || 0;
    return membersSum + cash;
  }

  function calculateDailyProfit(data){
    if(!data) return 0;
    return (data.members || []).reduce((s,m)=> s + (Number(m.pnl)||0), 0);
  }

  function calculatePortfolioScore(data){
    if(!data) return 0;
    const total = calculateTotalAssets(data);
    const div = (data.portfolio && Number(data.portfolio.dividendIncome)) || 0;
    const rankMap = { 'A':3, 'B':2, 'C':1 };
    const avgGrowth = ((data.members||[]).reduce((s,m)=> s + (rankMap[m.growthRank]||1),0)) / Math.max(1,(data.members||[]).length);
    const tNorm = Math.min(1, total / 3000000);
    const dNorm = Math.min(1, div / 20000);
    const gNorm = avgGrowth / 3;
    const score = Math.round((tNorm*0.5 + dNorm*0.2 + gNorm*0.3) * 100);
    return score;
  }

  // Rendering functions (dashboard)
  function renderDashboard(data){
    if(!data) return;
    const guildNameEl = document.getElementById('guildName'); if(guildNameEl) guildNameEl.textContent = data.guild.name || '—';
    const guildRankEl = document.getElementById('guildRank'); if(guildRankEl) guildRankEl.textContent = '★'.repeat(data.guild.rank || 0);
    const masterNameEl = document.getElementById('masterName'); if(masterNameEl) masterNameEl.textContent = `マスター: ${data.master.name || '—'}`;
    const masterMetaEl = document.getElementById('masterMeta'); if(masterMetaEl) masterMetaEl.textContent = `レベル: ${data.master.level || '—'} ・ 指揮力: ${data.master.leadership || '—'}`;
    const total = calculateTotalAssets(data);
    const totalEl = document.getElementById('totalAssets'); if(totalEl) totalEl.textContent = `¥${total.toLocaleString()}`;
    const daily = calculateDailyProfit(data);
    const dailyEl = document.getElementById('dailyPnl'); if(dailyEl) dailyEl.textContent = fmtYen(daily);
    const dailyNoteEl = document.getElementById('dailyNote'); if(dailyNoteEl) dailyNoteEl.textContent = 'ポートフォリオ全体の変動';
    const dividendEl = document.getElementById('dividendIncome'); if(dividendEl) dividendEl.textContent = `¥${(data.portfolio.dividendIncome||0).toLocaleString()}`;
    const dividendNoteEl = document.getElementById('dividendNote'); if(dividendNoteEl) dividendNoteEl.textContent = '今月の予測';
    const partyRankEl = document.getElementById('partyRank'); if(partyRankEl) partyRankEl.textContent = `${(function(){ const s = calculatePortfolioScore(data); return s >= 85 ? 'Sランク' : s >= 70 ? 'Aランク' : s >= 50 ? 'Bランク' : 'Cランク'; })()}`;
    const partyNoteEl = document.getElementById('partyNote'); if(partyNoteEl) partyNoteEl.textContent = '構成スコア: ' + calculatePortfolioScore(data) + '/100';
    const risk = (data.portfolio && data.portfolio.risk) || 0;
    const riskLabel = document.getElementById('riskLabel'); if(riskLabel) riskLabel.textContent = `${risk}%`;
    const riskNote = document.getElementById('riskNote'); if(riskNote) riskNote.textContent = 'リスク評価 — ヘッジを用意';

    const missionContainer = document.getElementById('missionList');
    if(missionContainer){
      missionContainer.innerHTML = '';
      (data.portfolio.missions || []).forEach(m => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.className = 'mission'; cb.dataset.id = m.id; cb.checked = !!m.done;
        cb.addEventListener('change', ()=>{ m.done = cb.checked; savePortfolio(data); });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + m.text));
        li.appendChild(label);
        missionContainer.appendChild(li);
      });
    }

    const grid = document.getElementById('membersGrid');
    if(grid){
      grid.innerHTML = '';
      (data.members || []).forEach(mem => {
        const card = document.createElement('div'); card.className = 'member-card'; card.setAttribute('data-anim','');
        const avatar = document.createElement('div'); avatar.className = 'avatar two-head';
        const headL = document.createElement('span'); headL.className='head left';
        const headR = document.createElement('span'); headR.className='head right';
        avatar.appendChild(headL); avatar.appendChild(headR);
        const body = document.createElement('div'); body.className = 'member-body';
        const top = document.createElement('div'); top.className = 'm-top';
        const stock = document.createElement('div'); stock.className = 'stock'; stock.textContent = mem.name;
        const job = document.createElement('div'); job.className = 'job'; job.textContent = jobLabel(mem.job);
        top.appendChild(stock); top.appendChild(job);
        const stats = document.createElement('div'); stats.className = 'm-stats';
        const val = document.createElement('div'); val.className = 'value'; val.textContent = `評価額: ¥${(Number(mem.value)||0).toLocaleString()}`;
        const pnl = document.createElement('div'); pnl.className = 'pnl ' + ((mem.pnl>=0)?'up':'down'); pnl.textContent = `損益: ${fmtYen(mem.pnl||0)}`;
        const meta = document.createElement('div'); meta.className = 'm-meta'; meta.textContent = `レベル: ${mem.level || '—'} ・ 配当: ${mem.dividendRank || '—'} ・ 成長: ${mem.grow[...];
        stats.appendChild(val); stats.appendChild(pnl);
        body.appendChild(top); body.appendChild(stats); body.appendChild(meta);
        card.appendChild(avatar); card.appendChild(body);
        grid.appendChild(card);
      });
    }

    const bossRisk = document.getElementById('bossRisk'); if(bossRisk) bossRisk.textContent = `最大リスク: ${data.portfolio.risk}%`;
    const bossWeakness = document.getElementById('bossWeakness'); if(bossWeakness) bossWeakness.textContent = '弱点: 流動性の低い小型株の露出';
    const bossStrategy = document.getElementById('bossStrategy'); if(bossStrategy) bossStrategy.textContent = 'AI攻略法: ヘッジ追加・ポジション縮小・ディフェンシブ銘柄を増やす';

    setTimeout(()=>{
      document.querySelectorAll('[data-anim]').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*80));
      document.querySelectorAll('.member-card').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*60));
    }, 80);
  }

  function renderEmptyState(){
    // Show minimal home with message; keep AI start button visible
    const guildNameEl = document.getElementById('guildName'); if(guildNameEl) guildNameEl.textContent = '—';
    const guildRankEl = document.getElementById('guildRank'); if(guildRankEl) guildRankEl.textContent = '';
    const masterNameEl = document.getElementById('masterName'); if(masterNameEl) masterNameEl.textContent = '';
    const masterMetaEl = document.getElementById('masterMeta'); if(masterMetaEl) masterMetaEl.textContent = '';
    const totalEl = document.getElementById('totalAssets'); if(totalEl) totalEl.textContent = '初回セットアップが必要です';
    const dailyEl = document.getElementById('dailyPnl'); if(dailyEl) dailyEl.textContent = '';
    const dailyNoteEl = document.getElementById('dailyNote'); if(dailyNoteEl) dailyNoteEl.textContent = '';
    const dividendEl = document.getElementById('dividendIncome'); if(dividendEl) dividendEl.textContent = '';
    const dividendNoteEl = document.getElementById('dividendNote'); if(dividendNoteEl) dividendNoteEl.textContent = '';
    const partyRankEl = document.getElementById('partyRank'); if(partyRankEl) partyRankEl.textContent = '';
    const partyNoteEl = document.getElementById('partyNote'); if(partyNoteEl) partyNoteEl.textContent = '初回セットアップが必要です';
    const riskLabel = document.getElementById('riskLabel'); if(riskLabel) riskLabel.textContent = '';
    const riskNote = document.getElementById('riskNote'); if(riskNote) riskNote.textContent = '';

    const missionContainer = document.getElementById('missionList');
    if(missionContainer){ missionContainer.innerHTML = '<li>初回セットアップが必要です</li>'; }

    const grid = document.getElementById('membersGrid');
    if(grid){ grid.innerHTML = '<div class="card"><div class="card-body">初回セットアップが必要です</div></div>'; }

    const bossRisk = document.getElementById('bossRisk'); if(bossRisk) bossRisk.textContent = '';
    const bossWeakness = document.getElementById('bossWeakness'); if(bossWeakness) bossWeakness.textContent = '';
    const bossStrategy = document.getElementById('bossStrategy'); if(bossStrategy) bossStrategy.textContent = '';
  }

  function jobLabel(key){
    const map = {
      'Tank': '🛡 タンク',
      'Attacker': '⚔ アタッカー',
      'Sniper': '🏹 スナイパー',
      'Support': '📖 サポート',
      'Legendary': '✨ レジェンダリー'
    };
    return map[key] || key;
  }

  // AI report generation (simplified)
  async function generateDetailedReport(data){
    if(!data) return null;
    const total = calculateTotalAssets(data);
    const daily = calculateDailyProfit(data);
    const score = calculatePortfolioScore(data);
    const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
    const diagnosis = [];
    const holdingsCount = (data.members||[]).length;
    diagnosis.push('・分散性は' + (holdingsCount >=5 ? '高く' : 'やや低めで') + '安定したポートフォリオです。');
    diagnosis.push('・配当資産と成長資産のバランスは' + (Math.random()>0.4?'良好です。':'改善の余地があります。'));
    diagnosis.push('・日本株比率がやや高いため米国株を少し増やす余地があります。');

    const holdings = (data.members || []).map(m => ({ name: m.name, value: Number(m.value)||0, pnl: Number(m.pnl)||0, job: m.job, level: m.level, dividendRank: m.dividendRank, growthRank: m.growthRank }));
    const holdingsSum = holdings.reduce((s,h)=> s+h.value, 0) || 1;
    const holdingPercents = holdings.map(h=> ({ name: h.name, value: h.value, percent: Math.round((h.value/holdingsSum)*100), pnl: h.pnl, job: h.job, level: h.level, dividendRank: h.dividendRank, growthRank: h.growthRank }));

    holdingPercents.forEach(h => {
      const recScore = (h.growthRank==='A'?2: h.growthRank==='B'?1:0) + (h.dividendRank==='A'?1:0) + (h.pnl>0?1:0);
      if(recScore >=3) h.recommendation = 'buy'; else if(recScore >=2) h.recommendation = 'hold'; else if(recScore ===1) h.recommendation = 'watch'; else h.recommendation = 'sell';
      if(!h.aiComment || h.aiComment.length===0){ const lines = []; if(h.recommendation === 'buy') lines.push('・コア資産として非常に優秀'); if(h.recommendation === 'hold') lines.push('・保有継続推奨'); if(h.recommendation === 'watch') lines.push('・様子見、ニュースに注意'); if(h.recommendation === 'sell') lines.push('・利益確定を検討'); if(h.growthRank === 'A') lines.push('・成長評価が高い'); h.aiComment = lines; }
    });

    const sectorMap = { 'Tank':'防御', 'Attacker':'産業', 'Sniper':'宇宙/テック', 'Support':'テック', 'Legendary':'ハイテク' };
    const sectors = {};
    (data.members||[]).forEach(m => { const s = sectorMap[m.job] || 'その他'; sectors[s] = (sectors[s]||0) + (Number(m.value)||0); });
    const sectorArr = Object.keys(sectors).map(k=> ({ name:k, value: sectors[k] }));
    const sectorSum = sectorArr.reduce((s,x)=> s + x.value, 0) || 1;
    const sectorPercents = sectorArr.map(s=> ({ name: s.name, percent: Math.round((s.value/sectorSum)*100) }));

    const divScore = (data.members||[]).reduce((s,m)=> s + ({'A':3,'B':2,'C':1}[m.dividendRank]||1),0) / Math.max(1,(data.members||[]).length);
    const growthScore = (data.members||[]).reduce((s,m)=> s + ({'A':3,'B':2,'C':1}[m.growthRank]||1),0) / Math.max(1,(data.members||[]).length);
    const dividendEval = divScore >= 2.6 ? 'A' : divScore >= 1.8 ? 'B' : 'C';
    const growthEval = growthScore >= 2.6 ? 'A' : growthScore >= 1.8 ? 'B' : 'C';
    const risk = (data.portfolio && Number(data.portfolio.risk)) || 0;
    const riskEval = risk >= 70 ? '高' : risk >= 40 ? '中' : '低';

    const buy = [], hold = [], watch = [], sell = [];
    holdingPercents.forEach(h =>{ if(h.recommendation === 'buy') buy.push(h.name); else if(h.recommendation === 'hold') hold.push(h.name); else if(h.recommendation === 'watch') watch.push(h.name); else sell.push(h.name); });

    const comments = [];
    comments.push(`総合スコア: ${score} — 等級: ${grade}`);
    comments.push('テックとハイテクへの比率が高い場合、金利変動リスクに注意してください。');
    comments.push('配当利回りの高い銘柄はポートフォリオの安定化に寄与します。');

    const report = { grade, aiAnalysis: { grade: (function(){ if(score>=90) return 'A'; if(score>=75) return 'B'; if(score>=60) return 'C'; if(score>=45) return 'D'; return 'E'; })(), diagnosis }, totalAssets: total, dailyPnl: fmtYen(daily), holdings: holdingPercents, sectors: sectorPercents, dividendEval, growthEval, riskEval, aiComment: comments, buy, hold, watch, sell };
    return report;
  }

  function openPortfolioAI(report){
    try{ sessionStorage.setItem('paos_ai_report_detailed', JSON.stringify(report)); }
    catch(e){ console.error('sessionStorage error', e); }
    window.location.href = './portfolio-report.html';
  }

  // --- AI overlay flow ---
  function showAIOverlay(){ const overlay = document.getElementById('aiOverlay'); if(!overlay) return; overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden', 'false'); overlay.scrollTop = 0; }
  function hideAIOverlay(){ const overlay = document.getElementById('aiOverlay'); if(!overlay) return; overlay.style.display = 'none'; overlay.setAttribute('aria-hidden', 'true'); }

  function setProgress(pct){ const fill = document.getElementById('aiProgressFill'); const pctEl = document.getElementById('aiProgressPct'); if(fill) fill.style.width = `${pct}%`; if(pctEl) pctEl.textContent = `${Math.round(pct)}%`; const bar = document.querySelector('.progress-bar'); if(bar) bar.setAttribute('aria-valuenow', String(Math.round(pct))); }

  function markAgentDone(agentName){ const cards = Array.from(document.querySelectorAll('#aiAgents .agent-card')); const card = cards.find(c => c.getAttribute('data-agent') === agentName); if(card){ const status = card.querySelector('.agent-status'); if(status) status.textContent = 'Completed'; card.classList.add('done'); } }

  // runAISimulationAndNavigate now accepts a master portfolio object (must exist)
  async function runAISimulationAndNavigate(master){
    showAIOverlay();
    const steps = [ { key: 'loading', text: 'Loading portfolio...', duration: 700, agent: 'Chief AI' }, { key: 'market', text: 'Fetching market data...', duration: 1200, agent: 'Market AI' }, { key: 'news', text: 'Checking news...', duration: 900, agent: 'News AI' }, { key: 'risk', text: 'Risk analysis...', duration: 1000, agent: 'Risk AI' }, { key: 'dividend', text: 'Dividend analysis...', duration: 900, agent: 'Dividend AI' }, { key: 'generate', text: 'Generating AI report...', duration: 1100, agent: 'Technical AI' } ];

    const stepEls = Array.from(document.querySelectorAll('#aiSteps li'));
    stepEls.forEach((el)=> { el.classList.remove('done'); el.classList.remove('active'); el.style.opacity = '0.9'; });

    const totalDuration = steps.reduce((s,st)=> s + st.duration, 0);
    let elapsed = 0; setProgress(0); const startTime = Date.now();
    const progInterval = setInterval(()=>{ const now = Date.now(); const t = now - startTime; const pct = Math.min(100, (t / totalDuration) * 100); setProgress(pct); }, 80);

    for(let i=0;i<steps.length;i++){ const st = steps[i]; const el = stepEls[i]; if(el) el.classList.add('active'); await new Promise(r => setTimeout(r, st.duration)); if(el){ el.classList.remove('active'); el.classList.add('done'); } elapsed += st.duration; const pctNow = Math.min(100, (elapsed / totalDuration) * 100); setProgress(pctNow); markAgentDone(st.agent); }

    setProgress(100); clearInterval(progInterval); await new Promise(r => setTimeout(r, 600));

    // master should be provided; fallback to attempting to load if not
    let usedMaster = master;
    if(!usedMaster){
      usedMaster = await loadMasterPortfolio();
      if(!usedMaster){
        // missing master: close overlay and show setup once
        hideAIOverlay();
        const seen = localStorage.getItem('paos_ledger_initialized') === '1';
        if(!seen){ localStorage.setItem('paos_ledger_initialized','1'); showSetupOverlay(); }
        else { showSetupOverlay(); }
        return;
      }
    }

    const members = (usedMaster.holdings || []).map(h => ({ name: h.name || h.ticker || '—', job: 'Support', level: 1, value: Number(h.currentValue)||0, pnl: Number(h.profit)||0, dividendRank: 'C', growthRank: 'B' }));
    const data = { guild: { name: 'Imported', rank: 1 }, master: { name: 'Importer', level: 1, leadership: 'C' }, portfolio: { cash: 0, totalAssets: 0, dailyProfit: 0, rank: 0, dividendIncome: 0, risk: 0, missions: [] }, members };
    data.portfolio.totalAssets = calculateTotalAssets(data);
    data.portfolio.dailyProfit = calculateDailyProfit(data);

    let report = null; try{ report = await generateDetailedReport(data); } catch(e){ console.error('Report generation error', e); }
    if(report){ try{ sessionStorage.setItem('paos_ai_report_detailed', JSON.stringify(report)); } catch(e){} }

    window.location.href = './portfolio-report.html';
  }

  // --- First-time setup helpers ---
  function showSetupOverlay(){ const overlay = document.getElementById('setupOverlay'); if(!overlay) return; overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden', 'false'); }
  function hideSetupOverlay(){ const overlay = document.getElementById('setupOverlay'); if(!overlay) return; overlay.style.display = 'none'; overlay.setAttribute('aria-hidden', 'true'); }
  function createPlaceholderLedger(){ const placeholder = { guild: { name: 'マイギルド', rank: 1 }, master: { name: 'あなた', level: 1, leadership: 'C' }, portfolio: { cash: 0, totalAsset[...];

  // ---- UPDATED: chooseScreenshotBtn handler ----
  const chooseBtn = document.getElementById('chooseScreenshotBtn');
  if(chooseBtn){
    chooseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Find the real file input
      const fileInput = document.getElementById('screenshotFileInput');
      const importStatus = document.getElementById('importStatus');
      if(!fileInput){
        console.error('screenshotFileInput not found');
        if(importStatus) importStatus.textContent = 'ファイル入力が見つかりません';
        return;
      }

      // One-time change handler for the selected file
      const onChange = async (ev) => {
        try{
          const files = ev.target.files;
          if(!files || files.length === 0){
            // user cancelled — keep overlay open and state unchanged
            if(importStatus) importStatus.textContent = '選択がキャンセルされました';
            return;
          }

          const file = files[0];
          if(importStatus) importStatus.textContent = '画像を受信しました。インポートを開始します…';

          // Read file as data URL (no OCR)
          const dataUrl = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = (e) => reject(e);
            fr.readAsDataURL(file);
          });

          try{ sessionStorage.setItem('paos_import_image', dataUrl); } catch(e){ console.warn('sessionStorage write failed', e); }

          // Create ledger if possible
          if(window.PAOS && window.PAOS.Ledger && typeof window.PAOS.Ledger.createLedger === 'function'){
            try{ await window.PAOS.Ledger.createLedger(); } catch(e){ console.error('createLedger failed', e); }
          }

          if(importStatus) importStatus.textContent = 'インポートをキューに登録しました（OCR未実装）';

        } catch(err){
          console.error('Error handling selected file', err);
          if(importStatus) importStatus.textContent = 'インポート中にエラーが発生しました';
        } finally{
          // reset input so same file can be selected again
          try{ fileInput.value = ''; } catch(e){}
        }
      };

      // Attach once
      fileInput.addEventListener('change', onChange, { once: true });

      // Trigger platform file picker (iOS Safari will open photo picker)
      try{ fileInput.click(); } catch(e){ console.error('fileInput.click failed', e); if(importStatus) importStatus.textContent = 'ファイルピッカーを開けませんでした'; }
    });
  }

  // Initialize
  window.addEventListener('load', async ()=>{
    const startBtn = document.getElementById('startBtn');
    const floating = document.getElementById('floatingStart');

    const data = await loadPortfolio();
    if(data){ renderDashboard(data); }
    else { renderEmptyState(); }

    // Note: chooseScreenshotBtn handler updated above

    if(startBtn) startBtn.addEventListener('click', startPortfolioAI);
    if(floating) floating.addEventListener('click', startPortfolioAI);
    document.querySelectorAll('.nav-item').forEach(it=>{ it.addEventListener('click', ()=>{ document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active')); it.classList.add('active'); }); });
  });

  window.paos = { loadPortfolio, savePortfolio, calculateTotalAssets, calculateDailyProfit, calculatePortfolioScore, requestDetailedReport };
})();
