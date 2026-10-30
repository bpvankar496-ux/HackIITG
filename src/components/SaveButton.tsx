import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { readSaved, toggleSaved, SAVED_EVENT } from '../lib/savedSites';

interface SaveButtonProps {
  slug: string;
  siteId: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ slug }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setSaved(readSaved().includes(slug));
    refresh();
    window.addEventListener(SAVED_EVENT, refresh);
    return () => window.removeEventListener(SAVED_EVENT, refresh);
  }, [slug]);

  const toggleSave = async () => {
    setSaved(await toggleSaved(slug, user?.id));
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
