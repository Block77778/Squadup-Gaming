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

    // ─── STAGE 6: Pressure ring — ear-ring shockwave (80ms) ───
    const ringOsc = ctx.createOscillator(); const ringGain = ctx.createGain();
    ringOsc.connect(ringGain); ringGain.connect(masterComp);
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(4200, now + 0.08);
    ringOsc.frequency.exponentialRampToValueAtTime(800, now + 3.5);
    ringGain.gain.setValueAtTime(0, now + 0.08);
    ringGain.gain.linearRampToValueAtTime(0.22, now + 0.12);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
    ringOsc.start(now + 0.08); ringOsc.stop(now + 4.0);

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

  // ── FIRE: soft relaxing bonfire crackle ──
  function playFire() {
    const now = ctx.currentTime;
    const FIRE_DURATION = 10.0;

    // Low warm rumble — gentle combustion breath
    const baseLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const baseBuf = ctx.createBuffer(1, baseLen, ctx.sampleRate);
    const baseData = baseBuf.getChannelData(0);
    for (let i = 0; i < baseLen; i++) baseData[i] = Math.random() * 2 - 1;
    const baseSrc = ctx.createBufferSource(); baseSrc.buffer = baseBuf;
    const baseLp = ctx.createBiquadFilter(); baseLp.type = 'lowpass'; baseLp.frequency.value = 160;
    const baseGain = ctx.createGain();
    baseSrc.connect(baseLp); baseLp.connect(baseGain); baseGain.connect(masterComp);
    baseGain.gain.setValueAtTime(0, now);
    baseGain.gain.linearRampToValueAtTime(0.18, now + 2.0);
    baseGain.gain.setValueAtTime(0.18, now + FIRE_DURATION - 3.0);
    baseGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    baseSrc.start(now);

    // Gentle crackle pops — sparse, quiet, like a campfire
    const crackLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = Math.random() < 0.006 ? (Math.random() * 2 - 1) * 2.5 : 0;
    }
    const crackSrc = ctx.createBufferSource(); crackSrc.buffer = crackBuf;
    const crackBp = ctx.createBiquadFilter(); crackBp.type = 'bandpass'; crackBp.frequency.value = 900; crackBp.Q.value = 1.2;
    const crackGain = ctx.createGain();
    crackSrc.connect(crackBp); crackBp.connect(crackGain); crackGain.connect(masterComp);
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(0.22, now + 1.5);
    crackGain.gain.setValueAtTime(0.22, now + FIRE_DURATION - 2.5);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    crackSrc.start(now);

    // Airy high hiss — barely audible flame breath
    const hissLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
    const hissData = hissBuf.getChannelData(0);
    for (let i = 0; i < hissLen; i++) hissData[i] = Math.random() * 2 - 1;
    const hissSrc = ctx.createBufferSource(); hissSrc.buffer = hissBuf;
    const hissHp = ctx.createBiquadFilter(); hissHp.type = 'bandpass'; hissHp.frequency.value = 3500; hissHp.Q.value = 0.3;
    const hissGain = ctx.createGain();
    hissSrc.connect(hissHp); hissHp.connect(hissGain); hissGain.connect(masterComp);
    hissGain.gain.setValueAtTime(0, now);
    hissGain.gain.linearRampToValueAtTime(0.06, now + 2.5);
    hissGain.gain.setValueAtTime(0.06, now + FIRE_DURATION - 3.5);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    hissSrc.start(now);
  }

  return { playTick, playExplosion, playFire, startAmbient };
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
  const fireCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireAnimRef = useRef<number | null>(null);

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
          // Start fire effects 800ms after explosion (as fireball fades)
          setTimeout(() => {
            audioRef.current?.playFire();
            triggerFire();
          }, 800);
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
    const cx = W / 2, cy = H / 2;
    const t0 = performance.now();

    // Debris particles
    const debris = Array.from({ length: 280 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 22 + 6;
      const isHot = i < 120;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * spd * (0.6 + Math.random() * 0.4),
        vy: Math.sin(angle) * spd * (0.6 + Math.random() * 0.4) - Math.random() * 8,
        size: isHot ? Math.random() * 5 + 1.5 : Math.random() * 3 + 0.5,
        life: Math.random() * 0.4 + 0.6,
        color: isHot
          ? ['#fff','#ffee88','#ffaa00','#ff6600','#ff2200'][Math.floor(Math.random()*5)]
          : ['#888','#666','#444','#333'][Math.floor(Math.random()*4)],
        grav: Math.random() * 0.5 + 0.2,
        trail: [] as {x:number,y:number}[],
      };
    });

    // Shockwave rings — 5 of them, different speeds/colors
    const rings = [
      { delay:0,   maxR: Math.max(W,H)*1.1, thick:28, r:'255,255,200' },
      { delay:40,  maxR: Math.max(W,H)*0.95, thick:18, r:'255,160,0' },
      { delay:100, maxR: Math.max(W,H)*0.78, thick:12, r:'255,80,0' },
      { delay:200, maxR: Math.max(W,H)*0.55, thick:8,  r:'200,40,0' },
      { delay:350, maxR: Math.max(W,H)*0.38, thick:5,  r:'255,220,100' },
    ];

    // Smoke puffs
    const smokes = Array.from({ length: 16 }, () => ({
      x: cx + (Math.random()-0.5)*120,
      y: cy + (Math.random()-0.5)*80,
      vx: (Math.random()-0.5)*2.5,
      vy: -(Math.random()*3+1.5),
      r: Math.random()*60+30,
      delay: Math.random()*400,
    }));

    const TOTAL = 5000;

    function frame(now: number) {
      const el = now - t0;
      const gt = el / TOTAL;
      if (gt > 1) { document.body.removeChild(canvas); return; }

      c.clearRect(0, 0, W, H);

      // ── Shockwaves ──
      rings.forEach(ring => {
        const rt = Math.max(0, (el - ring.delay) / (TOTAL * 0.4));
        if (rt <= 0 || rt > 1) return;
        const radius = rt * ring.maxR;
        const alpha = Math.pow(1 - rt, 2.2);
        const width = ring.thick * (1 - rt * 0.6);
        c.beginPath();
        c.arc(cx, cy, radius, 0, Math.PI*2);
        c.strokeStyle = `rgba(${ring.r},${alpha.toFixed(3)})`;
        c.lineWidth = width;
        c.stroke();
      });

      // ── Central fireball — 3-phase: white → orange → red ──
      if (el < 800) {
        const ft = el / 800;
        const alpha = Math.pow(1 - ft, 0.7);
        const maxR = Math.min(W, H) * 0.55;
        const r = (1 - Math.pow(ft, 0.35)) * maxR + 30;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        if (ft < 0.25) {
          g.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`);
          g.addColorStop(0.25,`rgba(255,255,180,${alpha.toFixed(3)})`);
          g.addColorStop(0.6, `rgba(255,160,0,${(alpha*0.8).toFixed(3)})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
        } else {
          g.addColorStop(0,   `rgba(255,220,80,${(alpha*0.9).toFixed(3)})`);
          g.addColorStop(0.3, `rgba(255,100,0,${(alpha*0.8).toFixed(3)})`);
          g.addColorStop(0.65,`rgba(180,20,0,${(alpha*0.5).toFixed(3)})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
        }
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
      }

      // ── Secondary explosion bloom (250ms) ──
      if (el > 250 && el < 1200) {
        const st = (el - 250) / 950;
        const alpha = Math.pow(1 - st, 1.5);
        const r = st * Math.min(W,H) * 0.38;
        const g2 = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        g2.addColorStop(0,   `rgba(255,200,50,${alpha.toFixed(3)})`);
        g2.addColorStop(0.4, `rgba(255,80,0,${(alpha*0.7).toFixed(3)})`);
        g2.addColorStop(1,   'rgba(0,0,0,0)');
        c.fillStyle = g2;
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
      }

      // ── Screen-edge vignette flash ──
      if (el < 300) {
        const vt = el / 300;
        const va = (1 - vt) * 0.7;
        const vg = c.createRadialGradient(cx, cy, Math.min(W,H)*0.3, cx, cy, Math.max(W,H)*0.9);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, `rgba(255,80,0,${va.toFixed(3)})`);
        c.fillStyle = vg; c.fillRect(0,0,W,H);
      }

      // ── Smoke puffs ──
      smokes.forEach(sm => {
        const st = Math.max(0, (el - sm.delay) / 3000);
        if (st <= 0 || st > 1) return;
        const sr = sm.r * (1 + st * 3.5);
        const sa = st < 0.1 ? st/0.1 * 0.18 : Math.pow(1-st, 2.5) * 0.18;
        const sx = sm.x + sm.vx * st * 60;
        const sy = sm.y + sm.vy * st * 60;
        const grey = Math.floor(20 + st * 80);
        c.globalAlpha = sa;
        c.fillStyle = `rgb(${grey},${grey},${grey})`;
        c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI*2); c.fill();
        c.globalAlpha = 1;
      });

      // ── Debris/embers ──
      const dt16 = Math.min((now - (t0 + el - 16)) / 16, 3);
      debris.forEach(d => {
        const lt = gt / d.life;
        if (lt > 1) return;
        const alpha = Math.pow(1 - lt, 1.4);
        d.x += d.vx * 0.016 * 60;
        d.y += d.vy * 0.016 * 60;
        d.vy += d.grav * 0.016 * 60 * 0.016;
        d.vx *= 0.995;
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 8) d.trail.shift();

        // Streak trail
        if (d.trail.length > 2) {
          c.beginPath();
          c.moveTo(d.trail[0].x, d.trail[0].y);
          d.trail.forEach(p => c.lineTo(p.x, p.y));
          c.strokeStyle = d.color;
          c.globalAlpha = alpha * 0.35;
          c.lineWidth = d.size * 0.5;
          c.stroke();
          c.globalAlpha = 1;
        }

        // Core dot
        c.globalAlpha = alpha;
        c.fillStyle = d.color;
        c.beginPath(); c.arc(d.x, d.y, d.size * (1 - lt * 0.5), 0, Math.PI*2); c.fill();
        c.globalAlpha = 1;
      });

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  };

  // ── FIRE VISUAL: hardcore COD-style fire rendered on internal canvas ref ──
  const triggerFire = () => {
    const canvas = fireCanvasRef.current;
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const DURATION = 10000;
    const start = performance.now();

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      type: 'flame' | 'ember' | 'smoke';
      hue: number; wobble: number; wobbleSpeed: number;
    }

    const particles: Particle[] = [];

    // Pre-seed dense initial burst — fire is visible immediately
    for (let i = 0; i < 140; i++) {
      const spread = 280;
      const t_off = Math.random();
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * spread,
        y: H - t_off * 320,
        vx: (Math.random() - 0.5) * 2.8,
        vy: -(Math.random() * 7 + 4),
        size: Math.random() * 65 + 22,
        life: t_off * 700, maxLife: Math.random() * 900 + 500,
        type: 'flame', hue: Math.random() * 35,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.1 + 0.03,
      });
    }
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * 320,
        y: H - Math.random() * 280,
        vx: (Math.random() - 0.5) * 4,
        vy: -(Math.random() * 5 + 2),
        size: Math.random() * 4 + 1.5,
        life: Math.random() * 500, maxLife: Math.random() * 2200 + 800,
        type: 'ember', hue: Math.random() * 40,
        wobble: 0, wobbleSpeed: 0,
      });
    }

    function spawnBatch(elapsed: number) {
      const fadeOut = Math.max(0, 1 - elapsed / DURATION);
      const count = Math.floor(fadeOut * 14) + 4;
      const spread = 240 * fadeOut + 90;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: W * 0.5 + (Math.random() - 0.5) * spread,
          y: H,
          vx: (Math.random() - 0.5) * 2.8,
          vy: -(Math.random() * 8 + 4),
          size: Math.random() * 68 + 20,
          life: 0, maxLife: Math.random() * 850 + 450,
          type: 'flame', hue: Math.random() * 35,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.1 + 0.03,
        });
      }
      for (let i = 0; i < Math.ceil(count * 0.45); i++) {
        particles.push({
          x: W * 0.5 + (Math.random() - 0.5) * spread,
          y: H - Math.random() * 90,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -(Math.random() * 4.5 + 1.5),
          size: Math.random() * 4.5 + 1,
          life: 0, maxLife: Math.random() * 2800 + 1000,
          type: 'ember', hue: Math.random() * 40,
          wobble: 0, wobbleSpeed: 0,
        });
      }
      if (Math.random() < 0.2) {
        particles.push({
          x: W * 0.5 + (Math.random() - 0.5) * spread * 0.5,
          y: H - 90 - Math.random() * 70,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -(Math.random() * 1.2 + 0.4),
          size: Math.random() * 90 + 45,
          life: 0, maxLife: Math.random() * 4000 + 1500,
          type: 'smoke', hue: 0, wobble: 0, wobbleSpeed: 0,
        });
      }
    }

    let lastT = start;

    function draw(now: number) {
      const elapsed = now - start;
      const globalT = elapsed / DURATION;
      const dt = Math.min(now - lastT, 50);
      lastT = now;

      if (globalT > 1.05) {
        ctx2d.clearRect(0, 0, W, H);
        return;
      }

      ctx2d.clearRect(0, 0, W, H);

      const intensity = Math.max(0, 1 - globalT);

      // Ground fire glow — wide orange bloom rising from bottom
      const glowW = 300 + intensity * 200;
      const glow = ctx2d.createRadialGradient(W / 2, H, 0, W / 2, H - 150, glowW);
      glow.addColorStop(0,    `rgba(255,140,0,${(intensity * 0.6).toFixed(3)})`);
      glow.addColorStop(0.3,  `rgba(255,60,0,${(intensity * 0.4).toFixed(3)})`);
      glow.addColorStop(0.65, `rgba(180,20,0,${(intensity * 0.15).toFixed(3)})`);
      glow.addColorStop(1,    'rgba(0,0,0,0)');
      ctx2d.fillStyle = glow;
      ctx2d.fillRect(0, 0, W, H);

      spawnBatch(elapsed);

      // Render order: smoke → flame → ember
      const sorted = particles.slice().sort((a, b) => {
        const o = { smoke: 0, flame: 1, ember: 2 } as const;
        return o[a.type] - o[b.type];
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }

        const lt = p.life / p.maxLife;
        const dtS = dt / 16;
        p.wobble += p.wobbleSpeed;
        p.x += (p.vx + Math.sin(p.wobble) * 1.0) * dtS;
        p.y += p.vy * dtS;
        p.vy += 0.045 * dtS;

        if (p.type === 'flame') {
          const grow = lt < 0.2 ? lt / 0.2 : 1;
          const shrink = lt > 0.3 ? 1 - (lt - 0.3) / 0.7 : 1;
          const s = p.size * grow * shrink;
          const alpha = (lt < 0.1 ? lt / 0.1 : Math.pow(1 - lt, 1.05)) * (intensity * 0.85 + 0.12);
          const grad = ctx2d.createRadialGradient(p.x, p.y + s * 0.15, s * 0.05, p.x, p.y, s);
          grad.addColorStop(0,    `hsla(58,100%,98%,${Math.min(1, alpha * 1.3).toFixed(3)})`);
          grad.addColorStop(0.12, `hsla(48,100%,85%,${alpha.toFixed(3)})`);
          grad.addColorStop(0.38, `hsla(${28 - p.hue},100%,58%,${alpha.toFixed(3)})`);
          grad.addColorStop(0.68, `hsla(${10 + p.hue},100%,36%,${(alpha * 0.72).toFixed(3)})`);
          grad.addColorStop(1,    'hsla(0,70%,12%,0)');
          ctx2d.fillStyle = grad;
          ctx2d.beginPath();
          ctx2d.ellipse(p.x, p.y, s * 0.4, s, Math.sin(p.wobble * 0.4) * 0.2, 0, Math.PI * 2);
          ctx2d.fill();

        } else if (p.type === 'ember') {
          const alpha = Math.pow(1 - lt, 1.5) * Math.min(1, intensity + 0.35);
          const s = p.size * (1 - lt * 0.4);
          const eg = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 6);
          eg.addColorStop(0, `rgba(255,200,0,${(alpha * 0.5).toFixed(3)})`);
          eg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx2d.fillStyle = eg;
          ctx2d.beginPath(); ctx2d.arc(p.x, p.y, s * 6, 0, Math.PI * 2); ctx2d.fill();
          ctx2d.globalAlpha = Math.min(1, alpha);
          ctx2d.fillStyle = `hsl(${38 - p.hue * lt * 1.5},100%,${88 - lt * 48}%)`;
          ctx2d.beginPath(); ctx2d.arc(p.x, p.y, s, 0, Math.PI * 2); ctx2d.fill();
          ctx2d.globalAlpha = 1;

        } else {
          const alpha = (lt < 0.08 ? lt / 0.08 : Math.pow(1 - lt, 2.2)) * 0.16;
          const s = p.size * (1 + lt * 2.4);
          const grey = Math.floor(18 + lt * 60);
          ctx2d.globalAlpha = alpha;
          ctx2d.fillStyle = `rgb(${grey},${grey},${grey})`;
          ctx2d.beginPath(); ctx2d.arc(p.x, p.y, s, 0, Math.PI * 2); ctx2d.fill();
          ctx2d.globalAlpha = 1;
        }
      }

      fireAnimRef.current = requestAnimationFrame(draw);
    }

    fireAnimRef.current = requestAnimationFrame(draw);
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

      {/* Fire canvas — always mounted, drawn on after explosion. z-index 40 = above text */}
      <canvas
        ref={fireCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 40 }}
      />

      {/* Dark smoky COD battlefield background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 60%, rgba(80,25,0,0.9) 0%, rgba(30,8,0,1) 40%, rgba(5,2,0,1) 75%, #000 100%)',
      }} />

      {/* Smoke/ember atmospheric haze */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 80%, rgba(140,40,0,0.25) 0%, transparent 55%), radial-gradient(ellipse at 20% 40%, rgba(80,20,0,0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 30%, rgba(60,15,0,0.12) 0%, transparent 35%)',
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
          paddingTop: '1rem',
          paddingBottom: '1rem',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}>

          {/* Logo — shifted down slightly, smaller to avoid clipping */}
          <div style={{
            marginTop: '1.5rem',
            marginBottom: '2rem',
            animation: 'dropIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}>
            <div style={{
              filter: 'drop-shadow(0 0 50px rgba(218,165,32,0.8)) drop-shadow(0 0 100px rgba(218,165,32,0.4))',
            }}>
              <img
                src="/squad-up-logo.png"
                alt="Squad Up Gaming"
                style={{
                  height: '200px',
                  objectFit: 'contain',
                  animation: 'floatLogo 4s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* COMING SOON — fire-engulfed, cracked stone, matching the image */}
          <div style={{ position: 'relative', lineHeight: 1, margin: '0 auto', textAlign: 'center' }}>

            {/* Ambient fire glow behind text */}
            <div style={{
              position: 'absolute', inset: '-40px -60px',
              background: 'radial-gradient(ellipse at 50% 70%, rgba(255,80,0,0.55) 0%, rgba(200,40,0,0.3) 35%, rgba(100,10,0,0.15) 60%, transparent 80%)',
              filter: 'blur(18px)',
              zIndex: 0,
              animation: 'firePulse 1.8s ease-in-out infinite',
            }} />

            {/* COMING */}
            <div style={{ position: 'relative', zIndex: 1, animation: 'fadeSlideUp 0.7s ease-out 0.1s both' }}>
              <span style={{
                display: 'block',
                fontSize: 'clamp(3.8rem, 10vw, 7.5rem)',
                fontWeight: '900',
                fontFamily: '"Georgia", "Times New Roman", serif',
                letterSpacing: '0.12em',
                lineHeight: 0.92,
                textTransform: 'uppercase',
                // Cracked molten stone: dark charred base, glowing hot cracks
                background: 'linear-gradient(180deg, #fff8c0 0%, #ffcc00 8%, #ff8800 22%, #cc4400 42%, #8b2200 62%, #4a1000 80%, #1a0500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `
                  drop-shadow(0 0 8px rgba(255,120,0,0.9))
                  drop-shadow(0 0 20px rgba(255,60,0,0.7))
                  drop-shadow(0 0 45px rgba(200,30,0,0.5))
                  drop-shadow(2px 4px 0 rgba(0,0,0,0.9))
                  drop-shadow(4px 8px 0 rgba(0,0,0,0.7))
                `,
                animation: 'fireFlicker 2.3s ease-in-out infinite',
              }}>COMING</span>
            </div>

            {/* SOON — larger, more intense */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: '-0.05em', animation: 'fadeSlideUp 0.7s ease-out 0.25s both' }}>
              <span style={{
                display: 'block',
                fontSize: 'clamp(5.5rem, 15vw, 11rem)',
                fontWeight: '900',
                fontFamily: '"Georgia", "Times New Roman", serif',
                letterSpacing: '0.08em',
                lineHeight: 0.92,
                textTransform: 'uppercase',
                // Hotter at the top — white/yellow core, deep red bottom
                background: 'linear-gradient(180deg, #ffffff 0%, #fff5a0 5%, #ffcc00 15%, #ff8800 30%, #ff4400 50%, #bb2200 68%, #6a1000 85%, #1a0400 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `
                  drop-shadow(0 0 12px rgba(255,140,0,1))
                  drop-shadow(0 0 30px rgba(255,60,0,0.85))
                  drop-shadow(0 0 65px rgba(180,20,0,0.6))
                  drop-shadow(0 0 100px rgba(120,0,0,0.4))
                  drop-shadow(3px 6px 0 rgba(0,0,0,0.95))
                  drop-shadow(6px 12px 0 rgba(0,0,0,0.7))
                `,
                animation: 'fireFlicker 1.9s ease-in-out infinite 0.3s',
              }}>SOON</span>
            </div>

            {/* Fire overlay canvas is drawn on top via z-index 30 */}
          </div>

          {/* Gold divider line */}
          <div style={{
            width: '300px',
            height: '2px',
            margin: '1rem auto',
            background: 'linear-gradient(90deg, transparent, #b8860b, #ffd700, #ffed4e, #ffd700, #b8860b, transparent)',
            boxShadow: '0 0 20px rgba(218,165,32,0.8), 0 0 40px rgba(218,165,32,0.4)',
            animation: 'fadeSlideUp 1s ease-out 0.5s both, linePulse 3s ease-in-out infinite',
          }} />

          {/* Tagline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'fadeSlideUp 1s ease-out 0.6s both',
            marginBottom: '0.5rem',
          }}>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #ffd700)', opacity: 0.6 }} />
            <span style={{ color: '#ffd700', fontSize: '1rem', opacity: 0.8 }}>◆</span>
            <p style={{
              color: '#c8a84b',
              letterSpacing: '0.35em',
              fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
              fontWeight: '700',
              textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              margin: 0,
            }}>
              PREPARE FOR BATTLE
            </p>
            <span style={{ color: '#ffd700', fontSize: '1rem', opacity: 0.8 }}>◆</span>
            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, #ffd700, transparent)', opacity: 0.6 }} />
          </div>

          <p style={{
            color: '#5a4010',
            letterSpacing: '0.5em',
            fontSize: '0.65rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
            animation: 'fadeSlideUp 1s ease-out 0.8s both',
            margin: 0,
          }}>
            ELITE GAMING PLATFORM
          </p>
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
        @keyframes fireFlicker {
          0%   { filter: drop-shadow(0 0 12px rgba(255,140,0,1)) drop-shadow(0 0 30px rgba(255,60,0,0.85)) drop-shadow(0 0 65px rgba(180,20,0,0.6)) drop-shadow(3px 6px 0 rgba(0,0,0,0.95)); }
          25%  { filter: drop-shadow(0 0 18px rgba(255,160,0,1)) drop-shadow(0 0 45px rgba(255,80,0,0.9)) drop-shadow(0 0 90px rgba(200,30,0,0.7)) drop-shadow(3px 6px 0 rgba(0,0,0,0.95)); }
          50%  { filter: drop-shadow(0 0 8px rgba(255,100,0,0.9)) drop-shadow(0 0 22px rgba(220,50,0,0.75)) drop-shadow(0 0 50px rgba(150,15,0,0.5)) drop-shadow(3px 6px 0 rgba(0,0,0,0.95)); }
          75%  { filter: drop-shadow(0 0 20px rgba(255,180,0,1)) drop-shadow(0 0 50px rgba(255,90,0,0.9)) drop-shadow(0 0 100px rgba(210,35,0,0.65)) drop-shadow(3px 6px 0 rgba(0,0,0,0.95)); }
          100% { filter: drop-shadow(0 0 12px rgba(255,140,0,1)) drop-shadow(0 0 30px rgba(255,60,0,0.85)) drop-shadow(0 0 65px rgba(180,20,0,0.6)) drop-shadow(3px 6px 0 rgba(0,0,0,0.95)); }
        }
        @keyframes firePulse {
          0%,100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.06); }
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
