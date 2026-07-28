// script.js — PA-OS Portfolio Engine v1
(() => {
  // Utility functions
  function fmtYen(n){
    const sign = n > 0 ? '+' : (n < 0 ? '-' : '');
    return `${sign}¥${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
  }

  async function loadPortfolio(){
    // Prefer session copy if edited; otherwise load portfolio.json
    const stored = localStorage.getItem('paos_portfolio');
    if(stored){
      try{ return JSON.parse(stored); } catch(e){}
    }
    try{
      const res = await fetch('./portfolio.json', {cache: 'no-store'});
      const data = await res.json();
      // compute derived fields
      data.portfolio.totalAssets = calculateTotalAssets(data);
      data.portfolio.dailyProfit = calculateDailyProfit(data);
      return data;
    } catch(e){
      console.error('ポートフォリオ読み込みエラー', e);
      return null;
    }
  }

  async function savePortfolio(data){
    // Save to localStorage as a local "DB"
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
    // Simple heuristic: combine normalized total assets, dividendIncome, growth ranks
    if(!data) return 0;
    const total = calculateTotalAssets(data);
    const div = (data.portfolio && Number(data.portfolio.dividendIncome)) || 0;
    // compute avg growth rank numeric A->3 B->2 C->1
    const rankMap = { 'A':3, 'B':2, 'C':1 };
    const avgGrowth = ((data.members||[]).reduce((s,m)=> s + (rankMap[m.growthRank]||1),0)) / Math.max(1,(data.members||[]).length);
    // normalize
    const tNorm = Math.min(1, total / 3000000); // assume 3M is excellent
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

    // totals
    const total = calculateTotalAssets(data);
    document.getElementById('totalAssets').textContent = `¥${total.toLocaleString()}`;
    const daily = calculateDailyProfit(data);
    document.getElementById('dailyPnl').textContent = fmtYen(daily);
    document.getElementById('dailyNote').textContent = 'ポートフォリオ全体の変動';

    document.getElementById('dividendIncome').textContent = `¥${(data.portfolio.dividendIncome||0).toLocaleString()}`;
    document.getElementById('dividendNote').textContent = '今月の予測';

    document.getElementById('partyRank').textContent = `${(function(){ const s = calculatePortfolioScore(data); return s >= 85 ? 'Sランク' : s >= 70 ? 'Aランク' : s >= 50 ? 'Bランク' : 'Cランク';})()}`;
    document.getElementById('partyNote').textContent = '構成スコア: ' + calculatePortfolioScore(data) + '/100';

    // risk
    const risk = (data.portfolio && data.portfolio.risk) || 0;
    document.getElementById('riskLabel').textContent = `${risk}%`;
    document.getElementById('riskNote').textContent = 'リスク評価 — ヘッジを用意';

    // missions
    const missionContainer = document.getElementById('missionList');
    missionContainer.innerHTML = '';
    (data.portfolio.missions || []).forEach(m => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.className = 'mission'; cb.dataset.id = m.id; cb.checked = !!m.done;
      cb.addEventListener('change', ()=>{
        // update data and save
        m.done = cb.checked;
        savePortfolio(data);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + m.text));
      li.appendChild(label);
      missionContainer.appendChild(li);
    });

    // members
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

    // boss
    document.getElementById('bossRisk').textContent = `最大リスク: ${data.portfolio.risk}%`; 
    document.getElementById('bossWeakness').textContent = '弱点: 流動性の低い小型株の露出';
    document.getElementById('bossStrategy').textContent = 'AI攻略法: ヘッジ追加・ポジション縮小・ディ���ェンシブ銘柄を増やす';

    // trigger awaken animation on newly generated elements
    setTimeout(()=>{
      document.querySelectorAll('[data-anim]').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*80));
      document.querySelectorAll('.member-card').forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*60));
    }, 80);
  }

  function jobLabel(key){
    // Map job keys to Japanese labels with icons
    const map = {
      'Tank': '🛡 タンク',
      'Attacker': '⚔ アタッカー',
      'Sniper': '🏹 スナイパー',
      'Support': '📖 サポート',
      'Legendary': '✨ レジェンダリー'
    };
    return map[key] || key;
  }

  // AI workflow
  async function generateAIReport(data){
    const report = [];
    report.push(`総資産: ¥${calculateTotalAssets(data).toLocaleString()}`);
    report.push(`本日の損益: ${fmtYen(calculateDailyProfit(data))}`);
    report.push(`ポートフォリオスコア: ${calculatePortfolioScore(data)}/100`);
    report.push(`リスク評価: ${data.portfolio.risk}%`);
    report.push('推奨アクション: ヘッジ追加、テック比率の調整、配当銘柄の確保');
    // simple member highlights
    const sorted = (data.members||[]).slice().sort((a,b)=> (b.pnl||0)-(a.pnl||0));
    report.push('注目メンバー:');
    sorted.slice(0,3).forEach(m => report.push(` ・ ${m.name}: 損益 ${fmtYen(m.pnl||0)}, 評価額 ¥${(m.value||0).toLocaleString()}`));
    return report;
  }

  function openAnalysis(reportLines){
    // store report in sessionStorage and open analysis.html
    try{ sessionStorage.setItem('paos_ai_report', JSON.stringify(reportLines)); }
    catch(e){ console.error('sessionStorage error', e); }
    window.open('./analysis.html','_self');
  }

  // Bind buttons
  async function onStart(){
    const data = await loadPortfolio();
    if(!data) return alert('ポートフォリオを読み込めませんでした');
    // update derived
    data.portfolio.totalAssets = calculateTotalAssets(data);
    data.portfolio.dailyProfit = calculateDailyProfit(data);
    await savePortfolio(data);
    renderDashboard(data);
    const report = await generateAIReport(data);
    openAnalysis(report);
  }

  // init
  window.addEventListener('load', async ()=>{
    const data = await loadPortfolio();
    if(data){ renderDashboard(data); }
    // bind start buttons
    const startBtn = document.getElementById('startBtn');
    const floating = document.getElementById('floatingStart');
    if(startBtn) startBtn.addEventListener('click', onStart);
    if(floating) floating.addEventListener('click', onStart);

    // nav simple handlers
    document.querySelectorAll('.nav-item').forEach(it=>{
      it.addEventListener('click', ()=>{
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        it.classList.add('active');
      });
    });
  });

  // Expose functions for debugging
  window.paos = {
    loadPortfolio, savePortfolio, calculateTotalAssets, calculateDailyProfit, calculatePortfolioScore
  };

})();
