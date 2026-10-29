import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface SaveButtonProps {
  slug: string;
  siteId: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ slug }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('saved_heritage_sites') || '[]');
      setSaved(stored.includes(slug));
    } catch {
      // ignore
    }
  }, [slug]);

  const toggleSave = () => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('saved_heritage_sites') || '[]');
      let updated: string[];
      if (stored.includes(slug)) {
        updated = stored.filter(s => s !== slug);
        setSaved(false);
      } else {
        updated = [...stored, slug];
        setSaved(true);
      }
      localStorage.setItem('saved_heritage_sites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={toggleSave}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
        saved
          ? 'bg-[#667653] text-white border-[#667653]'
          : 'bg-white text-[#292821] border-[#DCC9AD] hover:border-[#B65F43]'
      }`}
      aria-label={saved ? 'Remove from My Collection' : 'Save to My Collection'}
    >
      {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
      <span>{saved ? 'Saved in Collection' : 'Save Place'}</span>
    </button>
  );
};

export default SaveButton;
