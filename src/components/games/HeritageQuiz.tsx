import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { HeritageSiteItem } from '../../data/seedHeritageSites';
import { shuffle, siteImage, useSites } from './useHeritagePool';

interface Question {
  id: string;
  prompt: string;
  site: HeritageSiteItem;
  options: string[];
  answer: string;
  explain: string;
}

const QUESTION_COUNT = 8;
const BEST_KEY = 'virasat_quiz_best';

function pickOptions(correct: string, pool: string[]): string[] {
  const others = shuffle(Array.from(new Set(pool.filter(p => p && p !== correct)))).slice(0, 3);
  return shuffle([correct, ...others]);
}

function buildQuestions(sites: HeritageSiteItem[]): Question[] {
  const states = sites.map(s => s.state);
  const categories = sites.map(s => s.category as string);
  const names = sites.map(s => s.name);
  const qs: Question[] = [];

  for (const s of shuffle(sites)) {
    const kinds: Question[] = [];
    if (s.state) {
      kinds.push({
        id: `${s.id}-state`, site: s,
        prompt: `Which state is ${s.name} in?`,
        options: pickOptions(s.state, states), answer: s.state,
        explain: `${s.name} is in ${s.locality ? s.locality + ', ' : ''}${s.district ? s.district + ', ' : ''}${s.state}.`,
      });
    }
    kinds.push({
      id: `${s.id}-cat`, site: s,
      prompt: `What kind of heritage site is ${s.name}?`,
      options: pickOptions(s.category, categories), answer: s.category,
      explain: `${s.name} is listed under ${s.category}.`,
    });
    if (s.unescoStatus === 'World Heritage Site' && s.designationYear) {
      const y = String(s.designationYear);
      const years = sites.map(x => (x.designationYear ? String(x.designationYear) : ''));
      kinds.push({
        id: `${s.id}-year`, site: s,
        prompt: `In which year did ${s.name} join the UNESCO World Heritage List?`,
        options: pickOptions(y, years), answer: y,
        explain: `${s.name} was inscribed in ${y}.`,
      });
    }
    if (s.description) {
      kinds.push({
        id: `${s.id}-who`, site: s,
        prompt: `Which monument is this? “${s.description.split(/(?<=[.!?])\s/)[0].replace(new RegExp(s.name, 'gi'), '____').slice(0, 220)}”`,
        options: pickOptions(s.name, names), answer: s.name,
        explain: `That description belongs to ${s.name}.`,
      });
    }
    const valid = kinds.filter(k => k.options.length >= 3);
    if (valid.length) qs.push(shuffle(valid)[0]);
    if (qs.length >= QUESTION_COUNT) break;
  }
  return qs;
}

export const HeritageQuiz: React.FC = () => {
  const sites = useSites();
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildQuestions(sites), [sites, round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState<number>(() => {
    try { return Number(localStorage.getItem(BEST_KEY) || 0); } catch { return 0; }
  });

  const done = index >= questions.length;
  const q = questions[index];

  const choose = (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    if (opt === q.answer) { setScore(s => s + 1); setStreak(s => s + 1); } else setStreak(0);
  };

  const next = () => {
    const last = index + 1 >= questions.length;
    if (last) {
      const final = score;
      if (final > best) {
        setBest(final);
        try { localStorage.setItem(BEST_KEY, String(final)); } catch { /* ignore */ }
      }
    }
    setPicked(null);
    setIndex(i => i + 1);
  };

  const restart = () => { setRound(r => r + 1); setIndex(0); setPicked(null); setScore(0); setStreak(0); };

  if (!questions.length) return <p className="text-sm text-[#777267]">Not enough heritage records to build a quiz yet.</p>;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const title = pct === 100 ? 'Flawless' : pct >= 70 ? 'Well travelled' : pct >= 40 ? 'Getting there' : 'Fresh explorer';
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-xl rounded-3xl border border-[#DCC9AD] bg-white p-8 text-center shadow-md">
        <motion.div initial={{ rotate: -12, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 10 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B65F43] text-white">
          <Trophy className="h-8 w-8" />
        </motion.div>
        <h3 className="font-serif text-3xl font-bold text-[#292821]">{title}</h3>
        <p className="mt-2 text-sm text-[#777267]">You answered {score} of {questions.length} correctly ({pct}%).</p>
        <p className="mt-1 text-xs text-[#777267]">Best score on this device: {Math.max(best, score)} of {questions.length}</p>
        <button type="button" onClick={restart}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B65F43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#9A4B32]">
          <RotateCcw className="h-4 w-4" /> Play again
        </button>
      </motion.div>
    );
  }

  const img = siteImage(q.site);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#777267]">
        <span>Question {index + 1} of {questions.length}</span>
        <span className="flex items-center gap-3">
          {streak >= 2 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{streak} in a row</span>}
          <span>Score {score}</span>
        </span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#EADFCB]" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index}>
        <motion.div className="h-full bg-[#B65F43]" animate={{ width: `${(index / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-[#DCC9AD] bg-white shadow-md">
          {img && !q.id.endsWith('-who') && (
            <div className="relative h-48 overflow-hidden bg-[#EADFCB] sm:h-60">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}
          <div className="space-y-4 p-6">
            <h3 className="font-serif text-xl font-bold leading-snug text-[#292821] sm:text-2xl">{q.prompt}</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {q.options.map(opt => {
                const isAnswer = opt === q.answer;
                const isPicked = picked === opt;
                const state = !picked ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'dim';
                const cls = {
                  idle: 'border-[#DCC9AD] bg-[#FAF7F0] hover:border-[#B65F43] hover:bg-white',
                  right: 'border-[#667653] bg-[#667653]/15 text-[#3d4a2f]',
                  wrong: 'border-red-400 bg-red-50 text-red-800',
                  dim: 'border-[#E8DCC5] bg-[#FAF7F0] opacity-50',
                }[state];
                return (
                  <motion.button key={opt} type="button" disabled={!!picked} onClick={() => choose(opt)}
                    whileTap={{ scale: 0.97 }} animate={state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${cls}`}>
                    <span>{opt}</span>
                    {state === 'right' && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#667653]" />}
                    {state === 'wrong' && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
                  </motion.button>
                );
              })}
            </div>

            {picked && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCC9AD]/50 pt-4">
                <p className="text-sm text-[#292821]" aria-live="polite">
                  <strong>{picked === q.answer ? 'Correct. ' : 'Not quite. '}</strong>{q.explain}
                </p>
                <button type="button" onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#292821] px-4 py-2 text-xs font-semibold text-white hover:bg-black">
                  {index + 1 >= questions.length ? 'See result' : 'Next question'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeritageQuiz;
