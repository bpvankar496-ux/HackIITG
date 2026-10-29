import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Music2 } from 'lucide-react';
import { HeritageQuiz } from './games/HeritageQuiz';
import { SimonHeritage } from './games/SimonHeritage';

type GameTab = 'quiz' | 'simon';

const TABS: { id: GameTab; label: string; blurb: string; icon: React.ReactNode }[] = [
  { id: 'quiz', label: 'Heritage Quiz', blurb: 'Eight questions drawn from the archive. States, periods, UNESCO years and more.', icon: <Brain className="h-5 w-5" /> },
  { id: 'simon', label: 'Heritage Simon', blurb: 'Four monuments light up in order. Repeat the pattern as it grows.', icon: <Music2 className="h-5 w-5" /> },
];

export const GamesView: React.FC = () => {
  const [tab, setTab] = useState<GameTab>('quiz');
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl space-y-2">
        <h1 className="font-serif text-4xl font-bold text-[#292821] sm:text-5xl">Heritage Games</h1>
        <p className="text-sm leading-relaxed text-[#777267]">
          Learn the monuments by playing with them. Every question and card comes from the records in this archive.
        </p>
      </header>

      <div role="tablist" aria-label="Choose a game" className="mb-8 grid gap-3 sm:grid-cols-2">
        {TABS.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={on} type="button" onClick={() => setTab(t.id)}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-colors ${on ? 'border-[#B65F43] bg-white' : 'border-[#DCC9AD] bg-[#FAF7F0] hover:bg-white'}`}>
              {on && <motion.span layoutId="game-tab" className="absolute inset-y-0 left-0 w-1.5 bg-[#B65F43]" />}
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${on ? 'bg-[#B65F43] text-white' : 'bg-[#B65F43]/10 text-[#B65F43]'}`}>{t.icon}</span>
                <div>
                  <p className="font-serif text-lg font-bold text-[#292821]">{t.label}</p>
                  <p className="text-xs text-[#777267]">{t.blurb}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">{tab === 'quiz' ? <HeritageQuiz /> : <SimonHeritage />}</div>
    </section>
  );
};

export default GamesView;
