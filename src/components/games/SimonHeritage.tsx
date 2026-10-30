import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { shuffle, siteImage, useSites } from './useHeritagePool';
import { HeritageImage } from '../HeritageImage';

type Phase = 'idle' | 'showing' | 'input' | 'over';

const BEST_KEY = 'virasat_simon_best';
const TONES = [261.63, 329.63, 392.0, 523.25];
const ACCENTS = ['#B65F43', '#667653', '#B38E46', '#3E5C86'];

export const SimonHeritage: React.FC = () => {
  const sites = useSites();
  const [seed, setSeed] = useState(0);
  const cards = useMemo(() => shuffle(sites.filter(s => siteImage(s))).slice(0, 4), [sites, seed]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [sound, setSound] = useState(true);
  const [best, setBest] = useState<number>(() => {
    try { return Number(localStorage.getItem(BEST_KEY) || 0); } catch { return 0; }
  });

  const audioRef = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const beep = useCallback((i: number, ms = 320) => {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = (audioRef.current ||= new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = TONES[i];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000 + 0.05);
    } catch { /* audio is optional */ }
  }, [sound]);

  const flash = useCallback((i: number, ms = 420) => {
    setLit(i);
    beep(i, ms - 60);
    timers.current.push(window.setTimeout(() => setLit(null), ms - 120));
  }, [beep]);

  const playSequence = useCallback((seq: number[]) => {
    clearTimers();
    setPhase('showing');
    setStep(0);
    const speed = Math.max(300, 620 - seq.length * 22);
    seq.forEach((n, k) => {
      timers.current.push(window.setTimeout(() => flash(n, speed), 600 + k * speed));
    });
    timers.current.push(window.setTimeout(() => setPhase('input'), 600 + seq.length * speed));
  }, [flash]);

  const start = () => {
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    playSequence(first);
  };

  const press = (i: number) => {
    if (phase !== 'input') return;
    flash(i, 300);
    if (i !== sequence[step]) {
      setPhase('over');
      clearTimers();
      const score = sequence.length - 1;
      if (score > best) {
        setBest(score);
        try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* ignore */ }
      }
      return;
    }
    if (step + 1 === sequence.length) {
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      setPhase('showing');
      timers.current.push(window.setTimeout(() => playSequence(nextSeq), 700));
    } else setStep(step + 1);
  };

  const reset = () => { clearTimers(); setSeed(s => s + 1); setSequence([]); setPhase('idle'); setStep(0); setLit(null); };

  const status =
    phase === 'idle' ? 'Press start. Watch the cards light up, then repeat the order.' :
    phase === 'showing' ? 'Watch the order…' :
    phase === 'input' ? `Your turn. ${step} of ${sequence.length} done.` :
    `Wrong card. You repeated ${Math.max(sequence.length - 1, 0)} round${sequence.length - 1 === 1 ? '' : 's'}.`;

  if (cards.length < 4) return <p className="text-sm text-[#777267]">Four heritage photos are needed to play this game.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[#292821]">
          <span className="font-semibold">Round {Math.max(sequence.length - (phase === 'over' ? 1 : 0), 0)}</span>
          <span className="mx-2 text-[#DCC9AD]">|</span>
          <span className="text-[#777267]">Best {best}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSound(s => !s)} aria-pressed={sound} aria-label={sound ? 'Mute sound' : 'Turn sound on'}
            className="rounded-lg border border-[#DCC9AD] bg-white p-2 text-[#292821] hover:bg-[#FAF7F0]">
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {phase === 'idle' ? (
            <button type="button" onClick={start} className="inline-flex items-center gap-1.5 rounded-lg bg-[#B65F43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9A4B32]">
              <Play className="h-3.5 w-3.5" /> Start
            </button>
          ) : (
            <button type="button" onClick={phase === 'over' ? start : reset} className="inline-flex items-center gap-1.5 rounded-lg bg-[#292821] px-4 py-2 text-xs font-semibold text-white hover:bg-black">
              <RotateCcw className="h-3.5 w-3.5" /> {phase === 'over' ? 'Try again' : 'New cards'}
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 min-h-5 text-sm text-[#777267]" aria-live="polite">{status}</p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {cards.map((s, i) => {
          const active = lit === i;
          return (
            <motion.button
              key={s.id}
              type="button"
              disabled={phase !== 'input'}
              onClick={() => press(i)}
              aria-label={`${s.name} card ${i + 1}`}
              animate={{ scale: active ? 1.04 : 1 }}
              whileTap={phase === 'input' ? { scale: 0.96 } : undefined}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-[#EADFCB] text-left shadow-sm disabled:cursor-default"
              style={{ borderColor: active ? ACCENTS[i] : '#DCC9AD', boxShadow: active ? `0 0 0 4px ${ACCENTS[i]}55, 0 10px 30px ${ACCENTS[i]}55` : undefined }}
            >
              <HeritageImage
                media={s.heritage_media?.[0]}
                siteName={s.name}
                category={s.category}
                className="absolute inset-0"
                imageClassName={active ? '' : 'saturate-[.55] brightness-[.8]'}
                showAttribution={false}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                <span className="font-serif text-sm font-bold text-white sm:text-base">{s.name}</span>
              </div>
              <div className="absolute inset-0 transition-opacity" style={{ background: ACCENTS[i], opacity: active ? 0.28 : 0 }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SimonHeritage;
