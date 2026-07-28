// script.js — animation and Interactions for Portfolio AI dashboard
(() => {
  const cards = Array.from(document.querySelectorAll('[data-anim]'));
  // staggered awaken animation
  function awaken(){
    cards.forEach((c,i)=>{
      setTimeout(()=> c.classList.add('awake'), i*120);
    });
  }

  // On load, awaken the cards and expand bars
  window.addEventListener('load', ()=>{
    awaken();
    // animate progress bar
    document.querySelectorAll('.bar span').forEach(s => {
      const p = s.style.getPropertyValue('--p') || '50%';
      // trigger layout and set width to var
      requestAnimationFrame(()=>{ s.style.width = p; });
    });
    // radial meters - compute dashoffset for displayed percent
    document.querySelectorAll('.radial .meter').forEach(m => {
      // simple parse from parent .radial-label if present
      const label = m.closest('.radial').querySelector('.radial-label');
      let val = 75;
      if(label){
        const n = parseInt(label.textContent,10);
        if(!isNaN(n)) val = n;
      }
      const circumference = 2 * Math.PI * 15.9; // from SVG
      const percent = Math.max(0,Math.min(100,val));
      const filled = circumference * (percent/100);
      m.style.strokeDasharray = `${filled} ${circumference}`;
      m.style.strokeDashoffset = `${circumference - filled}`;
    });
  });

  // hover tilt effect for cards (subtle)
  cards.forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) translateY(-6px) rotateX(${ -py * 6 }deg) rotateY(${ px * 6 }deg)`;
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transform = '';
    });
  });

  // Modal controls for 'Start' buttons
  const modal = document.getElementById('modal');
  const startButtons = [document.getElementById('startBtn'), document.getElementById('startBtn2')];
  startButtons.forEach(b=>{ if(b) b.addEventListener('click', ()=> openModal()); });
  function openModal(){ if(!modal) return; modal.setAttribute('aria-hidden','false'); }
  modal.querySelector('.close').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));

  // Invocation — simulate AI start with a ritual animation
  const invokeBtn = document.getElementById('invoke');
  if(invokeBtn){
    invokeBtn.addEventListener('click', ()=>{
      // pulse cards
      cards.forEach((c,i)=>{
        setTimeout(()=>{
          c.animate([
            { transform: 'scale(1)', boxShadow: '0 20px 50px rgba(2,6,23,0.7)' },
            { transform: 'scale(1.03)', boxShadow: '0 30px 70px rgba(46,35,71,0.45)' },
            { transform: 'scale(1)' }
          ],{duration:1200,iterations:1,easing:'ease-in-out'});
        }, i*100);
      });
      // subtle background flare
      const bg = document.querySelector('.bg-orbit');
      if(bg){
        bg.animate([{opacity:0.4},{opacity:1},{opacity:0.4}],{duration:2200,iterations:1});
      }
      // close modal after ritual
      setTimeout(()=> modal.setAttribute('aria-hidden','true'), 1600);
    });
  }

})();
