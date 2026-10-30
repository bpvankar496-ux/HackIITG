/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TiltCard } from './motion/TiltCard';
import { Reveal } from './motion/Reveal';
import React, { useMemo } from 'react';
import {
  Compass,
  BookOpen,
  Sparkles,
  MapPin,
  Network,
  Upload,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NavSection } from './Header';
import { AUTHENTIC_HERITAGE_DATASET } from '../data/authenticHeritageDataset';
import { HeritageImage } from './HeritageImage';

interface LandingPageProps {
  onNavigate: (section: NavSection) => void;
  onNavigateToSite: (slug: string) => void;
  onNavigateToGraph: (slug?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onNavigateToSite,
  onNavigateToGraph,
}) => {
  // Curated showcase of verified heritage monuments from authentic dataset
  const curatedMonuments = useMemo(() => {
    const targetSlugs = [
      'rani-ki-vav',
      'modhera-sun-temple',
      'adalaj-stepwell',
      'dholavira',
      'taj-mahal',
      'ellora-caves',
    ];
    return targetSlugs
      .map((slug) => AUTHENTIC_HERITAGE_DATASET.find((s) => s.slug === slug))
      .filter(Boolean) as typeof AUTHENTIC_HERITAGE_DATASET;
  }, []);

  const totalSitesCount = AUTHENTIC_HERITAGE_DATASET.length;

  return (
    <div className="text-[#292821]">
      {/* ========================================================
          HERO SECTION
          ======================================================== */}
      <section className="relative overflow-hidden border-b border-[#DCC9AD] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Heading, Value Proposition & Actions */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCC9AD] bg-white px-3.5 py-1 text-xs font-semibold text-[#B65F43] shadow-2xs">
                <Compass className="h-3.5 w-3.5 text-[#B65F43]" />
                <span>Digital Heritage Preservation &amp; Research</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#292821] leading-[1.14]">
                Discover the Stories Hidden in Our Heritage.
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-[#777267] max-w-2xl font-sans">
                Virasat Quest transforms scattered colonial surveys, medieval Sanskrit epigraphs, Persian court charters, and unindexed field notes into an integrated, verified, and AI-grounded living knowledge archive.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="flex items-center gap-2 rounded-xl bg-[#B65F43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9A4B32] hover:shadow-md cursor-pointer"
                >
                  <Landmark className="h-4 w-4" />
                  <span>Explore Heritage Sites</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToSite('rani-ki-vav')}
                  className="flex items-center gap-2 rounded-xl border border-[#DCC9AD] bg-white px-4 py-3 text-sm font-semibold text-[#292821] transition-colors hover:bg-[#FAF7F0] shadow-2xs cursor-pointer"
                >
                  <Compass className="h-4 w-4 text-[#B65F43]" />
                  <span>Virtual Tour</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('explorer')}
                  className="flex items-center gap-2 rounded-xl border border-[#DCC9AD] bg-white px-4 py-3 text-sm font-semibold text-[#292821] transition-colors hover:bg-[#FAF7F0] shadow-2xs cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-[#B65F43]" />
                  <span>Archival Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('assistant')}
                  className="flex items-center gap-2 rounded-xl border border-[#667653]/40 bg-[#667653]/10 px-4 py-3 text-sm font-semibold text-[#667653] transition-colors hover:bg-[#667653]/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Research</span>
                </button>
              </div>

              {/* Provenance Guarantee Indicators */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-[#DCC9AD]/60 text-xs text-[#777267]">
                <span className="flex items-center gap-1.5 font-medium text-[#667653]">
                  <ShieldCheck className="h-4 w-4 text-[#667653]" />
                  ASI &amp; UNESCO Verified Provenance
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#B65F43]">
                  <Network className="h-4 w-4 text-[#B65F43]" />
                  Interconnected Knowledge Graph
                </span>
                <span className="font-mono text-[11px] text-[#777267]">
                  Open Cultural Access
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset (Rani ki Vav Dossier Spotlight) */}
            <div className="lg:col-span-5">
              <TiltCard className="relative mx-auto max-w-md lg:max-w-none rounded-2xl" intensity={6}>
              <div className="relative rounded-2xl border border-[#DCC9AD] bg-white p-3.5 shadow-xl">
                <figure className="relative overflow-hidden rounded-xl bg-[#FAF7F0]">
                  <HeritageImage
                    media={AUTHENTIC_HERITAGE_DATASET.find((site) => site.slug === 'rani-ki-vav')?.heritage_media?.[0]}
                    siteName="Rani ki Vav"
                    category="Stepwell"
                    loading="eager"
                    className="aspect-16/11 w-full"
                    imageClassName="transition-transform duration-500 hover:scale-102"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-[#16192E]/85 px-3 py-1 text-[11px] font-mono font-medium text-white backdrop-blur-xs flex items-center gap-1.5">
                    <Award className="h-3 w-3 text-amber-400" />
                    <span>UNESCO World Heritage Site</span>
                  </div>
                </figure>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#777267]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#B65F43] bg-[#B65F43]/10 px-2 py-0.5 rounded">
                      Stepwells &bull; Māru-Gurjara Style
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="h-3 w-3 text-[#B65F43]" />
                      Patan, Gujarat
                    </span>
                  </div>

                  <h2 className="font-serif text-xl font-bold text-[#292821]">
                    Rani ki Vav (The Queen&apos;s Stepwell)
                  </h2>

                  <p className="text-xs text-[#777267] leading-relaxed line-clamp-2">
                    Commissioned in the late 11th century CE by Queen Udayamati in memory of King Bhimdev I. Built as an inverted subterranean temple featuring seven descending terraces and 500+ principal sculptures.
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-[#DCC9AD]/40 text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigateToSite('rani-ki-vav')}
                      className="font-bold text-[#B65F43] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Monument Dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToGraph('rani-ki-vav')}
                      className="text-xs text-[#667653] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>View in Graph</span>
                      <Network className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CORE CAPABILITIES OVERVIEW
          ======================================================== */}
      <section className="py-16 border-b border-[#DCC9AD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B65F43]">
              Platform Architecture
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#292821]">
              Engineered for Scholarly Heritage Discovery
            </h2>
            <p className="text-xs sm:text-sm text-[#777267]">
              An integrated suite of digital tools designed for historians, students, and preservationists.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Capability 1: Explore Monuments */}
            <div
              onClick={() => onNavigate('explore')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
                  <Landmark className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  Explore Heritage Sites
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Browse verified monuments across 13 Indian states with filters for architectural style, period, and UNESCO World Heritage status.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#B65F43]">
                <span>Browse {totalSitesCount} Monuments</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Capability 2: Knowledge Graph */}
            <div
              onClick={() => onNavigate('graph')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
                  <Network className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  Heritage Knowledge Graph
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Interactive force simulation linking monuments, royal patrons, architectural schools, and primary inscriptional evidence.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#B65F43]">
                <span>Explore Network</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Capability 3: Archival Vault & Deep Search */}
            <div
              onClick={() => onNavigate('explorer')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  Archival Vault &amp; Search
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Search through transcribed historical monographs, colonial survey folios, and Sanskrit epigraphs with exact passage highlighting.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#B65F43]">
                <span>Search Document Folios</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Capability 4: Grounded AI Assistant */}
            <div
              onClick={() => onNavigate('assistant')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#667653]/15 text-[#667653] flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  AI Research Assistant
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Interrogate archival sources with an AI assistant that cites verified documents, page numbers, and refuses to fabricate historical claims.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#667653]">
                <span>Ask an Inquiry</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Capability 5: Geospatial Heritage Map */}
            <div
              onClick={() => onNavigate('map')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  Geospatial Heritage Map
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Interactive cartography mapping verified coordinates, clustered regions, and geolocated survey plates on OpenStreetMap tiles.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#B65F43]">
                <span>Open Heritage Map</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Capability 6: Document Ingestion & OCR */}
            <div
              onClick={() => onNavigate('upload')}
              className="group cursor-pointer rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-6 space-y-3 hover:border-[#B65F43] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#16192E] text-[#C9A45C] flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                  Document Intake &amp; OCR
                </h3>
                <p className="text-xs text-[#777267] leading-relaxed">
                  Deposit historical PDFs and high-resolution manuscript scans. Dual-path extraction transcribes selectable text and visual inscriptions.
                </p>
              </div>
              <div className="pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs font-semibold text-[#16192E]">
                <span>Deposit Document</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CURATED SHOWCASE OF REAL HERITAGE MONUMENTS
          ======================================================== */}
      <section className="py-16 border-b border-[#DCC9AD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCC9AD] pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B65F43]">
                Curated Records
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#292821] mt-1">
                Featured Heritage Monuments
              </h2>
              <p className="text-xs sm:text-sm text-[#777267] mt-1">
                A selection of verified architectural landmarks from the Virasat Quest corpus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B65F43] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>View All {totalSitesCount} Records</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {curatedMonuments.map((site) => (
              <TiltCard key={site.id} className="rounded-2xl" intensity={5}>
              <article
                className="group h-full bg-white rounded-2xl border border-[#DCC9AD] overflow-hidden flex flex-col justify-between shadow-2xs hover:border-[#B65F43] hover:shadow-lg transition-all"
              >
                <div>
                  {site.heritage_media && site.heritage_media[0] ? (
                    <div className="relative aspect-16/10 bg-[#FAF7F0]">
                      <HeritageImage
                        media={site.heritage_media[0]}
                        siteName={site.name}
                        category={site.category}
                        className="h-full w-full"
                        imageClassName="transition-transform duration-700 group-hover:scale-110"
                      />
                      {site.unescoStatus === 'World Heritage Site' && (
                        <div className="absolute top-2.5 left-2.5 rounded bg-amber-900/85 px-2 py-0.5 text-[9.5px] font-mono font-bold text-amber-200 backdrop-blur-xs flex items-center gap-1">
                          <Award className="h-2.5 w-2.5 text-amber-400" />
                          <span>UNESCO WHS</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-16/10 bg-[#FAF7F0] flex items-center justify-center text-xs text-[#777267]">
                      Archival Record
                    </div>
                  )}

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#777267]">
                      <span className="font-mono text-[10px] uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                        {site.category}
                      </span>
                      <span>{site.period || 'Historical Era'}</span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors leading-snug">
                      <button
                        type="button"
                        onClick={() => onNavigateToSite(site.slug)}
                        className="text-left hover:underline cursor-pointer"
                      >
                        {site.name}
                      </button>
                    </h3>

                    <p className="text-xs text-[#777267] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#B65F43] shrink-0" />
                      <span className="truncate">
                        {site.district ? `${site.district}, ` : ''}
                        {site.state}
                      </span>
                    </p>

                    <p className="text-xs text-[#292821] line-clamp-2 leading-relaxed pt-1">
                      {site.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-[#DCC9AD]/30 mt-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToSite(site.slug)}
                    className="flex-1 py-1.5 bg-[#FAF7F0] hover:bg-[#B65F43] hover:text-white text-[#292821] text-xs font-semibold rounded-lg transition-colors border border-[#DCC9AD] text-center cursor-pointer"
                  >
                    View Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToGraph(site.slug)}
                    className="p-1.5 text-[#777267] hover:text-[#B65F43] rounded-lg border border-[#DCC9AD] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                    title={`View ${site.name} in Knowledge Graph`}
                    aria-label={`View ${site.name} in Knowledge Graph`}
                  >
                    <Network className="h-4 w-4" />
                  </button>
                </div>
              </article>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          KNOWLEDGE GRAPH SPOTLIGHT
          ======================================================== */}
      <section className="py-16 border-b border-[#DCC9AD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#DCC9AD] bg-[#FAF7F0] p-8 lg:p-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-[#B65F43]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B65F43]">
                    Relational Archival Matrix
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#292821]">
                  Interconnected Heritage Knowledge Graph
                </h2>
                <p className="text-sm leading-relaxed text-[#777267]">
                  Every architectural monument exists within an ecosystem of royal patrons, dynastic periods, regional traditions, and physical charters. Explore lineages and verified epigraphical records in an interactive visual canvas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('graph')}
                className="shrink-0 px-6 py-3 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <Network className="h-4 w-4" />
                <span>Launch Interactive Graph Canvas</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs pt-2">
              <div className="p-3.5 bg-white rounded-xl border border-[#DCC9AD] space-y-1">
                <span className="text-[10px] font-mono text-[#B65F43] font-bold uppercase">
                  commissioned_by
                </span>
                <p className="font-serif font-bold text-[#292821]">
                  Rani ki Vav &rarr; Queen Udayamati
                </p>
                <p className="text-[11px] text-[#777267]">
                  Documented in Merutunga&apos;s Prabandha-Chintamani (1304 CE).
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#DCC9AD] space-y-1">
                <span className="text-[10px] font-mono text-[#B65F43] font-bold uppercase">
                  built_by
                </span>
                <p className="font-serif font-bold text-[#292821]">
                  Modhera Sun Temple &rarr; King Bhima I
                </p>
                <p className="text-[11px] text-[#777267]">
                  Epigraphical date VS 1083 (1026 CE) on sanctum wall block.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#DCC9AD] space-y-1">
                <span className="text-[10px] font-mono text-[#B65F43] font-bold uppercase">
                  patronized_by
                </span>
                <p className="font-serif font-bold text-[#292821]">
                  Adalaj Stepwell &rarr; Mahmud Begada
                </p>
                <p className="text-[11px] text-[#777267]">
                  In situ Sanskrit and bilingual marble inscription of 1498 CE.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
