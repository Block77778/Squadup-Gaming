'use client';

import { useEffect, useState, useRef } from 'react';


type Phase = 'entering' | 'holding' | 'exiting';

// ── SOUND ENGINE ──
function createAudioEngine() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  ctx.resume();

  // Helper: create a master compressor to keep everything punchy and clean
  const masterComp = ctx.createDynamicsCompressor();
  masterComp.threshold.value = -6;
  masterComp.knee.value = 3;
  masterComp.ratio.value = 4;
  masterComp.attack.value = 0.001;
  masterComp.release.value = 0.1;
  masterComp.connect(ctx.destination);

  // ── TICKER: crisp mechanical tick-tock sound ──
  function playTick(urgent = false) {
    const now = ctx.currentTime;

    // Sharp noise snap — the "tick" transient (8ms)
    const tickLen = Math.floor(ctx.sampleRate * 0.008);
    const tickBuf = ctx.createBuffer(1, tickLen, ctx.sampleRate);
    const tickData = tickBuf.getChannelData(0);
    for (let i = 0; i < tickLen; i++) {
      tickData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tickLen, 3);
    }
    const tickSrc = ctx.createBufferSource(); tickSrc.buffer = tickBuf;
    const tickBp = ctx.createBiquadFilter();
    tickBp.type = 'bandpass'; tickBp.frequency.value = urgent ? 2800 : 1800; tickBp.Q.value = 2.5;
    const tickGain = ctx.createGain();
    tickSrc.connect(tickBp); tickBp.connect(tickGain); tickGain.connect(masterComp);
    tickGain.gain.setValueAtTime(urgent ? 1.1 : 0.75, now);
    tickSrc.start(now);

    // Resonant "tock" — short pitched thud giving the mechanical body
    const tockOsc = ctx.createOscillator(); const tockGain = ctx.createGain();
    tockOsc.connect(tockGain); tockGain.connect(masterComp);
    tockOsc.type = 'sine';
    tockOsc.frequency.setValueAtTime(urgent ? 320 : 220, now);
    tockOsc.frequency.exponentialRampToValueAtTime(urgent ? 180 : 110, now + 0.04);
    tockGain.gain.setValueAtTime(urgent ? 0.5 : 0.28, now);
    tockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    tockOsc.start(now); tockOsc.stop(now + 0.06);

    // Urgent double-tick on last 3 counts — rapid second snap 30ms later
    if (urgent) {
      const t2 = now + 0.032;
      const r2Buf = ctx.createBuffer(1, tickLen, ctx.sampleRate);
      const r2Data = r2Buf.getChannelData(0);
      for (let i = 0; i < tickLen; i++) {
        r2Data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tickLen, 3);
      }
      const r2Src = ctx.createBufferSource(); r2Src.buffer = r2Buf;
      const r2Bp = ctx.createBiquadFilter(); r2Bp.type = 'bandpass'; r2Bp.frequency.value = 3400; r2Bp.Q.value = 2;
      const r2Gain = ctx.createGain();
      r2Src.connect(r2Bp); r2Bp.connect(r2Gain); r2Gain.connect(masterComp);
      r2Gain.gain.setValueAtTime(0.45, t2);
      r2Src.start(t2);
    }
  }

  // ── DRAMATIC MULTI-STAGE COD EXPLOSION ──
  function playExplosion() {
    const now = ctx.currentTime;

    // ─── STAGE 1: Initial detonation crack (0ms) ───
    // Ultra-sharp transient — the primer igniting
    const crackBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackData.length; i++)
      crackData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crackData.length, 0.15);
    const crackSrc = ctx.createBufferSource(); crackSrc.buffer = crackBuf;
    const crackFilt = ctx.createBiquadFilter(); crackFilt.type = 'highpass'; crackFilt.frequency.value = 800;
    const crackGain = ctx.createGain();
    crackSrc.connect(crackFilt); crackFilt.connect(crackGain); crackGain.connect(masterComp);
    crackGain.gain.setValueAtTime(5.0, now);
    crackSrc.start(now);

    // ─── STAGE 2: Main shockwave BOOM (20ms delay) ───
    // Massive sub-bass chest punch — the primary pressure wave
    const sub1 = ctx.createOscillator(); const sub1G = ctx.createGain();
    sub1.connect(sub1G); sub1G.connect(masterComp);
    sub1.type = 'sine';
    sub1.frequency.setValueAtTime(80, now + 0.02);
    sub1.frequency.exponentialRampToValueAtTime(16, now + 1.2);
    sub1G.gain.setValueAtTime(4.5, now + 0.02);
    sub1G.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    sub1.start(now + 0.02); sub1.stop(now + 1.5);

    // Second harmonic — adds thickness and power
    const sub2 = ctx.createOscillator(); const sub2G = ctx.createGain();
    sub2.connect(sub2G); sub2G.connect(masterComp);
    sub2.type = 'sine';
    sub2.frequency.setValueAtTime(160, now + 0.02);
    sub2.frequency.exponentialRampToValueAtTime(35, now + 0.9);
    sub2G.gain.setValueAtTime(2.5, now + 0.02);
    sub2G.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    sub2.start(now + 0.02); sub2.stop(now + 1.2);

    // ─── STAGE 3: Noise body (0ms) ───
    // White noise shaped into the main explosion roar
    const noiseLen = Math.floor(ctx.sampleRate * 4.0);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuf;
    const noiseLp = ctx.createBiquadFilter(); noiseLp.type = 'lowpass'; noiseLp.frequency.value = 600;
    const noisePk = ctx.createBiquadFilter(); noisePk.type = 'peaking'; noisePk.frequency.value = 100; noisePk.gain.value = 18;
    const noisePk2 = ctx.createBiquadFilter(); noisePk2.type = 'peaking'; noisePk2.frequency.value = 250; noisePk2.gain.value = 8;
    const noiseGain = ctx.createGain();
    noiseSrc.connect(noiseLp); noiseLp.connect(noisePk); noisePk.connect(noisePk2); noisePk2.connect(noiseGain); noiseGain.connect(masterComp);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(3.5, now + 0.015); // instant slam
    noiseGain.gain.setValueAtTime(3.5, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.8, now + 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
    noiseSrc.start(now);

    // ─── STAGE 4: Mid debris crunch (60ms) ───
    const debrisLen = Math.floor(ctx.sampleRate * 2.0);
    const debrisBuf = ctx.createBuffer(1, debrisLen, ctx.sampleRate);
    const debrisData = debrisBuf.getChannelData(0);
    for (let i = 0; i < debrisLen; i++)
      debrisData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / debrisLen, 0.6);
    const debrisSrc = ctx.createBufferSource(); debrisSrc.buffer = debrisBuf;
    const debrisBp = ctx.createBiquadFilter(); debrisBp.type = 'bandpass'; debrisBp.frequency.value = 700; debrisBp.Q.value = 0.4;
    const debrisGain = ctx.createGain();
    debrisSrc.connect(debrisBp); debrisBp.connect(debrisGain); debrisGain.connect(masterComp);
    debrisGain.gain.setValueAtTime(2.2, now + 0.06);
    debrisGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    debrisSrc.start(now + 0.06);

    // ─── STAGE 5: Secondary blast (250ms) ───
    // COD-style has a SECOND boom as gas ignites — delayed rumble
    const sec = ctx.createOscillator(); const secG = ctx.createGain();
    sec.connect(secG); secG.connect(masterComp);
    sec.type = 'sine';
    sec.frequency.setValueAtTime(55, now + 0.25);
    sec.frequency.exponentialRampToValueAtTime(20, now + 1.0);
    secG.gain.setValueAtTime(0, now + 0.25);
    secG.gain.linearRampToValueAtTime(2.8, now + 0.3);
    secG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    sec.start(now + 0.25); sec.stop(now + 1.3);

    // ─── STAGE 7: Distant reverb tail (400ms) ───
    // That rolling thunder that carries across the map
    const tailLen = Math.floor(ctx.sampleRate * 3.0);
    const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
    const tailData = tailBuf.getChannelData(0);
    for (let i = 0; i < tailLen; i++) tailData[i] = Math.random() * 2 - 1;
    const tailSrc = ctx.createBufferSource(); tailSrc.buffer = tailBuf;
    const tailLp = ctx.createBiquadFilter(); tailLp.type = 'lowpass'; tailLp.frequency.value = 180;
    const tailGain = ctx.createGain();
    tailSrc.connect(tailLp); tailLp.connect(tailGain); tailGain.connect(masterComp);
    tailGain.gain.setValueAtTime(0, now + 0.4);
    tailGain.gain.linearRampToValueAtTime(1.2, now + 0.55);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    tailSrc.start(now + 0.4);
  }

  function startAmbient() {
    const d1 = ctx.createOscillator(); const d2 = ctx.createOscillator();
    const mg = ctx.createGain(); const f = ctx.createBiquadFilter();
    d1.connect(f); d2.connect(f); f.connect(mg); mg.connect(masterComp);
    d1.type = 'sine'; d1.frequency.value = 55;
    d2.type = 'sine'; d2.frequency.value = 57.5;
    f.type = 'lowpass'; f.frequency.value = 300;
    mg.gain.setValueAtTime(0, ctx.currentTime);
    mg.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2);
    d1.start(); d2.start();
    return () => {
      mg.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => { try { d1.stop(); d2.stop(); } catch(e) {} }, 1100);
    };
  }

  return { playTickck, playExplosion, startAmbient };
}

export function Countdown() {
  const [count, setCount] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('entering');
  const [revealed, setRevealed] = useState(false);
  const [flash, setFlash] = useState(false);
  const [started, setStarted] = useState(false); // gate — user must click first
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudioEngine> | null>(null);
  const stopAmbientRef = useRef<(() => void) | null>(null);

  const isUrgent = count !== null && count <= 3;

  const ENTER_MS = 300;
  const HOLD_MS  = 500;
  const EXIT_MS  = 200;

  function handleStart() {
  console.log('handleStart fired');
  const engine = createAudioEngine();
  console.log('engine created', engine);
  audioRef.current = engine;
  stopAmbientRef.current = engine.startAmbient();
  console.log('ambient started');
  setStarted(true);
  setCount(10);
  setPhase('entering');
}

  useEffect(() => {
    if (!started || count === null) return;

    if (phase === 'entering') {
  console.log('playing tick', count, isUrgent, audioRef.current);
  audioRef.current?.playTick(isUrgent);
  timerRef.current = setTimeout(() => setPhase('holding'), ENTER_MS);
    } else if (phase === 'holding') {
      if (count <= 0) {
        setFlash(true);
        setTimeout(() => {
          audioRef.current?.playExplosion();
          stopAmbientRef.current?.();
          triggerExplosion();
          setRevealed(true);
          setFlash(false);
        }, 600);
        return;
      }
      timerRef.current = setTimeout(() => setPhase('exiting'), HOLD_MS);
    } else if (phase === 'exiting') {
      timerRef.current = setTimeout(() => {
        setCount(prev => (prev !== null ? prev - 1 : prev));
        setPhase('entering');
      }, EXIT_MS);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [count, phase, started]);

  const triggerExplosion = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99999;pointer-events:none;';
    document.body.appendChild(canvas);
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const c = canvas.getContext('2d')!;
    const cx = W/2, cy = H/2;
    const t0 = performance.now();
    const TOTAL = 4000;

    // Shockwave rings
    const rings = [
      { delay:0,   maxR: Math.max(W,H)*1.2, thick:32, rgba:'255,255,220' },
      { delay:60,  maxR: Math.max(W,H)*1.0, thick:20, rgba:'255,140,0'   },
      { delay:140, maxR: Math.max(W,H)*0.8, thick:12, rgba:'255,60,0'    },
      { delay:260, maxR: Math.max(W,H)*0.55,thick:7,  rgba:'180,20,0'    },
      { delay:420, maxR: Math.max(W,H)*0.35,thick:4,  rgba:'255,200,80'  },
    ];

    // Hot debris with trails
    const debris = Array.from({ length: 320 }, (_, idx) => {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 28 + 4;
      return {
        x: cx, y: cy,
        vx: Math.cos(a)*spd, vy: Math.sin(a)*spd - Math.random()*10,
        size: Math.random()*5+1, life: Math.random()*0.45+0.55,
        hot: idx < 160,
        color: idx < 80
          ? ['#fff','#ffeeaa','#ffaa00','#ff6600'][Math.floor(Math.random()*4)]
          : idx < 160
          ? ['#ff4400','#ff2200','#cc1100'][Math.floor(Math.random()*3)]
          : ['#555','#444','#333','#222'][Math.floor(Math.random()*4)],
        grav: Math.random()*0.6+0.15,
        trail: [] as {x:number,y:number}[],
      };
    });

    // Smoke puffs
    const smokes = Array.from({ length: 20 }, () => ({
      x: cx+(Math.random()-0.5)*140, y: cy+(Math.random()-0.5)*90,
      vx:(Math.random()-0.5)*2, vy:-(Math.random()*2.5+1),
      r: Math.random()*70+35, delay: Math.random()*300,
    }));

    let last = t0;
    function frame(now: number) {
      const el = now - t0;
      const gt = Math.min(el / TOTAL, 1);
      const dt = Math.min((now-last)/16, 3); last = now;

      c.clearRect(0,0,W,H);

      // shockwave rings
      rings.forEach(rng => {
        const rt = Math.max(0,(el-rng.delay)/(TOTAL*0.38));
        if(rt<=0||rt>1) return;
        const rad = rt*rng.maxR;
        const alpha = Math.pow(1-rt, 2.0);
        c.beginPath(); c.arc(cx,cy,rad,0,Math.PI*2);
        c.strokeStyle = `rgba(${rng.rgba},${alpha.toFixed(3)})`;
        c.lineWidth = rng.thick*(1-rt*0.65);
        c.stroke();
      });

      // Central fireball: white-hot core → orange → dark red
      if(el < 900) {
        const ft = el/900;
        const alpha = Math.pow(1-ft, 0.6);
        const maxR = Math.min(W,H)*0.52;
        const r = (1-Math.pow(ft,0.3))*maxR + 25;
        const g = c.createRadialGradient(cx,cy,0,cx,cy,r);
        if(ft < 0.3) {
          g.addColorStop(0,   `rgba(255,255,255,${alpha.toFixed(3)})`);
          g.addColorStop(0.2, `rgba(255,255,160,${alpha.toFixed(3)})`);
          g.addColorStop(0.5, `rgba(255,140,0,${(alpha*0.85).toFixed(3)})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
        } else {
          g.addColorStop(0,   `rgba(255,200,60,${(alpha*0.9).toFixed(3)})`);
          g.addColorStop(0.35,`rgba(255,70,0,${(alpha*0.75).toFixed(3)})`);
          g.addColorStop(0.7, `rgba(140,15,0,${(alpha*0.45).toFixed(3)})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
        }
        c.fillStyle=g; c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fill();
      }

      // Secondary gas bloom at 280ms
      if(el>280 && el<1300) {
        const st=(el-280)/1020;
        const alpha=Math.pow(1-st,1.6);
        const r=st*Math.min(W,H)*0.34;
        const g2=c.createRadialGradient(cx,cy,0,cx,cy,r);
        g2.addColorStop(0,  `rgba(255,180,40,${alpha.toFixed(3)})`);
        g2.addColorStop(0.4,`rgba(255,60,0,${(alpha*0.65).toFixed(3)})`);
        g2.addColorStop(1,  'rgba(0,0,0,0)');
        c.fillStyle=g2; c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fill();
      }

      // Edge orange flash
      if(el<350){
        const vt=el/350, va=(1-vt)*0.75;
        const vg=c.createRadialGradient(cx,cy,Math.min(W,H)*0.28,cx,cy,Math.max(W,H)*0.92);
        vg.addColorStop(0,'rgba(0,0,0,0)');
        vg.addColorStop(1,`rgba(255,60,0,${va.toFixed(3)})`);
        c.fillStyle=vg; c.fillRect(0,0,W,H);
      }

      // Smoke
      smokes.forEach(sm=>{
        const st=Math.max(0,(el-sm.delay)/3500);
        if(st<=0||st>1) return;
        const sr=sm.r*(1+st*3);
        const sa=st<0.1?st/0.1*0.16:Math.pow(1-st,2.8)*0.16;
        const sx=sm.x+sm.vx*st*55, sy=sm.y+sm.vy*st*55;
        const grey=Math.floor(15+st*70);
        c.globalAlpha=sa;
        c.fillStyle=`rgb(${grey},${grey},${grey})`;
        c.beginPath(); c.arc(sx,sy,sr,0,Math.PI*2); c.fill();
        c.globalAlpha=1;
      });

      // Debris
      debris.forEach(d=>{
        const lt=gt/d.life; if(lt>1) return;
        const alpha=Math.pow(1-lt,1.3);
        d.x+=d.vx*dt*0.016*60; d.y+=d.vy*dt*0.016*60;
        d.vy+=d.grav*dt*0.016*60*0.016; d.vx*=0.994;
        d.trail.push({x:d.x,y:d.y});
        if(d.trail.length>10) d.trail.shift();
        if(d.trail.length>2){
          c.beginPath();
          c.moveTo(d.trail[0].x,d.trail[0].y);
          d.trail.forEach(p=>c.lineTo(p.x,p.y));
          c.strokeStyle=d.color; c.globalAlpha=alpha*0.3;
          c.lineWidth=d.size*0.5; c.stroke(); c.globalAlpha=1;
        }
        c.globalAlpha=alpha;
        c.fillStyle=d.color;
        c.beginPath(); c.arc(d.x,d.y,d.size*(1-lt*0.45),0,Math.PI*2); c.fill();
        c.globalAlpha=1;
      });

      if(gt<1) requestAnimationFrame(frame);
      else document.body.removeChild(canvas);
    }
    requestAnimationFrame(frame);
  };

  // Clean cinematic animation per phase — no bouncing, no breathing during hold
  const numberAnimation = (() => {
    if (phase === 'entering') return isUrgent
      ? 'cutIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      : 'cutIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    if (phase === 'exiting') return isUrgent
      ? 'cutOutUrgent 0.2s ease-in forwards'
      : 'cutOut 0.2s ease-in forwards';
    // Hold: completely static — no animation at all
    return 'none';
  })();

  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden" style={flash ? { animation: 'screenShake 0.5s ease-out forwards' } : {}}>

      {/* ── CLICK TO BEGIN GATE ── */}
      {!started && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,10,0,0.95) 0%, #000 100%)' }}>
          <div style={{
            color: '#4a3810',
            letterSpacing: '0.55em',
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '3rem',
            fontFamily: 'Georgia, serif',
          }}>◆ SQUAD UP GAMING ◆</div>

          <button
            onClick={handleStart}
            style={{
              background: 'none',
              border: '2px solid rgba(218,165,32,0.4)',
              color: '#ffd700',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              padding: '1.2rem 3rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 30px rgba(218,165,32,0.1)',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.borderColor = 'rgba(218,165,32,0.9)';
              (e.target as HTMLElement).style.boxShadow = '0 0 40px rgba(218,165,32,0.4)';
              (e.target as HTMLElement).style.color = '#fff8dc';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.borderColor = 'rgba(218,165,32,0.4)';
              (e.target as HTMLElement).style.boxShadow = '0 0 30px rgba(218,165,32,0.1)';
              (e.target as HTMLElement).style.color = '#ffd700';
            }}
          >
            ENTER
          </button>

          <p style={{
            color: '#2a1e08',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
            marginTop: '1.5rem',
          }}>SOUND ON FOR BEST EXPERIENCE</p>
        </div>
      )}

      {/* Hard blast flash — white-out then orange burn */}
      {flash && (
        <div className="absolute inset-0 z-50 pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,160,0,0.9) 30%, rgba(255,60,0,0.5) 60%, transparent 100%)',
          animation: 'blastFlash 0.8s ease-out forwards',
        }} />
      )}


      {/* Dark smoky COD background — matches reference image */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 55%, rgba(60,18,0,1) 0%, rgba(20,5,0,1) 45%, #000 80%)',
        zIndex: 0,
      }} />

      {/* Ember atmospheric depth layers */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 85%, rgba(120,35,0,0.3) 0%, transparent 50%), radial-gradient(ellipse at 15% 50%, rgba(70,18,0,0.2) 0%, transparent 38%), radial-gradient(ellipse at 85% 40%, rgba(55,14,0,0.18) 0%, transparent 35%)',
        zIndex: 1,
        animation: 'breatheFog 5s ease-in-out infinite',
      }} />

      {/* Ground ember light beam */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: '700px',
        height: '65%',
        background: 'conic-gradient(from 268deg at 50% 100%, transparent 0deg, rgba(200,60,0,0.08) 4deg, transparent 8deg)',
        filter: 'blur(25px)',
      }} />

      {/* Floating embers — replace stars */}
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: Math.random() > 0.5 ? '#ff6600' : Math.random() > 0.5 ? '#ffaa00' : '#ff2200',
              boxShadow: '0 0 4px #ff4400, 0 0 8px rgba(255,80,0,0.6)',
              opacity: Math.random() * 0.6 + 0.2,
              animation: `floatDust ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 6 + 's',
            }}
          />
        ))}
      </div>

      {/* === COUNTDOWN PHASE === */}
      {!revealed && (
        <div className="relative z-10 flex flex-col items-center">

          {/* Static vignette behind number — no animation */}
          <div className="absolute pointer-events-none" style={{
            width: '500px', height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(218,165,32,${isUrgent ? 0.14 : 0.06}) 0%, transparent 65%)`,
          }} />

          <div style={{
            color: '#4a3810',
            letterSpacing: '0.55em',
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '2.5rem',
            fontFamily: 'Georgia, serif',
            opacity: 0.9,
          }}>
            ◆ SQUAD UP GAMING ◆
          </div>

          {/* Number stage */}
          {count !== null && (
            <div className="relative flex items-center justify-center" style={{ width: '340px', height: '280px' }}>
              <div key={`${count}-${phase}`} style={{ animation: numberAnimation, textAlign: 'center', willChange: 'transform, opacity, filter' }}>

                {/* Number — massive cinematic 3D gold */}
                <span style={{
                  display: 'block',
                  fontSize: isUrgent ? '14rem' : '13rem',
                  fontWeight: '900',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: isUrgent ? '#fff8d0' : '#ffd700',
                  textShadow: isUrgent ? `
                    0 1px 0 #f0c800,
                    0 2px 0 #e8b800,
                    0 3px 0 #daa520,
                    0 4px 0 #cc9900,
                    0 5px 0 #b8860b,
                    0 6px 0 #a07000,
                    0 7px 0 #8b6000,
                    0 8px 0 #7a5000,
                    0 9px 0 #6b4200,
                    0 10px 0 #5a3500,
                    0 11px 0 #4a2800,
                    0 12px 0 #3a1e00,
                    0 13px 0 #2a1400,
                    0 14px 0 #1a0c00,
                    0 16px 50px rgba(0,0,0,1),
                    0 0 120px rgba(255,200,0,0.4)
                  ` : `
                    0 1px 0 #c8940a,
                    0 2px 0 #b8860b,
                    0 3px 0 #a07800,
                    0 4px 0 #8b6914,
                    0 5px 0 #7a5800,
                    0 6px 0 #6b4f00,
                    0 7px 0 #5a4000,
                    0 8px 0 #4a3200,
                    0 9px 0 #3a2600,
                    0 10px 0 #2a1c00,
                    0 11px 0 #1a1000,
                    0 12px 0 #0a0800,
                    0 14px 40px rgba(0,0,0,1),
                    0 0 60px rgba(255,215,0,0.12)
                  `,
                }}>{count}</span>
              </div>
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            color: isUrgent ? '#9a7820' : '#3a2e10',
            letterSpacing: '0.55em',
            fontSize: '0.65rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
          }}>
            {isUrgent ? 'LAUNCHING NOW' : 'LAUNCHING IN'}
          </div>
        </div>
      )}

      {/* === REVEALED PHASE === */}
      {revealed && (
        <div className="relative z-20 text-center flex flex-col items-center w-full" style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxHeight: '100vh',
          justifyContent: 'center',
        }}>

          {/* Logo */}
          <div style={{
            marginBottom: '1.5rem',
            animation: 'dropIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}>
            <img
              src="/squad-up-logo.png"
              alt="Squad Up Gaming"
              style={{
                height: '140px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 30px rgba(255,140,0,0.9)) drop-shadow(0 0 80px rgba(255,60,0,0.5))',
              }}
            />
          </div>

          {/* COMING SOON — fire text matching reference image */}
          <div style={{ position: 'relative', textAlign: 'center', lineHeight: 1 }}>

            {/* Fire glow bloom behind text */}
            <div style={{
              position: 'absolute',
              top: '10%', left: '50%',
              transform: 'translateX(-50%)',
              width: '120%', height: '90%',
              background: 'radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.7) 0%, rgba(180,30,0,0.4) 40%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0,
                            pointerEvents: 'none',
            }} />

            {/* COMING */}
            <div style={{ position: 'relative', zIndex: 1, animation: 'fadeSlideUp 0.6s ease-out 0.15s both' }}>
              <span style={{
                display: 'block',
                fontSize: 'clamp(4rem, 11vw, 8rem)',
                fontWeight: '900',
                fontFamily: '"Georgia", "Times New Roman", serif',
                letterSpacing: '0.13em',
                lineHeight: 0.9,
                background: 'linear-gradient(175deg, #ffffff 0%, #ffe566 10%, #ffaa00 28%, #ff5500 52%, #cc2200 72%, #6b1000 90%, #200500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 10px rgba(255,100,0,1)) drop-shadow(0 0 28px rgba(255,50,0,0.8)) drop-shadow(0 0 60px rgba(180,20,0,0.55)) drop-shadow(3px 5px 0 rgba(0,0,0,1)) drop-shadow(6px 10px 0 rgba(0,0,0,0.6))',
              }}>COMING</span>
            </div>

            {/* SOON */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: '-0.04em', animation: 'fadeSlideUp 0.6s ease-out 0.3s both' }}>
              <span style={{
                display: 'block',
                fontSize: 'clamp(6rem, 18vw, 13rem)',
                fontWeight: '900',
                fontFamily: '"Georgia", "Times New Roman", serif',
                letterSpacing: '0.06em',
                lineHeight: 0.88,
                background: 'linear-gradient(175deg, #ffffff 0%, #ffee88 6%, #ffbb00 18%, #ff6600 36%, #ff2200 55%, #aa1500 72%, #550800 88%, #150200 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 16px rgba(255,120,0,1)) drop-shadow(0 0 40px rgba(255,50,0,0.9)) drop-shadow(0 0 90px rgba(180,15,0,0.65)) drop-shadow(4px 8px 0 rgba(0,0,0,1)) drop-shadow(8px 16px 0 rgba(0,0,0,0.55))',
              }}>SOON</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            width: '320px', height: '2px',
            margin: '1.4rem auto 0.8rem',
            background: 'linear-gradient(90deg, transparent, #ff6600, #ffaa00, #ffdd00, #ffaa00, #ff6600, transparent)',
            boxShadow: '0 0 18px rgba(255,120,0,0.9), 0 0 40px rgba(255,60,0,0.5)',
            animation: 'fadeSlideUp 0.8s ease-out 0.5s both',
          }} />

          {/* Tagline */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.9rem',
            animation: 'fadeSlideUp 0.8s ease-out 0.65s both',
            marginBottom: '0.4rem',
          }}>
            <div style={{ width: '35px', height: '1px', background: 'linear-gradient(90deg, transparent, #ff8800)', opacity: 0.7 }} />
            <span style={{ color: '#ff8800', fontSize: '0.9rem' }}>◆</span>
            <p style={{
              color: '#ffaa44',
              letterSpacing: '0.32em',
              fontSize: 'clamp(0.6rem, 1.4vw, 0.82rem)',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              margin: 0,
              textShadow: '0 0 20px rgba(255,120,0,0.7)',
            }}>PREPARE FOR BATTLE</p>
            <span style={{ color: '#ff8800', fontSize: '0.9rem' }}>◆</span>
            <div style={{ width: '35px', height: '1px', background: 'linear-gradient(90deg, #ff8800, transparent)', opacity: 0.7 }} />
          </div>

          <p style={{
            color: '#884422',
            letterSpacing: '0.45em',
            fontSize: '0.6rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
            animation: 'fadeSlideUp 0.8s ease-out 0.8s both',
            margin: 0,
          }}>ELITE GAMING PLATFORM</p>
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: scale(0.85) translateY(-30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes breatheFog {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes floatDust {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.7; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gentleRock {
          0% { transform: rotateX(0deg) rotateY(-5deg); }
          50% { transform: rotateX(0deg) rotateY(5deg); }
          100% { transform: rotateX(0deg) rotateY(-5deg); }
        }
        @keyframes linePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes blastFlash {
          0%   { opacity: 1; }
          8%   { opacity: 1; }
          35%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes screenShake {
          0%   { transform: translate(0,0) rotate(0deg); }
          10%  { transform: translate(-8px, -6px) rotate(-0.5deg); }
          20%  { transform: translate(8px, 6px) rotate(0.5deg); }
          30%  { transform: translate(-6px, 4px) rotate(-0.3deg); }
          40%  { transform: translate(6px, -4px) rotate(0.3deg); }
          50%  { transform: translate(-3px, 2px) rotate(-0.2deg); }
          60%  { transform: translate(3px, -2px) rotate(0.1deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }

        /* ── CINEMATIC NUMBER TRANSITIONS ── */

        /* Enter: materialise from darkness — no overshoot, no bounce.
           Motion blur via filter blur easing into sharp. */
        @keyframes cutIn {
          0%   {
            opacity: 0;
            transform: scale(1.15) translateY(-40px);
            filter: blur(18px) brightness(2.5);
          }
          55%  {
            opacity: 1;
            transform: scale(1.02) translateY(0);
            filter: blur(2px) brightness(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) brightness(1);
          }
        }

        /* Exit standard: dissolve downward into darkness, no flash */
        @keyframes cutOut {
          0%   {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) brightness(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.88) translateY(30px);
            filter: blur(10px) brightness(0.3);
          }
        }

        /* Exit urgent (3,2,1): cut to black — fast, hard, no drift */
        @keyframes cutOutUrgent {
          0%   {
            opacity: 1;
            transform: scale(1);
            filter: blur(0) brightness(1);
          }
          40%  {
            opacity: 1;
            transform: scale(1.06);
            filter: blur(0) brightness(2.5);
          }
          100% {
            opacity: 0;
            transform: scale(0.7);
            filter: blur(20px) brightness(0);
          }
        }
      `}</style>
    </div>
  );
}
