import React, { useState } from 'react';
import { SEED_HERITAGE_SITES } from '../data/seedHeritageSites';
import { Users, Filter, ExternalLink, Heart, MessageSquare } from 'lucide-react';

interface CommunityViewProps {
  onNavigateToSite: (slug: string) => void;
  onNavigateToContribute: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  onNavigateToSite,
  onNavigateToContribute
}) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sample community entries
  const communityEntries = [
    {
      id: 'comm-1',
      slug: 'adalaj-stepwell',
      name: 'Adalaj ni Vav Living Memories',
      contributor: 'Meera Patel (Patan University Student)',
      date: '2024-02-10',
      category: 'Stepwells',
      state: 'Gujarat',
      excerpt:
        'My grandmother used to tell us how her family visited the Adalaj Vav during the summer pilgrimage. The subterranean temperature drops by nearly 5 degrees as you descend to the third level.',
      upvotes: 42
    },
    {
      id: 'comm-2',
      slug: 'patan-patola',
      name: 'Eight Centuries of Salvi Silk Weaving',
      contributor: 'Rajesh Salvi (Master Artisan, Patan)',
      date: '2024-01-28',
      category: 'Handicrafts',
      state: 'Gujarat',
      excerpt:
        'Double-ikat Patola requires both warp and weft to be resist-dyed before weaving. A single saree takes six months, retaining vivid natural vegetable dyes for centuries without fading.',
      upvotes: 89
    },
    {
      id: 'comm-3',
      slug: 'modhera-sun-temple',
      name: 'The Solanki Solar Alignment at Modhera',
      contributor: 'Dr. Anita Joshi (Heritage Researcher)',
      date: '2024-01-14',
      category: 'Temples',
      state: 'Gujarat',
      excerpt:
        'During the vernal equinox, the precise geometry of the Sabha Mandapa pillars frames the sun disk at dawn, bathing the Surya Kunda waters in golden morning reflection.',
      upvotes: 67
    }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="border-b border-[#DCC9AD] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#667653] font-bold">
            <Users className="w-4 h-4" />
            <span>Crowdsourced Archival Stories</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821] mt-1">
            Community Archive
          </h1>
          <p className="mt-2 text-sm text-[#777267] max-w-2xl leading-relaxed">
            Places, oral histories, and living traditions shared by local residents, travelers, students,
            and researchers. Each contribution is reviewed before publication.
          </p>
        </div>

        <button
          onClick={onNavigateToContribute}
          type="button"
          className="px-4 py-2 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          Share a Heritage Story
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {communityEntries.map(entry => (
          <article
            key={entry.id}
            className="bg-white border border-[#DCC9AD] rounded-xl p-5 flex flex-col justify-between space-y-3 hover:border-[#B65F43] transition-all shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase bg-[#667653]/15 text-[#667653] px-2 py-0.5 rounded font-medium">
                  {entry.category}
                </span>
                <span className="text-[11px] text-[#777267]">{entry.date}</span>
              </div>

              <h2 className="font-serif text-lg font-bold text-[#292821] leading-tight">
                <button
                  onClick={() => onNavigateToSite(entry.slug)}
                  type="button"
                  className="hover:text-[#B65F43] text-left underline"
                >
                  {entry.name}
                </button>
              </h2>

              <p className="text-[11px] font-mono text-[#777267]">
                By {entry.contributor}
              </p>

              <blockquote className="text-xs text-[#292821] italic font-serif leading-relaxed border-l-2 border-[#DCC9AD] pl-2.5 py-0.5 bg-[#F8F5EF]/50">
                &quot;{entry.excerpt}&quot;
              </blockquote>
            </div>

            <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#B65F43]">
                <Heart className="w-3.5 h-3.5 fill-[#B65F43]" />
                <span className="font-mono text-xs">{entry.upvotes}</span>
              </span>

              <button
                onClick={() => onNavigateToSite(entry.slug)}
                type="button"
                className="text-xs text-[#B65F43] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>View Full Record</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CommunityView;
