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

  // ── COD/BATTLEFIELD-STYLE HARD EXPLOSION ──
  function playExplosion() {
    const now = ctx.currentTime;

    // Layer 1: Massive sub-bass punch — the shockwave hitting your chest
    const subOsc = ctx.createOscillator(); const subGain = ctx.createGain();
    subOsc.connect(subGain); subGain.connect(masterComp);
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(18, now + 0.8);
    subGain.gain.setValueAtTime(3.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    subOsc.start(now); subOsc.stop(now + 1.05);

    // Layer 2: Sharp impact transient — the initial detonation crack
    const impactBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const impactData = impactBuf.getChannelData(0);
    for (let i = 0; i < impactData.length; i++) {
      impactData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impactData.length, 0.3);
    }
    const impactSrc = ctx.createBufferSource(); impactSrc.buffer = impactBuf;
    const impactFilter = ctx.createBiquadFilter(); impactFilter.type = 'lowpass'; impactFilter.frequency.value = 3000;
    const impactGain = ctx.createGain();
    impactSrc.connect(impactFilter); impactFilter.connect(impactGain); impactGain.connect(masterComp);
    impactGain.gain.setValueAtTime(4.0, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    impactSrc.start(now);

    // Layer 3: Heavy rumble tail — the rolling concussion wave
    const rumbleLen = Math.floor(ctx.sampleRate * 3.5);
    const rumbleBuf = ctx.createBuffer(1, rumbleLen, ctx.sampleRate);
    const rumbleData = rumbleBuf.getChannelData(0);
    for (let i = 0; i < rumbleLen; i++) rumbleData[i] = Math.random() * 2 - 1;
    const rumbleSrc = ctx.createBufferSource(); rumbleSrc.buffer = rumbleBuf;
    const rumbleLp = ctx.createBiquadFilter(); rumbleLp.type = 'lowpass'; rumbleLp.frequency.value = 350;
    const rumblePeak = ctx.createBiquadFilter(); rumblePeak.type = 'peaking'; rumblePeak.frequency.value = 120; rumblePeak.gain.value = 14;
    const rumbleGain = ctx.createGain();
    rumbleSrc.connect(rumbleLp); rumbleLp.connect(rumblePeak); rumblePeak.connect(rumbleGain); rumbleGain.connect(masterComp);
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(2.2, now + 0.02);
    rumbleGain.gain.setValueAtTime(2.2, now + 0.1);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    rumbleSrc.start(now);

    // Layer 4: Mid-range debris crunch — shrapnel and structural collapse
    const debrisLen = Math.floor(ctx.sampleRate * 1.5);
    const debrisBuf = ctx.createBuffer(1, debrisLen, ctx.sampleRate);
    const debrisData = debrisBuf.getChannelData(0);
    for (let i = 0; i < debrisLen; i++) {
      debrisData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / debrisLen, 0.7);
    }
    const debrisSrc = ctx.createBufferSource(); debrisSrc.buffer = debrisBuf;
    const debrisBp = ctx.createBiquadFilter(); debrisBp.type = 'bandpass'; debrisBp.frequency.value = 800; debrisBp.Q.value = 0.5;
    const debrisGain = ctx.createGain();
    debrisSrc.connect(debrisBp); debrisBp.connect(debrisGain); debrisGain.connect(masterComp);
    debrisGain.gain.setValueAtTime(0, now + 0.02);
    debrisGain.gain.linearRampToValueAtTime(1.4, now + 0.05);
    debrisGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    debrisSrc.start(now + 0.02);

    // Layer 5: High-freq pressure ring — that ear-ringing shockwave hiss
    const ringOsc = ctx.createOscillator(); const ringGain = ctx.createGain();
    ringOsc.connect(ringGain); ringGain.connect(masterComp);
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(3800, now + 0.05);
    ringOsc.frequency.exponentialRampToValueAtTime(1200, now + 2.5);
    ringGain.gain.setValueAtTime(0, now + 0.05);
    ringGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    ringOsc.start(now + 0.05); ringOsc.stop(now + 3.0);
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

  // ── FIRE: crackling burn sound that starts after explosion ──
  function playFire() {
    const now = ctx.currentTime;
    const FIRE_DURATION = 8.0;

    // Layer 1: Low rumbling base — the steady combustion roar
    const baseLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const baseBuf = ctx.createBuffer(1, baseLen, ctx.sampleRate);
    const baseData = baseBuf.getChannelData(0);
    for (let i = 0; i < baseLen; i++) baseData[i] = Math.random() * 2 - 1;
    const baseSrc = ctx.createBufferSource(); baseSrc.buffer = baseBuf;
    const baseLp = ctx.createBiquadFilter(); baseLp.type = 'lowpass'; baseLp.frequency.value = 220;
    const basePeak = ctx.createBiquadFilter(); basePeak.type = 'peaking'; basePeak.frequency.value = 80; basePeak.gain.value = 10;
    const baseGain = ctx.createGain();
    baseSrc.connect(baseLp); baseLp.connect(basePeak); basePeak.connect(baseGain); baseGain.connect(masterComp);
    baseGain.gain.setValueAtTime(0, now);
    baseGain.gain.linearRampToValueAtTime(0.55, now + 0.8);
    baseGain.gain.setValueAtTime(0.55, now + FIRE_DURATION - 2.5);
    baseGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    baseSrc.start(now);

    // Layer 2: Mid crackle — the snapping and popping of burning material
    const crackLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      // Sparse random pops — silence most of the time, occasional sharp burst
      crackData[i] = Math.random() < 0.015 ? (Math.random() * 2 - 1) * 4 : 0;
    }
    const crackSrc = ctx.createBufferSource(); crackSrc.buffer = crackBuf;
    const crackBp = ctx.createBiquadFilter(); crackBp.type = 'bandpass'; crackBp.frequency.value = 1200; crackBp.Q.value = 0.8;
    const crackGain = ctx.createGain();
    crackSrc.connect(crackBp); crackBp.connect(crackGain); crackGain.connect(masterComp);
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(0.7, now + 1.2);
    crackGain.gain.setValueAtTime(0.7, now + FIRE_DURATION - 2.0);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    crackSrc.start(now);

    // Layer 3: High whoosh — flickering flame breath
    const whooshLen = Math.floor(ctx.sampleRate * FIRE_DURATION);
    const whooshBuf = ctx.createBuffer(1, whooshLen, ctx.sampleRate);
    const whooshData = whooshBuf.getChannelData(0);
    for (let i = 0; i < whooshLen; i++) whooshData[i] = Math.random() * 2 - 1;
    const whooshSrc = ctx.createBufferSource(); whooshSrc.buffer = whooshBuf;
    const whooshHp = ctx.createBiquadFilter(); whooshHp.type = 'bandpass'; whooshHp.frequency.value = 2800; whooshHp.Q.value = 0.4;
    const whooshGain = ctx.createGain();
    whooshSrc.connect(whooshHp); whooshHp.connect(whooshGain); whooshGain.connect(masterComp);
    whooshGain.gain.setValueAtTime(0, now);
    whooshGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
    whooshGain.gain.setValueAtTime(0.18, now + FIRE_DURATION - 3.0);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + FIRE_DURATION);
    whooshSrc.start(now);
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
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;';
    document.body.appendChild(canvas);
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx2d = canvas.getContext('2d')!;
    const cx = W / 2, cy = H / 2;
    const start = performance.now();
    const DURATION = 3000;

    // Embers
    const embers = Array.from({ length: 220 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 18 + 4;
      const size = Math.random() * 4 + 1;
      const life = Math.random() * 0.5 + 0.5;
      const colors = ['#ff4400','#ff6600','#ff8800','#ffaa00','#ffcc00','#ffffff','#ff2200'];
      return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - Math.random() * 6, size, life, color: colors[Math.floor(Math.random() * colors.length)], gravity: Math.random() * 0.3 + 0.1 };
    });

    // Shockwave rings
    const rings = [
      { delay: 0,   color: 'rgba(255,200,80,', maxR: Math.max(W, H) * 0.85, thickness: 18 },
      { delay: 80,  color: 'rgba(255,120,30,', maxR: Math.max(W, H) * 0.65, thickness: 10 },
      { delay: 160, color: 'rgba(255,255,255,', maxR: Math.max(W, H) * 0.45, thickness: 6  },
    ];

    function draw(now: number) {
      const elapsed = now - start;
      const t = elapsed / DURATION;
      if (t > 1) { document.body.removeChild(canvas); return; }

      ctx2d.clearRect(0, 0, W, H);

      // Shockwave rings
      rings.forEach(ring => {
        const rt = Math.max(0, (elapsed - ring.delay) / (DURATION * 0.55));
        if (rt <= 0 || rt > 1) return;
        const r = rt * ring.maxR;
        const alpha = Math.pow(1 - rt, 1.8);
        const width = ring.thickness * (1 - rt * 0.7);
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, r, 0, Math.PI * 2);
        ctx2d.strokeStyle = `${ring.color}${alpha.toFixed(3)})`;
        ctx2d.lineWidth = width;
        ctx2d.stroke();
      });

      // Central fireball glow
      if (t < 0.45) {
        const ft = t / 0.45;
        const alpha = Math.pow(1 - ft, 1.2);
        const radius = (1 - Math.pow(ft, 0.4)) * 320 + 40;
        const grad = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(255,255,220,${(alpha * 0.95).toFixed(3)})`);
        grad.addColorStop(0.2, `rgba(255,180,20,${(alpha * 0.85).toFixed(3)})`);
        grad.addColorStop(0.55, `rgba(255,60,0,${(alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx2d.fillStyle = grad;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // Embers
      const dt = 16;
      embers.forEach(e => {
        if (t > e.life) return;
        const et = t / e.life;
        e.x += e.vx * (dt / 1000) * (1 - et * 0.6) * 60;
        e.y += (e.vy + e.gravity * elapsed / 16) * (dt / 1000) * 60;
        const alpha = Math.pow(1 - et, 1.5);
        const s = e.size * (1 - et * 0.5);
        ctx2d.beginPath();
        ctx2d.arc(e.x, e.y, s, 0, Math.PI * 2);
        ctx2d.fillStyle = e.color.replace(')', `,${alpha.toFixed(2)})`).replace('rgb', 'rgba');
        // fallback: just set globalAlpha
        ctx2d.globalAlpha = alpha;
        ctx2d.fillStyle = e.color;
        ctx2d.fill();
        ctx2d.globalAlpha = 1;
      });

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  };

  // ── FIRE VISUAL: persistent flame tongues + smoke + embers after explosion ──
  const triggerFire = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:9998;pointer-events:none;';
    document.body.appendChild(canvas);
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx2d = canvas.getContext('2d')!;
    const cx = W / 2;
    const DURATION = 8000;
    const start = performance.now();

    // Fire particles — spawn from bottom-center, rise upward
    interface FireParticle {
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      type: 'flame' | 'ember' | 'smoke';
      hue: number;
    }

    const particles: FireParticle[] = [];

    function spawnParticles(elapsed: number) {
      const intensity = Math.max(0, 1 - elapsed / DURATION);
      const count = Math.floor(intensity * 8) + 2;
      for (let i = 0; i < count; i++) {
        const spread = 180 * intensity + 60;
        const x = cx + (Math.random() - 0.5) * spread;
        const baseY = H * 0.72;

        // Flame tongue
        if (Math.random() < 0.6) {
          particles.push({
            x, y: baseY,
            vx: (Math.random() - 0.5) * 1.8,
            vy: -(Math.random() * 5 + 3) * intensity - 1.5,
            size: Math.random() * 28 + 10,
            life: 0, maxLife: Math.random() * 900 + 400,
            type: 'flame',
            hue: Math.random() * 40, // 0-40 = red-orange range
          });
        }
        // Ember
        if (Math.random() < 0.25) {
          particles.push({
            x, y: baseY - Math.random() * 60,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            size: Math.random() * 3 + 1,
            life: 0, maxLife: Math.random() * 1800 + 600,
            type: 'ember',
            hue: Math.random() * 50,
          });
        }
        // Smoke
        if (Math.random() < 0.15) {
          particles.push({
            x: cx + (Math.random() - 0.5) * spread * 0.6,
            y: baseY - 60 - Math.random() * 40,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(Math.random() * 1.5 + 0.5),
            size: Math.random() * 60 + 30,
            life: 0, maxLife: Math.random() * 2500 + 1000,
            type: 'smoke',
            hue: 0,
          });
        }
      }
    }

    let lastTime = start;

    function draw(now: number) {
      const elapsed = now - start;
      const t = elapsed / DURATION;
      const dt = now - lastTime;
      lastTime = now;

      if (t > 1) {
        document.body.removeChild(canvas);
        return;
      }

      ctx2d.clearRect(0, 0, W, H);

      // Spawn new particles
      spawnParticles(elapsed);

      // Ground fire glow — ambient orange light pool at base
      const intensity = Math.max(0, 1 - t);
      const glowRadius = (180 + intensity * 120);
      const glow = ctx2d.createRadialGradient(cx, H * 0.72, 0, cx, H * 0.72, glowRadius);
      glow.addColorStop(0, `rgba(255,120,0,${(intensity * 0.35).toFixed(3)})`);
      glow.addColorStop(0.5, `rgba(255,60,0,${(intensity * 0.15).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx2d.fillStyle = glow;
      ctx2d.fillRect(0, 0, W, H);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }

        const lt = p.life / p.maxLife; // 0=birth, 1=death
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        // Turbulence
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy -= 0.05; // buoyancy

        if (p.type === 'flame') {
          // Flame: grows then shrinks, orange-yellow core
          const sizeFactor = lt < 0.3 ? lt / 0.3 : 1 - (lt - 0.3) / 0.7;
          const size = p.size * sizeFactor;
          const alpha = lt < 0.15 ? lt / 0.15 : Math.pow(1 - lt, 1.3);
          const grad = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
          const lightness = 70 + (1 - lt) * 20;
          grad.addColorStop(0,   `hsla(${60 - p.hue * 0.3}, 100%, ${lightness}%, ${alpha.toFixed(3)})`);
          grad.addColorStop(0.3, `hsla(${30 - p.hue}, 100%, 60%, ${(alpha * 0.85).toFixed(3)})`);
          grad.addColorStop(0.7, `hsla(${p.hue}, 100%, 40%, ${(alpha * 0.5).toFixed(3)})`);
          grad.addColorStop(1,   `hsla(${p.hue}, 80%, 20%, 0)`);
          ctx2d.fillStyle = grad;
          ctx2d.beginPath();
          ctx2d.ellipse(p.x, p.y, size * 0.55, size, 0, 0, Math.PI * 2);
          ctx2d.fill();

        } else if (p.type === 'ember') {
          // Ember: bright hot dot, fades as it rises and cools
          const alpha = Math.pow(1 - lt, 1.8) * (intensity * 0.6 + 0.4);
          const size = p.size * (1 - lt * 0.4);
          ctx2d.globalAlpha = alpha;
          ctx2d.fillStyle = `hsl(${40 - p.hue * lt}, 100%, ${80 - lt * 40}%)`;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx2d.fill();
          // Glow halo
          const eGlow = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
          eGlow.addColorStop(0, `rgba(255,160,0,${(alpha * 0.4).toFixed(3)})`);
          eGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx2d.fillStyle = eGlow;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
          ctx2d.fill();
          ctx2d.globalAlpha = 1;

        } else {
          // Smoke: grey expanding ring, drifts upward
          const alpha = lt < 0.1 ? (lt / 0.1) * 0.12 : Math.pow(1 - lt, 2) * 0.12;
          const size = p.size * (1 + lt * 1.8);
          const grey = Math.floor(30 + lt * 50);
          ctx2d.globalAlpha = alpha;
          ctx2d.fillStyle = `rgb(${grey},${grey},${grey})`;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx2d.fill();
          ctx2d.globalAlpha = 1;
        }
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
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

      {/* Deep space background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(20,10,0,1) 0%, #000 60%), radial-gradient(ellipse at 80% 50%, rgba(15,8,0,1) 0%, #000 60%)',
      }} />

      {/* Ambient golden fog */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(218,165,32,0.08) 0%, transparent 65%)',
        animation: 'breatheFog 4s ease-in-out infinite',
      }} />

      {/* Ground light beam */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
        width: '600px',
        height: '60%',
        background: 'conic-gradient(from 268deg at 50% 100%, transparent 0deg, rgba(218,165,32,0.06) 4deg, transparent 8deg)',
        filter: 'blur(20px)',
      }} />

      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(120)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2.5 + 0.5 + 'px',
              height: Math.random() * 2.5 + 0.5 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: Math.random() > 0.8 ? '#ffd700' : '#ffffff',
              opacity: Math.random() * 0.7 + 0.2,
              animation: `twinkle ${Math.random() * 4 + 2}s infinite`,
              animationDelay: Math.random() * 4 + 's',
            }}
          />
        ))}
      </div>

      {/* Floating gold dust */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              bottom: '-10px',
              background: 'radial-gradient(circle, #ffd700, #daa520)',
              boxShadow: '0 0 6px #ffd700',
              animation: `floatDust ${Math.random() * 8 + 6}s ease-in-out infinite`,
              animationDelay: Math.random() * 6 + 's',
              opacity: 0,
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

          {/* COMING SOON — 3D Gold Metallic */}
          <div style={{
            perspective: '1400px',
            animation: 'fadeSlideUp 1s ease-out 0.3s both',
          }}>
            <div style={{
              transformStyle: 'preserve-3d',
              animation: 'gentleRock 6s ease-in-out infinite',
              position: 'relative',
              lineHeight: 1,
            }}>

              {/* COMING — silver metallic (top word in image) */}
              <div style={{ position: 'relative', display: 'block', textAlign: 'center' }}>
                {/* Gold border glow behind */}
                <span aria-hidden style={{
                  display: 'block',
                  position: 'absolute',
                  inset: 0,
                  fontSize: 'clamp(3.5rem, 9vw, 6.5rem)',
                  fontWeight: '900',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  letterSpacing: '0.14em',
                  lineHeight: 0.95,
                  textAlign: 'center',
                  color: '#ffd700',
                  opacity: 0.15,
                  filter: 'blur(8px)',
                  pointerEvents: 'none',
                }}>COMING</span>

                <span style={{
                  display: 'block',
                  fontSize: 'clamp(3.5rem, 9vw, 6.5rem)',
                  fontWeight: '900',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  letterSpacing: '0.14em',
                  lineHeight: 0.95,
                  textAlign: 'center',
                  // Silver metallic like the image
                  background: 'linear-gradient(180deg, #ffffff 0%, #e0e0e0 20%, #c0c0c0 40%, #f5f5f5 55%, #a8a8a8 70%, #d0d0d0 85%, #888 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.8)) drop-shadow(2px 2px 0 #8b6914) drop-shadow(4px 4px 0 #6b4f00) drop-shadow(6px 6px 0 rgba(0,0,0,0.6))',
                }}>COMING</span>
              </div>

              {/* SOON — deep gold/bronze (bottom word in image, larger) */}
              <div style={{ position: 'relative', display: 'block', textAlign: 'center', marginTop: '-0.08em' }}>

                <span style={{
                  display: 'block',
                  fontSize: 'clamp(5rem, 13vw, 9rem)',
                  fontWeight: '900',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  letterSpacing: '0.1em',
                  lineHeight: 0.95,
                  textAlign: 'center',
                  // Deep gold/bronze matching image
                  background: 'linear-gradient(180deg, #fff8dc 0%, #ffd700 15%, #daa520 35%, #c8941a 50%, #b8860b 65%, #8b6914 82%, #6b4f0a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(3px 3px 0 #7a5200) drop-shadow(6px 6px 0 #4a3000) drop-shadow(9px 9px 0 rgba(0,0,0,0.7))',
                }}>SOON</span>

                {/* Ground reflection */}
                <span aria-hidden style={{
                  display: 'block',
                  fontSize: 'clamp(5rem, 13vw, 9rem)',
                  fontWeight: '900',
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  letterSpacing: '0.1em',
                  lineHeight: 0.95,
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, rgba(180,140,0,0.5) 0%, transparent 70%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'scaleY(-0.22) translateY(-30px)',
                  filter: 'blur(5px)',
                  opacity: 0.35,
                  marginTop: '-0.05em',
                  pointerEvents: 'none',
                }}>SOON</span>
              </div>
            </div>
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
