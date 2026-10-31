import React, { useEffect, useRef, useState } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
];

function getCurrentLang(): string {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([a-zA-Z-]+)/);
  return match ? match[1] : 'en';
}

function applyLanguage(code: string) {
  const host = window.location.hostname;
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear any old choice first
  document.cookie = `googtrans=; ${expired}; path=/`;
  document.cookie = `googtrans=; ${expired}; path=/; domain=${host}`;
  if (code !== 'en') {
    document.cookie = `googtrans=/en/${code}; path=/`;
    if (host !== 'localhost') {
      document.cookie = `googtrans=/en/${code}; path=/; domain=${host}`;
    }
  }
  window.location.reload();
}

export const LanguageSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('en');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLang());
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const active = LANGS.find((l) => l.code === current) || LANGS[0];

  return (
    // notranslate: language names must always stay in their own script
    <div className="relative notranslate" translate="no" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-lg border border-[#DCC9AD] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#292821] transition-colors hover:bg-[#FAF7F0]"
      >
        <Languages className="h-3.5 w-3.5 text-[#B65F43]" />
        <span>{active.short}</span>
        <ChevronDown className="h-3 w-3 text-[#777267]" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-[#DCC9AD] bg-white p-1.5 text-sm shadow-lg">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setOpen(false);
                if (l.code !== current) applyLanguage(l.code);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[#292821] transition-colors hover:bg-[#FAF7F0]"
            >
              <span>{l.label}</span>
              {l.code === current && <Check className="h-3.5 w-3.5 text-[#B65F43]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;