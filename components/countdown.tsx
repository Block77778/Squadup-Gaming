'use client';

import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

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

  function playTick(urgent = false) {
    const now = ctx.currentTime;

    // ── Pitched "blip" tone — rises slightly like a game beep ──
    const baseFreq = urgent ? 880 : 660;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterComp);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.15, now + 0.04);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(urgent ? 0.7 : 0.5, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (urgent ? 0.12 : 0.18));
    osc.start(now); osc.stop(now + 0.22);

    // ── Soft transient click for percussive attack ──
    const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.012), ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      const env = 1 - i / clickData.length;
      clickData[i] = (Math.random() * 2 - 1) * env * env;
    }
    const clickSrc = ctx.createBufferSource(); clickSrc.buffer = clickBuf;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass'; clickFilter.frequency.value = urgent ? 3200 : 2400; clickFilter.Q.value = 0.8;
    const clickGain = ctx.createGain();
    clickSrc.connect(clickFilter); clickFilter.connect(clickGain); clickGain.connect(masterComp);
    clickGain.gain.setValueAtTime(urgent ? 0.6 : 0.35, now);
    clickSrc.start(now);

    // ── Urgency shimmer: high harmonic ring on last 3 counts ──
    if (urgent) {
      const ring = ctx.createOscillator(); const rg = ctx.createGain();
      ring.connect(rg); rg.connect(masterComp);
      ring.type = 'triangle';
      ring.frequency.setValueAtTime(baseFreq * 3, now);
      rg.gain.setValueAtTime(0.18, now);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      ring.start(now); ring.stop(now + 0.1);
    }
  }

  function playExplosion() {
    const now = ctx.currentTime;

    // ── PARTY POPPER: sharp cork-pop thump ──
    // Low-end pressure burst — the "boom" body
    const popBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const popData = popBuf.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
      const env = Math.pow(1 - i / popData.length, 1.5);
      popData[i] = (Math.random() * 2 - 1) * env;
    }
    const popSrc = ctx.createBufferSource(); popSrc.buffer = popBuf;
    const popFilter = ctx.createBiquadFilter();
    popFilter.type = 'lowpass'; popFilter.frequency.value = 280; popFilter.Q.value = 2.5;
    const popGain = ctx.createGain();
    popSrc.connect(popFilter); popFilter.connect(popGain); popGain.connect(masterComp);
    popGain.gain.setValueAtTime(2.8, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    popSrc.start(now);

    // ── Pitched "pop" tone: quick pitch drop like a cork ──
    const corkOsc = ctx.createOscillator(); const corkGain = ctx.createGain();
    corkOsc.connect(corkGain); corkGain.connect(masterComp);
    corkOsc.type = 'sine';
    corkOsc.frequency.setValueAtTime(240, now);
    corkOsc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    corkGain.gain.setValueAtTime(1.8, now);
    corkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    corkOsc.start(now); corkOsc.stop(now + 0.18);

    // ── Confetti spray: bright noise burst (the "pshhhh" scatter) ──
    const sprayBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
    const sprayData = sprayBuf.getChannelData(0);
    for (let i = 0; i < sprayData.length; i++) {
      const env = Math.pow(1 - i / sprayData.length, 0.6);
      sprayData[i] = (Math.random() * 2 - 1) * env;
    }
    const spraySrc = ctx.createBufferSource(); spraySrc.buffer = sprayBuf;
    const sprayHigh = ctx.createBiquadFilter();
    sprayHigh.type = 'highpass'; sprayHigh.frequency.value = 3500;
    const sprayMid = ctx.createBiquadFilter();
    sprayMid.type = 'peaking'; sprayMid.frequency.value = 6000; sprayMid.gain.value = 8;
    const sprayGain = ctx.createGain();
    spraySrc.connect(sprayHigh); sprayHigh.connect(sprayMid); sprayMid.connect(sprayGain); sprayGain.connect(masterComp);
    sprayGain.gain.setValueAtTime(0.55, now + 0.03);
    sprayGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    spraySrc.start(now + 0.03);

    // ── Celebratory "ta-daaa" ping: bright upward shimmer ──
    const pingFreqs = [1047, 1319, 1568]; // C6, E6, G6
    pingFreqs.forEach((freq, i) => {
      const t = now + 0.05 + i * 0.06;
      const p = ctx.createOscillator(); const pg = ctx.createGain();
      p.connect(pg); pg.connect(masterComp);
      p.type = 'sine';
      p.frequency.setValueAtTime(freq, t);
      pg.gain.setValueAtTime(0, t);
      pg.gain.linearRampToValueAtTime(0.35, t + 0.01);
      pg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      p.start(t); p.stop(t + 0.55);
    });
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

  return { playTick, playExplosion, startAmbient };
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
    const defaults = {
      spread: 360, ticks: 200, gravity: 0.4, decay: 0.90, startVelocity: 80,
      colors: ['#ffd700', '#ffed4e', '#daa520', '#c0c0c0', '#ffd700', '#fff8dc', '#b8860b'],
    };
    confetti({ ...defaults, particleCount: 300, origin: { x: 0.5, y: 0.5 } });
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 150, origin: { x: 0.1, y: 0.3 } });
      confetti({ ...defaults, particleCount: 150, origin: { x: 0.9, y: 0.3 } });
    }, 150);
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 150, origin: { x: 0.2, y: 0.8 } });
      confetti({ ...defaults, particleCount: 150, origin: { x: 0.8, y: 0.8 } });
    }, 300);
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 200, origin: { x: 0.5, y: 0.2 } });
    }, 500);
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
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">

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

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 z-50 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(218,165,32,0.2) 50%, transparent 100%)',
          animation: 'flashPulse 0.6s ease-out forwards',
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
        @keyframes flashPulse {
          0% { opacity: 1; }
          100% { opacity: 0; }
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
