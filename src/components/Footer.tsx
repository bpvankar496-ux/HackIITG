/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, ExternalLink, Github, ShieldCheck, Landmark, BookOpen, Network, MapPin, Sparkles, Upload, Bookmark, Gamepad2 } from 'lucide-react';
import { NavSection } from './Header';

interface FooterProps {
  onNavigate?: (section: NavSection) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#DCC9AD] bg-[#FAF7F0] py-12 text-[#777267]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B65F43] text-white">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-serif text-xl font-bold text-[#292821]">
                Virasat Quest
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#777267]">
              A scholarly digital platform dedicated to the revitalisation of unstructured cultural and architectural heritage archives. Transforming colonial surveys, Sanskrit epigraphs, medieval chronicles, and unindexed archaeological field notes into a searchable, verified, and AI-grounded living knowledge platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#667653] font-medium pt-1">
              <ShieldCheck className="h-4 w-4 text-[#667653]" />
              <span>Strict source attribution &bull; Zero fabricated historical claims</span>
            </div>
          </div>

          {/* Quick Platform Navigation */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#292821]">
              Platform Modules
            </h4>
            <ul className="grid grid-cols-2 gap-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('explore')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Landmark className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Explore Sites</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('graph')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Network className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Knowledge Graph</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('explorer')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Archival Vault</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('assistant')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>AI Research</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('map')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Heritage Map</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('games')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Heritage Games</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('upload')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Deposit Folio</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('collection')}
                  className="hover:text-[#B65F43] transition-colors text-left flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#B65F43]" />
                  <span>Saved Records</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Provenance & Open Data */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#292821]">
              Archival Standards
            </h4>
            <p className="text-xs leading-relaxed text-[#777267]">
              Records grounded in Archaeological Survey of India (ASI) reports, Epigraphia Indica inscriptions, and UNESCO World Heritage dossiers.
            </p>
            <div className="pt-1 text-[11px] font-mono text-[#B65F43]">
              Open Cultural Access &bull; CC BY-SA 4.0
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate?.('login')}
                className="text-xs font-semibold text-[#292821] hover:text-[#B65F43] underline mr-3"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('signup')}
                className="text-xs font-semibold text-[#B65F43] hover:underline"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#DCC9AD]/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#777267]">
          <span>&copy; {new Date().getFullYear()} Virasat Quest &bull; Digital Heritage Preservation Archive.</span>
          <span className="mt-2 sm:mt-0 italic font-serif text-[#292821]">
            &ldquo;Every Place Has a Story. Every Story Deserves to Live.&rdquo;
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
