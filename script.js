// script.js — PA-OS Portfolio Engine v1 (updated: Portfolio AI Engine v2)
(() => {
  // Utility functions
  function fmtYen(n){
    const sign = n > 0 ? '+' : (n < 0 ? '-' : '');
    return `${sign}¥${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
  }

  async function loadPortfolio(){
    const stored = localStorage.getItem('paos_portfolio');
    if(stored){
      try{ return JSON.parse(stored); } catch(e){}
    }
    try{
      const res = await fetch('./portfolio.json', {cache: 'no-store'});
      const data = await res.json();
      data.portfolio.totalAssets = calculateTotalAssets(data);
      data.portfolio.dailyProfit = calculateDailyProfit(data);
      return data;
    } catch(e){
      console.error('ポートフォリオ読み込みエラー', e);
      return null;
    }
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

  // Rendering functions
  function renderDashboard(data){
    if(!data) return;
    document.getElementById('guildName').textContent = data.guild.name || '—';
    document.getElementById('guildRank').textContent = '★'.repeat(data.guild.rank || 0);
    document.getElementById('masterName').textContent = `マスター: ${data.master.name || '—'}`;
    document.getElementById('masterMeta').textContent = `レベル: ${data.master.level || '—'} ・ 指揮力: ${data.master.leadership || '—'}`;
    const total = calculateTotalAssets(data);
    document.getElementById('totalAssets').textContent = `¥${total.toLocaleString()}`;
    const daily = calculateDailyProfit(data);
    document.getElementById('dailyPnl').textContent = fmtYen(daily);
    document.getElementById('dailyNote').textContent = 'ポートフォリオ全体の変動';
    document.getElementById('dividendIncome').textContent = `¥${(data.portfolio.dividendIncome||0).toLocaleString()}`;
    document.getElementById('dividendNote').textContent = '今月の予測';
    document.getElementById('partyRank').textContent = `${(function(){ const s = calculatePortfolioScore(data); return s >= 85 ? 'Sランク' : s >= 70 ? 'Aランク' : s >= 50 ? 'Bランク' : 'Cランク';})()}`;
    document.getElementById('partyNote').textContent = '構成スコア: ' + calculatePortfolioScore(data) + '/100';
    const risk = (data.portfolio && data.portfolio.risk) || 0;
    document.getElementById('riskLabel').textContent = `${risk}%`;
    document.getElementById('riskNote').textContent = 'リスク評価 — ヘッジを用意';
    const missionContainer = document.getElementById('missionList');
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
    const grid = document.getElementById('membersGrid');
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
      const meta = document.createElement('div'); meta.className = 'm-meta'; meta.textContent = `レベル: ${mem.level || '—'} ・ 配当: ${mem.dividendRank || '—'} ・ 成長: ${mem.growthRank || '—'}`;
      stats.appendChild(val); stats.appendChild(pnl);
      body.appendChild(top); body.appendChild(stats); body.appendChild(meta);
      card.appendChild(avatar); card.appendChild(body);
      grid.appendChild(card);
    });
    document.getElementById('bossRisk').textContent = `最大リスク: ${data.portfolio.risk}%`;
    document.getElementById('bossWeakness').textContent = '弱点: 流動性の低い小型株の露出';
    document.getElementById('bossStrategy').textContent = 'AI攻略法: ヘッジ追加・ポジション縮小・ディフェンシブ銘柄を増やす';
    setTimeout(()=>{
      document.querySelectorAll('[data-anim]').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*80));
      document.querySelectorAll('.member-card').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*60));
    }, 80);
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

  // AI report generation (detailed)
  async function generateDetailedReport(data){
    const total = calculateTotalAssets(data);
    const daily = calculateDailyProfit(data);
    const score = calculatePortfolioScore(data);
    const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
    // holdings percent
    const holdings = (data.members || []).map(m => ({ name: m.name, value: Number(m.value)||0 }));
    const holdingsSum = holdings.reduce((s,h)=> s+h.value, 0) || 1;
    const holdingPercents = holdings.map(h=> ({ name: h.name, value: h.value, percent: Math.round((h.value/holdingsSum)*100) }));
    // sectors heuristic by job
    const sectorMap = {
      'Tank':'防御', 'Attacker':'産業', 'Sniper':'宇宙/テック', 'Support':'テック', 'Legendary':'ハイテク'
    };
    const sectors = {};
    (data.members||[]).forEach(m => { const s = sectorMap[m.job] || 'その他'; sectors[s] = (sectors[s]||0) + (Number(m.value)||0); });
    const sectorArr = Object.keys(sectors).map(k=> ({ name:k, value: sectors[k] }));
    const sectorSum = sectorArr.reduce((s,x)=> s + x.value, 0) || 1;
    const sectorPercents = sectorArr.map(s=> ({ name: s.name, percent: Math.round((s.value/sectorSum)*100) }));
    // dividend & growth eval (simple aggregation)
    const divScore = (data.members||[]).reduce((s,m)=> s + ({'A':3,'B':2,'C':1}[m.dividendRank]||1),0) / Math.max(1,(data.members||[]).length);
    const growthScore = (data.members||[]).reduce((s,m)=> s + ({'A':3,'B':2,'C':1}[m.growthRank]||1),0) / Math.max(1,(data.members||[]).length);
    const dividendEval = divScore >= 2.6 ? 'A' : divScore >= 1.8 ? 'B' : 'C';
    const growthEval = growthScore >= 2.6 ? 'A' : growthScore >= 1.8 ? 'B' : 'C';
    // risk eval
    const risk = (data.portfolio && Number(data.portfolio.risk)) || 0;
    const riskEval = risk >= 70 ? '高' : risk >= 40 ? '中' : '低';
    // buy/hold/watch/sell heuristics
    const buy = [], hold = [], watch = [], sell = [];
    (data.members||[]).forEach(m =>{
      // strong growth & low pnl negative -> buy
      if(m.growthRank === 'A' && m.pnl >= 0) buy.push(m.name);
      else if(m.growthRank === 'A' && m.pnl < 0) watch.push(m.name);
      else if(m.growthRank === 'B' && m.dividendRank === 'A') hold.push(m.name);
      else if(m.pnl < 0 && m.growthRank === 'C') sell.push(m.name);
      else hold.push(m.name);
    });
    // AI comments
    const comments = [];
    comments.push(`総合スコア: ${score} — 等級: ${grade}`);
    comments.push('テックとハイテクへの比率が高い場合、金利変動リスクに注意してください。');
    comments.push('配当利回りの高い銘柄はポートフォリオの安定化に寄与します。');
    // assemble
    const report = {
      grade, totalAssets: total, dailyPnl: fmtYen(daily), holdings: holdingPercents,
      sectors: sectorPercents, dividendEval, growthEval, riskEval, aiComment: comments,
      buy, hold, watch, sell
    };
    return report;
  }

  function openPortfolioAI(report){
    try{ sessionStorage.setItem('paos_ai_report_detailed', JSON.stringify(report)); }
    catch(e){ console.error('sessionStorage error', e); }
    // open in same window to preserve navigation
    window.location.href = './portfolio-ai.html';
  }

  // Bind buttons
  async function onStart(){
    const data = await loadPortfolio();
    if(!data) return alert('ポートフォリオを読み込めませんでした');
    data.portfolio.totalAssets = calculateTotalAssets(data);
    data.portfolio.dailyProfit = calculateDailyProfit(data);
    await savePortfolio(data);
    renderDashboard(data);
    // generate detailed report
    const report = await generateDetailedReport(data);
    openPortfolioAI(report);
  }

  // Expose a requestDetailedReport method for popup to call (not used here but for completeness)
  async function requestDetailedReport(){
    const data = await loadPortfolio();
    if(!data) return null;
    const report = await generateDetailedReport(data);
    try{ sessionStorage.setItem('paos_ai_report_detailed', JSON.stringify(report)); }
    catch(e){}
    return report;
  }

  window.addEventListener('load', async ()=>{
    const data = await loadPortfolio();
    if(data){ renderDashboard(data); }
    const startBtn = document.getElementById('startBtn');
    const floating = document.getElementById('floatingStart');
    if(startBtn) startBtn.addEventListener('click', onStart);
    if(floating) floating.addEventListener('click', onStart);
    document.querySelectorAll('.nav-item').forEach(it=>{ it.addEventListener('click', ()=>{ document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active')); it.classList.add('active'); }); });
  });

  // Expose functions for debugging
  window.paos = {
    loadPortfolio, savePortfolio, calculateTotalAssets, calculateDailyProfit, calculatePortfolioScore, requestDetailedReport
  };

})();
