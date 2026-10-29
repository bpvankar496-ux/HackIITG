import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronRight, HelpCircle, MapPin, Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface QuestStep {
  position: number;
  siteName: string;
  slug: string;
  storyIntro: string;
  clue: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

const QUEST_STEPS: QuestStep[] = [
  {
    position: 1,
    siteName: 'Rani ki Vav',
    slug: 'rani-ki-vav',
    storyIntro: 'Fiction: A faded archival map leads you to a stairway that descends deep underground.',
    clue: 'Fact: Rani ki Vav is an 11th-century stepwell, inscribed as a UNESCO World Heritage Site in 2014.',
    question: 'In which town is Rani ki Vav located?',
    options: ['Patan', 'Surat', 'Bhuj', 'Junagadh'],
    correctIndex: 0,
    explanation: 'Rani ki Vav stands in Patan, in northern Gujarat, on the banks of the Saraswati river.',
    points: 20
  },
  {
    position: 2,
    siteName: 'Adalaj Stepwell',
    slug: 'adalaj-stepwell',
    storyIntro: 'Fiction: The next page of the traveller diary smells of wet stone and old rain.',
    clue: 'Fact: Adalaj Stepwell is a 15th-century stepwell built in 1498 CE.',
    question: 'Which major city is Adalaj Stepwell nearest to?',
    options: ['Rajkot', 'Ahmedabad', 'Vadodara', 'Surat'],
    correctIndex: 1,
    explanation: 'Adalaj lies in Gandhinagar district, just north of Ahmedabad.',
    points: 20
  },
  {
    position: 3,
    siteName: 'Modhera Sun Temple',
    slug: 'modhera-sun-temple',
    storyIntro: 'Fiction: A mysterious architectural note says the dawn equinox light is the real key.',
    clue: 'Fact: Modhera Sun Temple was built in the early 11th century under the Chaulukya (Solanki) dynasty.',
    question: 'To which solar deity is the Modhera temple dedicated?',
    options: ['Hanuman', 'Ganesha', 'Surya', 'Vishnu'],
    correctIndex: 2,
    explanation: 'Modhera is dedicated to Surya, the Vedic Sun god.',
    points: 20
  },
  {
    position: 4,
    siteName: 'Champaner-Pavagadh Archaeological Park',
    slug: 'champaner-pavagadh',
    storyIntro: 'Fiction: An ancient trail climbs through ruined city gates toward a sacred hill.',
    clue: 'Fact: Champaner-Pavagadh Archaeological Park is a UNESCO World Heritage Site.',
    question: 'In which year was Champaner-Pavagadh inscribed by UNESCO?',
    options: ['1994', '2004', '2014', '2021'],
    correctIndex: 1,
    explanation: 'It was inscribed at the 28th session in Suzhou, China in 2004.',
    points: 20
  },
  {
    position: 5,
    siteName: 'Dholavira',
    slug: 'dholavira',
    storyIntro: 'Fiction: The final secret is buried in a stone metropolis older than any written scroll.',
    clue: 'Fact: Dholavira, in Kutch, is a planned city inscribed by UNESCO in 2021.',
    question: 'Which ancient Bronze Age civilisation constructed Dholavira?',
    options: ['Maurya', 'Gupta', 'Indus Valley (Harappan)', 'Mughal'],
    correctIndex: 2,
    explanation: 'Dholavira belongs to the Indus Valley (Harappan) civilization.',
    points: 20
  }
];

interface QuestsViewProps {
  onNavigateToSite: (slug: string) => void;
  onNavigateToGraph: (slug?: string) => void;
}

export const QuestsView: React.FC<QuestsViewProps> = ({ onNavigateToSite, onNavigateToGraph }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = QUEST_STEPS[currentStepIndex];
  const isFinished = completedSteps.length === QUEST_STEPS.length;

  const handleSelectOption = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || hasSubmitted) return;
    setHasSubmitted(true);
    if (selectedOption === step.correctIndex) {
      setTotalScore(prev => prev + step.points);
      if (!completedSteps.includes(step.position)) {
        setCompletedSteps(prev => [...prev, step.position]);
      }
    }
  };

  const handleNextStep = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    if (currentStepIndex < QUEST_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setTotalScore(0);
    setCompletedSteps([]);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#DCC9AD] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#B65F43] font-bold">
            <Trophy className="w-4 h-4" />
            <span>Interactive Archival Quest</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821] mt-1">
            The Lost Stories of Gujarat
          </h1>
          <p className="mt-2 text-sm text-[#777267] max-w-2xl">
            A fictional adventure where clues and answers are grounded in real archival records, epigraphic
            discoveries, and UNESCO dossiers.
          </p>
        </div>

        {/* Score Badge */}
        <div className="bg-white border border-[#DCC9AD] p-3 rounded-xl shadow-xs self-start sm:self-auto flex items-center gap-3">
          <Award className="w-6 h-6 text-[#C27803]" />
          <div>
            <span className="text-[10px] uppercase font-mono text-[#777267]">Quest Score</span>
            <p className="font-serif text-xl font-bold text-[#292821]">{totalScore} Points</p>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2">
        {QUEST_STEPS.map((s, idx) => {
          const isDone = completedSteps.includes(s.position);
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={s.position}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                setSelectedOption(null);
                setHasSubmitted(false);
              }}
              className={`flex-1 py-1.5 px-2 text-center rounded text-xs font-mono font-medium transition-all ${
                isCurrent
                  ? 'bg-[#B65F43] text-white shadow-xs'
                  : isDone
                  ? 'bg-[#667653] text-white'
                  : 'bg-white border border-[#DCC9AD] text-[#777267]'
              }`}
            >
              Stage {s.position}
            </button>
          );
        })}
      </div>

      {/* Main Quest Card */}
      {!isFinished ? (
        <div className="bg-white border border-[#DCC9AD] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-[#777267]">
            <span>
              Stage {step.position} of {QUEST_STEPS.length}
            </span>
            <span className="font-mono text-[#B65F43] font-bold">+{step.points} Points</span>
          </div>

          {/* Fiction Story Snippet */}
          <div className="p-4 bg-[#FAF7F0] border-l-4 border-[#B65F43] rounded-r-lg font-serif italic text-sm text-[#292821] leading-relaxed">
            {step.storyIntro}
          </div>

          {/* Historical Clue */}
          <div className="p-3.5 bg-[#F8F5EF] rounded-lg border border-[#DCC9AD] text-xs space-y-1">
            <span className="font-mono uppercase font-bold text-[#667653] flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Archival Evidence Clue
            </span>
            <p className="text-[#292821] font-sans leading-relaxed">{step.clue}</p>
          </div>

          {/* Question */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-[#292821] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#B65F43]" />
              <span>{step.question}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {step.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let optStyle = 'bg-white border-[#DCC9AD] hover:border-[#B65F43] text-[#292821]';

                if (hasSubmitted) {
                  if (idx === step.correctIndex) {
                    optStyle = 'bg-[#667653]/15 border-[#667653] text-[#667653] font-bold';
                  } else if (isSelected) {
                    optStyle = 'bg-red-50 border-red-400 text-red-700';
                  } else {
                    optStyle = 'opacity-50 border-gray-200';
                  }
                } else if (isSelected) {
                  optStyle = 'bg-[#B65F43]/10 border-[#B65F43] text-[#B65F43] font-bold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3 text-left rounded-xl border text-sm transition-all flex items-center justify-between ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {hasSubmitted && idx === step.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-[#667653]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation if submitted */}
          {hasSubmitted && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 animate-in fade-in duration-150 ${
                selectedOption === step.correctIndex
                  ? 'bg-[#667653]/10 border-[#667653]/30 text-[#292821]'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <p className="font-bold">
                {selectedOption === step.correctIndex ? '✓ Correct Fact!' : '✗ Not quite correct.'}
              </p>
              <p>{step.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCC9AD]/40">
            <button
              onClick={() => onNavigateToSite(step.slug)}
              type="button"
              className="text-xs text-[#B65F43] hover:underline font-medium"
            >
              Inspect {step.siteName} in Archive
            </button>

            {!hasSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                type="button"
                className="px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                type="button"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#667653] hover:bg-[#526042] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                <span>Continue Journey</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quest Finished Certificate */
        <div className="bg-white border border-[#DCC9AD] rounded-2xl p-8 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 rounded-full bg-[#C27803]/15 text-[#C27803] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#B65F43] font-bold">
              Quest Completed
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#292821] mt-1">
              Honorary Cultural Archivist
            </h2>
            <p className="text-sm text-[#777267] max-w-md mx-auto mt-2">
              You uncovered all clues across Rani ki Vav, Adalaj, Modhera, Champaner, and Dholavira with a final score of <strong>{totalScore} points</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onNavigateToGraph()}
              type="button"
              className="px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              Explore Connected Knowledge Graph (Step 8)
            </button>

            <button
              onClick={handleRestart}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#DCC9AD] text-[#292821] hover:bg-[#F8F5EF] text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestsView;
