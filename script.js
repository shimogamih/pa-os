// script.js — PA-OS v2 interactions & animations
(() => {
  const cards = Array.from(document.querySelectorAll('[data-anim]'));
  const members = Array.from(document.querySelectorAll('.member-card'));
  const navItems = Array.from(document.querySelectorAll('.nav-item'));

  function awaken(){
    const all = cards.concat(members);
    all.forEach((el,i)=> setTimeout(()=> el.classList.add('awake'), i*90));
  }

  function animateCounters(){
    document.querySelectorAll('[data-target]').forEach(el => {
      const raw = el.getAttribute('data-target');
      // allow signs
      const target = parseInt(raw.replace(/[^0-9\-\+]/g,''),10) || 0;
      const start = 0;
      const duration = 900;
      let startTime = null;
      function step(ts){
        if(!startTime) startTime = ts;
        const progress = Math.min((ts-startTime)/duration,1);
        const val = Math.round(start + (target-start)*progress);
        // format with comma
        const sign = raw.trim().startsWith('+')?'+':'';
        el.textContent = (sign + val.toLocaleString('en-US')) ? `${sign}¥${Math.abs(val).toLocaleString()}` : `¥${val}`;
        if(progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  window.addEventListener('load', ()=>{
    awaken();
    animateCounters();

    // radial meters
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

  // nav interactions
  navItems.forEach(item => {
    item.addEventListener('click', ()=>{
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      item.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)'},{transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
      // simple routing: scroll to sections
      const nav = item.getAttribute('data-nav');
      if(nav === 'guild') document.querySelector('.guild-card').scrollIntoView({behavior:'smooth',block:'center'});
      if(nav === 'portfolio') document.querySelector('.dashboard-grid').scrollIntoView({behavior:'smooth',block:'start'});
      if(nav === 'home') window.scrollTo({top:0,behavior:'smooth'});
    });
  });

  // subtle card tilt on pointer devices
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
