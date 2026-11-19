(function(){
  'use strict';
  var EVENT = new Date('2026-12-25T19:30:00+05:30');
  var $ = function(s){return document.querySelector(s)};
  var $$ = function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};

  function intro(){
    var intro = $('#intro'), enter = $('#enter'), explore = $('#explore');
    function go(){
      if(!intro || intro.classList.contains('hide')) return;
      intro.classList.add('hide');
      try{sessionStorage.setItem('ocb_enter','1')}catch(e){}
    }
    if(enter) enter.addEventListener('click', go);
    if(explore) explore.addEventListener('click', function(){ go(); });
    try{ if(sessionStorage.getItem('ocb_enter')==='1' && intro) intro.classList.add('hide'); }catch(e){}
  }

  function countdown(){
    var d=$('#cd-d'),h=$('#cd-h'),m=$('#cd-m'),s=$('#cd-s'); if(!d) return;
    function pad(n){return String(n).padStart(2,'0')}
    function tick(){
      var diff=EVENT.getTime()-Date.now();
      if(diff<=0){d.textContent=h.textContent=m.textContent=s.textContent='00';return;}
      var sec=Math.floor(diff/1000);
      d.textContent=pad(Math.floor(sec/86400)); h.textContent=pad(Math.floor((sec%86400)/3600));
      m.textContent=pad(Math.floor((sec%3600)/60)); s.textContent=pad(sec%60);
    }
    tick(); setInterval(tick,1000);
  }

  function ics(){
    var btn=$('#ics'); if(!btn) return;
    function fmt(dt){return dt.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}
    btn.addEventListener('click', function(){
      var start=new Date('2026-12-25T19:30:00+05:30'), end=new Date('2026-12-25T23:30:00+05:30');
      var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PCPL Orlem Christmas Ball//EN','BEGIN:VEVENT',
        'UID:ocb2026@orlemchristmasball.in','DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(start),'DTEND:'+fmt(end),
        'SUMMARY:PCPL Presents Orlem Christmas Ball 2026','LOCATION:St. Joseph School Turf Ground, Orlem, Malad (West), Mumbai',
        'DESCRIPTION:Featuring Knights — The Entertainers. Direct from Sri Lanka. Organized by The Happy Hearts.','END:VEVENT','END:VCALENDAR'].join('\r\n');
      var blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download='Orlem-Christmas-Ball-2026.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url)},1500);
    });
  }

  function tilt(){
    var card=$('#tilt'); if(!card) return;
    var wrap=card.parentElement;
    function move(e){
      var r=card.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      card.style.transform='rotateX('+((0.5-y)*10)+'deg) rotateY('+((x-0.5)*14)+'deg)';
      card.style.setProperty('--mx',(x*100)+'%'); card.style.setProperty('--my',(y*100)+'%');
    }
    function leave(){ card.style.transform='rotateX(0) rotateY(0)'; }
    (wrap||card).addEventListener('mousemove', move);
    (wrap||card).addEventListener('mouseleave', leave);
    (wrap||card).addEventListener('touchmove', function(e){ if(e.touches[0]) move(e.touches[0]); }, {passive:true});
    (wrap||card).addEventListener('touchend', leave);
  }

  function snow(){
    var c=$('#snow'); if(!c) return; var ctx=c.getContext('2d'); if(!ctx) return;
    var w=0,h=0,dpr=Math.min(window.devicePixelRatio||1,2), flakes=[], glow=[], m={x:.5,y:.5};
    function resize(){ w=innerWidth; h=innerHeight; c.width=Math.floor(w*dpr); c.height=Math.floor(h*dpr); c.style.width=w+'px'; c.style.height=h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); make(); }
    function make(){
      flakes=[]; glow=[];
      var n=Math.max(60, Math.floor(w*h/12000));
      for(var i=0;i<n;i++) flakes.push({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*2.2,s:.2+Math.random()*.6,d:Math.random()*Math.PI*2,dr:(Math.random()-.5)*.25});
      for(var j=0;j<16;j++) glow.push({x:Math.random()*w,y:Math.random()*h,r:30+Math.random()*90,a:.03+Math.random()*.05,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*.08});
    }
    addEventListener('resize', resize);
    addEventListener('mousemove', function(e){m.x=e.clientX/Math.max(w,1);m.y=e.clientY/Math.max(h,1)});
    resize();
    (function draw(){
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<glow.length;i++){var g=glow[i]; g.x+=g.vx; g.y+=g.vy; if(g.x<-g.r)g.x=w+g.r; if(g.x>w+g.r)g.x=-g.r; if(g.y<-g.r)g.y=h+g.r; if(g.y>h+g.r)g.y=-g.r;
        var gx=g.x+(m.x-.5)*14, gy=g.y+(m.y-.5)*14, gr=ctx.createRadialGradient(gx,gy,0,gx,gy,g.r);
        gr.addColorStop(0,'rgba(245,206,98,'+g.a+')'); gr.addColorStop(.5,'rgba(215,198,165,'+(g.a*.4)+')'); gr.addColorStop(1,'rgba(245,206,98,0)');
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(gx,gy,g.r,0,Math.PI*2); ctx.fill();
      }
      ctx.fillStyle='rgba(246,235,221,.8)';
      for(var k=0;k<flakes.length;k++){var f=flakes[k]; f.d+=.01; f.y+=f.s; f.x+=Math.sin(f.d)*.3+f.dr; if(f.y>h+5){f.y=-5;f.x=Math.random()*w} if(f.x<-5)f.x=w+5; if(f.x>w+5)f.x=-5;
        ctx.globalAlpha=.25+Math.sin(f.d)*.25; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1; requestAnimationFrame(draw);
    })();
  }

  function audio(){
    var btn=$('#sound'), label=$('#sound-label'); if(!btn) return;
    var ctx=null, master=null, playing=false, timers=[];
    var chords=[[130.81,164.81,196],[146.83,174.61,220],[164.81,196,246.94],[174.61,220,261.63],[196,246.94,293.66],[174.61,220,261.63]];
    var bells=[523.25,659.25,783.99,659.25,587.33,523.25,659.25,783.99];
    function ensure(){ if(ctx) return; var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC(); master=ctx.createGain(); master.gain.value=0.16; master.connect(ctx.destination); }
    function note(freq,t,dur,type,vol){ if(!ctx) return; var o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.03); g.gain.linearRampToValueAtTime(vol*0.55,t+0.25); g.gain.linearRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.1); }
    function schedule(){
      if(!ctx||!playing) return; var now=ctx.currentTime, beat=0.7, bar=beat*4;
      for(var b=0;b<4;b++){ var t=now+b*bar, ch=chords[(schedule.i+b)%chords.length];
        for(var j=0;j<ch.length;j++) note(ch[j]*(j===0?1:2), t, bar*0.95, j===0?'sine':'triangle', j===0?0.18:0.05);
        note(bells[(schedule.m+b*2)%bells.length], t+beat*0.5, 0.6, 'sine', 0.05);
        note(bells[(schedule.m+b*2+1)%bells.length], t+beat*2.5, 0.6, 'sine', 0.04);
      }
      schedule.i=(schedule.i+4)%chords.length; schedule.m=(schedule.m+8)%bells.length;
      timers.push(setTimeout(schedule, bar*4*1000-120));
    }
    schedule.i=0; schedule.m=0;
    function start(){ ensure(); if(!ctx) return; if(ctx.state==='suspended') ctx.resume(); playing=true; btn.classList.add('on'); btn.setAttribute('aria-pressed','true'); if(label) label.textContent='Sound On'; schedule(); }
    function stop(){ playing=false; btn.classList.remove('on'); btn.setAttribute('aria-pressed','false'); if(label) label.textContent='Sound Off'; timers.forEach(function(t){clearTimeout(t)}); timers=[]; }
    btn.addEventListener('click', function(){ playing?stop():start(); });
  }

  function reveals(){
    var els=$$('.reveal');
    if(window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      els.forEach(function(el){ gsap.to(el,{opacity:1,y:0,duration:1,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 85%',once:true}}); });
    } else if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.style.transition='opacity .9s ease, transform .9s ease'; e.target.style.opacity=1; e.target.style.transform='none'; io.unobserve(e.target);} }); },{threshold:.15});
      els.forEach(function(el){ io.observe(el); });
    } else { els.forEach(function(el){ el.style.opacity=1; el.style.transform='none'; }); }
  }

  function navDots(){
    var dots=$$('.nav-dots a'), sections=['hero','details','knights','tickets','community'].map(function(id){return document.getElementById(id)});
    if(!dots.length) return;
    function onScroll(){
      var idx=0, y=scrollY+innerHeight*0.4;
      sections.forEach(function(sec,i){ if(sec && sec.offsetTop<=y) idx=i; });
      dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
    }
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }

  document.addEventListener('DOMContentLoaded', function(){
    intro(); countdown(); ics(); tilt(); snow(); audio(); reveals(); navDots();
  });
})();