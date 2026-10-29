import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, UploadCloud, Info } from 'lucide-react';

const CATEGORIES = [
  'Stepwells',
  'Forts',
  'Temples',
  'Architecture',
  'Folk Art',
  'Handicrafts',
  'Cultural Traditions'
];

interface ContributeViewProps {
  onSuccessReturn: () => void;
}

export const ContributeView: React.FC<ContributeViewProps> = ({ onSuccessReturn }) => {
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    district: '',
    category: 'Architecture',
    period: '',
    description: '',
    story: '',
    source: '',
    contributorName: '',
    contributorEmail: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.state.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Store in local storage queue
      try {
        const stored = JSON.parse(localStorage.getItem('pending_contributions') || '[]');
        stored.push({
          ...formData,
          id: `contrib-${Date.now()}`,
          submittedAt: new Date().toISOString(),
          status: 'pending'
        });
        localStorage.setItem('pending_contributions', JSON.stringify(stored));
      } catch {
        // ignore
      }

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="border-b border-[#DCC9AD] pb-6">
        <h1 className="font-serif text-3xl font-bold text-[#292821]">
          Share a Heritage Story
        </h1>
        <p className="mt-2 text-sm text-[#777267]">
          Contribute an unrecorded monument, architectural relic, local folklore, or living craft to the
          Virasat Quest living archive. All submissions undergo curator review.
        </p>
      </div>

      {submittedSuccess ? (
        <div className="bg-white border border-[#DCC9AD] rounded-2xl p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-[#667653]/15 text-[#667653] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#292821]">
            Story Received for Review
          </h2>
          <p className="text-sm text-[#777267] max-w-md mx-auto">
            Thank you for helping revitalize India&apos;s heritage archives. Your submission has been entered into the
            curator review queue and will be reflected upon verification.
          </p>
          <div className="pt-2">
            <button
              onClick={onSuccessReturn}
              type="button"
              className="px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              Return to Archive
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-[#DCC9AD] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="p-3 bg-[#FAF7F0] border-l-4 border-[#B65F43] rounded-r-lg text-xs text-[#292821] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#B65F43] shrink-0 mt-0.5" />
            <span>
              Please cite local oral sources, gazetteers, or village elders where possible. Submissions
              are published under open heritage licenses (CC BY-SA 4.0).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contrib-name" className="block text-xs font-bold text-[#292821] mb-1">
                Monument / Place / Tradition Name *
              </label>
              <input
                id="contrib-name"
                required
                type="text"
                placeholder="e.g. Vav of Vasantgadh"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>

            <div>
              <label htmlFor="contrib-category" className="block text-xs font-bold text-[#292821] mb-1">
                Heritage Category *
              </label>
              <select
                id="contrib-category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="contrib-state" className="block text-xs font-bold text-[#292821] mb-1">
                State *
              </label>
              <input
                id="contrib-state"
                required
                type="text"
                placeholder="e.g. Gujarat"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>

            <div>
              <label htmlFor="contrib-district" className="block text-xs font-bold text-[#292821] mb-1">
                District / Region
              </label>
              <input
                id="contrib-district"
                type="text"
                placeholder="e.g. Sirohi"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>

            <div>
              <label htmlFor="contrib-period" className="block text-xs font-bold text-[#292821] mb-1">
                Approximate Period
              </label>
              <input
                id="contrib-period"
                type="text"
                placeholder="e.g. 12th century"
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contrib-desc" className="block text-xs font-bold text-[#292821] mb-1">
              Architectural & Physical Description *
            </label>
            <textarea
              id="contrib-desc"
              required
              rows={3}
              placeholder="Describe the physical condition, carvings, layout, and current status..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
            />
          </div>

          <div>
            <label htmlFor="contrib-story" className="block text-xs font-bold text-[#292821] mb-1">
              Oral Lore, Folklore, or Memory
            </label>
            <textarea
              id="contrib-story"
              rows={3}
              placeholder="Share stories passed down through families, rituals, or local legends..."
              value={formData.story}
              onChange={e => setFormData({ ...formData, story: e.target.value })}
              className="w-full p-3 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contrib-src" className="block text-xs font-bold text-[#292821] mb-1">
                Source Reference (Book / Elder / Village Record)
              </label>
              <input
                id="contrib-src"
                type="text"
                placeholder="e.g. Gram Panchayat Record / Local Historian"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>

            <div>
              <label htmlFor="contrib-contributor" className="block text-xs font-bold text-[#292821] mb-1">
                Your Name & Affiliation
              </label>
              <input
                id="contrib-contributor"
                type="text"
                placeholder="e.g. Vikram Sharma (Researcher)"
                value={formData.contributorName}
                onChange={e => setFormData({ ...formData, contributorName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Story…' : 'Submit for Review'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContributeView;
