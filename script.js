// script.js — PA-OS v3 インタラクションとアニメーション（日本語���
(() => {
  const cards = Array.from(document.querySelectorAll('[data-anim]'));
  const members = Array.from(document.querySelectorAll('.member-card'));
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const startBtn = document.getElementById('startBtn');
  const floatingStart = document.getElementById('floatingStart');

  function awaken(){
    const all = cards.concat(members);
    all.forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*90));
  }

  function animateCounters(){
    document.querySelectorAll('[data-target]').forEach(el => {
      const raw = el.getAttribute('data-target');
      const target = parseInt(raw.replace(/[^0-9\-\+]/g,''),10) || 0;
      const start = 0;
      const duration = 900;
      let startTime = null;
      function step(ts){
        if(!startTime) startTime = ts;
        const progress = Math.min((ts-startTime)/duration,1);
        const val = Math.round(start + (target-start)*progress);
        const sign = raw.trim().startsWith('+')?'+':'';
        el.textContent = (sign + val.toLocaleString('en-US')) ? `${sign}¥${Math.abs(val).toLocaleString()}` : `¥${val}`;
        if(progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ミッ��ョンの状態を復元/保存
  function loadMissions(){
    const checks = document.querySelectorAll('.mission');
    checks.forEach(cb => {
      const id = cb.getAttribute('data-id');
      const stored = localStorage.getItem('mission_' + id);
      if(stored === '1') cb.checked = true;
      cb.addEventListener('change', ()=>{
        localStorage.setItem('mission_' + id, cb.checked ? '1' : '0');
      });
    });
  }

  window.addEventListener('load', ()=>{
    awaken();
    animateCounters();
    loadMissions();

    // 円形メーター
    document.querySelectorAll('.radial .meter').forEach(m => {
      const label = m.closest('.radial').querySelector('.radial-label');
      let val = label ? parseInt(label.textContent,10) : 50;
      val = Math.max(0,Math.min(100,val));
      const circumference = 2 * Math.PI * 15.9;
      const filled = circumference * (val/100);
      m.style.strokeDasharray = `${filled} ${circumference}`;
      m.style.strokeDashoffset = `${circumference - filled}`;
    });
  });

  // ナビ操作（日本語ラベルに基づく）
  navItems.forEach(item => {
    item.addEventListener('click', ()=>{
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      item.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:300,easing:'ease-out'});
      const nav = item.getAttribute('data-nav');
      if(nav === 'ギルド') document.querySelector('.guild-card').scrollIntoView({behavior:'smooth',block:'center'});
      if(nav === '資産') document.querySelector('.dashboard-grid').scrollIntoView({behavior:'smooth',block:'start'});
      if(nav === 'ホーム') window.scrollTo({top:0,behavior:'smooth'});
      if(nav === '市場') document.querySelector('.dashboard-grid').scrollIntoView({behavior:'smooth',block:'start'});
      if(nav === 'ポートフォリオAI') invokeAI();
    });
  });

  // 起動アニメーションと日本語通知
  function invokeAI(){
    const all = cards.concat(members);
    all.forEach((c,i)=>{
      setTimeout(()=>{
        c.animate([
          { transform: 'scale(1)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' },
          { transform: 'scale(1.02)', boxShadow: '0 30px 70px rgba(46,35,71,0.45)' },
          { transform: 'scale(1)' }
        ],{duration:900,iterations:1,easing:'ease-in-out'});
      }, i*60);
    });
    const bg = document.querySelector('.bg-orbit');
    if(bg) bg.animate([{opacity:0.4},{opacity:1},{opacity:0.4}],{duration:1200,iterations:1});
    setTimeout(()=> alert('ポートフォリオAI を起動します'), 200);
  }

  if(startBtn) startBtn.addEventListener('click', ()=> invokeAI());
  if(floatingStart) floatingStart.addEventListener('click', ()=> invokeAI());

  // 傾き効果（ポインタデバイス）
  const tiltTargets = Array.from(document.querySelectorAll('.card, .member-card'));
  tiltTargets.forEach(card=>{
    let supportsPointer = window.matchMedia('(pointer:fine)').matches;
    if(!supportsPointer) return;
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${ -py * 4 }deg) rotateY(${ px * 4 }deg)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform = ''; });
  });

})();
