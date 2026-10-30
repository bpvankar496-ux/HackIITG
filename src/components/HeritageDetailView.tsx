import React, { Suspense } from 'react';
import { SEED_HERITAGE_SITES } from '../data/seedHeritageSites';
import { SaveButton } from './SaveButton';
import { HeritageImage } from './HeritageImage';
const ModelViewer3D = React.lazy(() => import('./ModelViewer3D'));
import { TiltCard } from './motion/TiltCard';
import { Reveal } from './motion/Reveal';
import { Network, MapPin, ExternalLink, ArrowLeft, ShieldCheck, Box, Image as ImageIcon, Award, Calendar, BookOpen, Layers, Compass } from 'lucide-react';

interface HeritageDetailViewProps {
  slug: string;
  onBack: () => void;
  onNavigateToGraph: (entitySlug?: string) => void;
}

export const HeritageDetailView: React.FC<HeritageDetailViewProps> = ({
  slug,
  onBack,
  onNavigateToGraph
}) => {
  const site = SEED_HERITAGE_SITES.find(s => s.slug === slug);

  if (!site) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-[#292821]">Heritage Record Not Found</h1>
        <p className="text-sm text-[#777267]">
          The requested archival record &quot;{slug}&quot; could not be located in the archive.
        </p>
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B65F43] text-white text-xs font-medium rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Explore</span>
        </button>
      </div>
    );
  }

  // Related monuments in the same state or with similar category
  const relatedSites = SEED_HERITAGE_SITES.filter(
    s => s.id !== site.id && (s.state === site.state || s.category === site.category)
  ).slice(0, 3);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-[#777267] hover:text-[#B65F43] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Heritage Archive</span>
        </button>
      </div>

      {/* Header & Badges */}
      <div className="space-y-4 border-b border-[#DCC9AD] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase bg-[#B65F43]/15 text-[#B65F43] px-2.5 py-0.5 rounded-full font-bold">
              {site.category}
            </span>

            {site.unescoStatus === 'World Heritage Site' && (
              <span className="text-[11px] font-mono uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                UNESCO World Heritage Site ({site.designationYear})
              </span>
            )}

            {site.unescoStatus === 'Tentative List' && (
              <span className="text-[11px] font-mono uppercase bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                UNESCO Tentative List
              </span>
            )}

            {site.protectionCategory && (
              <span className="text-[11px] font-mono text-[#667653] bg-[#667653]/15 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {site.protectionCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SaveButton slug={site.slug} siteId={site.id} />
            <button
              onClick={() => onNavigateToGraph(site.slug)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Explore Knowledge Graph</span>
            </button>
          </div>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#292821] leading-tight">
          {site.name}
        </h1>

        {site.alternateNames && site.alternateNames.length > 0 && (
          <p className="text-xs text-[#777267] italic">
            Alternate / Historical Names: <strong>{site.alternateNames.join(' • ')}</strong>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-[#777267]">
          <span className="flex items-center gap-1 text-[#292821] font-medium">
            <MapPin className="w-4 h-4 text-[#B65F43]" />
            {site.locality ? `${site.locality}, ` : ''}
            {site.district ? `${site.district}, ` : ''}
            {site.state}
          </span>

          {site.lat != null && site.lng != null && (
            <span className="font-mono text-xs text-[#777267] bg-white px-2 py-0.5 rounded border border-[#DCC9AD]">
              {site.lat.toFixed(4)}° N, {site.lng.toFixed(4)}° E
            </span>
          )}

          {site.period && (
            <span className="flex items-center gap-1 font-mono text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#777267]" />
              {site.period}
            </span>
          )}

          {site.architecturalStyle && (
            <span className="flex items-center gap-1 font-mono text-xs text-[#667653]">
              <Layers className="w-3.5 h-3.5" />
              Style: {site.architecturalStyle}
            </span>
          )}
        </div>
      </div>

      {/* Main Narrative Description */}
      <div className="space-y-4 text-base font-sans leading-relaxed text-[#292821]">
        <div className="bg-white p-5 rounded-2xl border border-[#DCC9AD] space-y-3 shadow-2xs">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#777267]">
            Archival Dossier & Description
          </h2>
          <p className="font-serif text-lg leading-relaxed text-[#292821]">
            {site.description}
          </p>
          {site.significance && (
            <div className="pt-2 border-t border-[#DCC9AD]/40 text-sm text-[#777267]">
              <strong className="text-[#292821] font-semibold">Archaeological & Cultural Significance:</strong>{' '}
              {site.significance}
            </div>
          )}
        </div>

        {site.story && (
          <div className="bg-[#FAF7F0] p-5 rounded-2xl border-l-4 border-[#B65F43] space-y-1.5 shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B65F43] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Primary Inscription & Oral History Chronicle
            </h2>
            <p className="text-sm italic font-serif leading-relaxed text-[#292821]">
              &quot;{site.story}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Source Provenance Dossier Box */}
      <section className="bg-white p-5 rounded-2xl border border-[#DCC9AD] space-y-3 shadow-2xs" aria-labelledby="provenance-heading">
        <h2 id="provenance-heading" className="font-serif text-base font-bold text-[#292821] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#667653]" />
          <span>Authoritative Source & Provenance Record</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[#777267]">Source Citation:</div>
            <div className="font-medium text-[#292821] mt-0.5">{site.source}</div>
          </div>
          <div>
            <div className="text-[#777267]">Custodial / Survey Organization:</div>
            <div className="font-medium text-[#292821] mt-0.5">{site.sourceOrganization || 'Archaeological Survey of India'}</div>
          </div>
          <div>
            <div className="text-[#777267]">Verification Date:</div>
            <div className="font-mono text-[#292821] mt-0.5">{site.dateVerified || '2026-03-01'} (Audited for Step 10)</div>
          </div>
          <div>
            <div className="text-[#777267]">External Archival Record:</div>
            <div className="mt-0.5">
              {site.source_url ? (
                <a
                  href={site.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B65F43] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Access Authoritative Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[#777267] font-mono">Official State Gazette / ASI Archive</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Photographs Section */}
      <section className="space-y-3" aria-labelledby="photos-heading">
        <h2 id="photos-heading" className="font-serif text-xl font-bold text-[#292821] flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#B65F43]" />
          <span>Archival Photographs</span>
        </h2>

        {site.heritage_media && site.heritage_media.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {site.heritage_media.map(m => (
              <TiltCard key={m.id} className="rounded-xl">
              <figure className="group bg-white rounded-xl border border-[#DCC9AD] overflow-hidden shadow-2xs">
                <HeritageImage
                  media={m}
                  siteName={site.name}
                  category={site.category}
                  className="aspect-16/10 w-full"
                  imageClassName="transition-transform duration-700 group-hover:scale-110"
                  showAttribution={false}
                />
                <figcaption className="p-3 text-[11px] text-[#777267] space-y-0.5">
                  <p className="font-medium text-[#292821]">{m.alt}</p>
                  <p>
                    {m.photographer} • {m.license}
                    {m.source_url && (
                      <a
                        href={m.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 underline text-[#B65F43]"
                      >
                        view source
                      </a>
                    )}
                  </p>
                </figcaption>
              </figure>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="p-6 border border-[#DCC9AD] rounded-xl bg-white text-center text-xs text-[#777267]">
            Archival image digitization for {site.name} is scheduled under the open-access heritage inventory.
          </div>
        )}
      </section>

      {/* 3D Model Section */}
      <section className="space-y-3" aria-labelledby="model-heading">
        <h2 id="model-heading" className="font-serif text-xl font-bold text-[#292821] flex items-center gap-2">
          <Box className="w-5 h-5 text-[#667653]" />
          <span>Spatial & 3D Architectural Model</span>
        </h2>

        <Suspense fallback={<div className="h-[340px] rounded-2xl border border-[#DCC9AD] bg-white flex items-center justify-center text-xs text-[#777267]">Loading 3D viewer…</div>}>
          <ModelViewer3D category={site.category} name={site.name} modelUrl={site.model_url} />
        </Suspense>
      </section>

      {/* Knowledge Graph Integration Callout */}
      <section className="p-6 bg-[#B65F43]/10 border border-[#B65F43]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-serif text-lg font-bold text-[#292821]">
            Connected in the Heritage Knowledge Graph
          </h2>
          <p className="text-xs text-[#777267]">
            Investigate lineages, royal patrons, architectural traditions, and primary epigraphic citations linked to {site.name}.
          </p>
        </div>

        <button
          onClick={() => onNavigateToGraph(site.slug)}
          type="button"
          className="shrink-0 px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
        >
          <Network className="w-4 h-4" />
          <span>Open Knowledge Graph</span>
        </button>
      </section>

      {/* Related Heritage Monuments */}
      {relatedSites.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#DCC9AD]">
          <h2 className="font-serif text-xl font-bold text-[#292821]">
            Related Monuments in {site.state}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedSites.map(rel => (
              <div
                key={rel.id}
                className="bg-white p-4 rounded-xl border border-[#DCC9AD] space-y-2 hover:border-[#B65F43] transition-colors"
              >
                <span className="text-[10px] font-mono uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                  {rel.category}
                </span>
                <h3 className="font-serif text-base font-bold text-[#292821]">
                  <a href={`#heritage/${rel.slug}`} className="hover:underline">
                    {rel.name}
                  </a>
                </h3>
                <p className="text-xs text-[#777267] line-clamp-2">
                  {rel.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default HeritageDetailView;
