/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Compass,
  BookOpen,
  Sparkles,
  MapPin,
  Network,
  Upload,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Bookmark,
  FileSpreadsheet,
  Info,
  Menu,
  X,
  ChevronDown,
  Landmark,
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'explore'
  | 'graph'
  | 'explorer'
  | 'assistant'
  | 'map'
  | 'upload'
  | 'collection'
  | 'login'
  | 'signup'
  | 'dossier'
  | 'admin-import';

interface HeaderProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  savedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onNavigate,
  savedCount = 0,
}) => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Home', icon: <Compass className="h-4 w-4" /> },
    { id: 'explore', label: 'Explore', icon: <Landmark className="h-4 w-4" /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <Network className="h-4 w-4" /> },
    { id: 'explorer', label: 'Archival Vault', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'assistant', label: 'AI Research', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'map', label: 'Heritage Map', icon: <MapPin className="h-4 w-4" /> },
  ];

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return (
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Researcher'
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#DCC9AD] bg-[#F8F5EF]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('overview')}
          className="group flex items-center gap-3 text-left transition-opacity hover:opacity-90"
          aria-label="Virasat Quest — Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B65F43] text-white shadow-xs transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#292821]">
              Virasat Quest
            </span>
            <p className="text-[11px] text-[#777267] font-normal hidden sm:block">
              Cultural &amp; Architectural Heritage Archive
            </p>
          </div>
        </button>

        {/* Primary Clean Desktop Navigation (6 prioritized items) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          {primaryNavItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#B65F43] text-white shadow-2xs'
                    : 'text-[#292821] hover:text-[#B65F43] hover:bg-white/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Deposit Folio & Auth Controls */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Quick Deposit Folio button */}
          <button
            onClick={() => handleNavClick('upload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              currentSection === 'upload'
                ? 'bg-[#16192E] text-white border-[#16192E]'
                : 'bg-white text-[#292821] border-[#DCC9AD] hover:border-[#B65F43] hover:bg-[#FAF7F0]'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-[#B65F43]" />
            <span>Deposit Folio</span>
          </button>

          {/* User Account Controls */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DCC9AD] bg-white text-xs font-semibold text-[#292821] hover:bg-[#FAF7F0] transition-colors"
                aria-expanded={userDropdownOpen}
                aria-label="User Account Menu"
              >
                <div className="w-5 h-5 rounded-full bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center font-bold text-[10px]">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{getUserDisplayName()}</span>
                <ChevronDown className="h-3 w-3 text-[#777267]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#DCC9AD] bg-white p-2 shadow-lg z-50 text-xs space-y-1 animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-[#DCC9AD]/40">
                    <p className="font-semibold text-[#292821] truncate">{getUserDisplayName()}</p>
                    <p className="text-[11px] text-[#777267] truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => handleNavClick('collection')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#292821] hover:bg-[#FAF7F0] transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark className="h-3.5 w-3.5 text-[#B65F43]" />
                      <span>Saved Records</span>
                    </span>
                    {savedCount > 0 && (
                      <span className="bg-[#B65F43]/10 text-[#B65F43] font-bold text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {savedCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleNavClick('admin-import')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#292821] hover:bg-[#FAF7F0] transition-colors text-left"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#667653]" />
                    <span>Batch Data Intake</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('dossier')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#292821] hover:bg-[#FAF7F0] transition-colors text-left"
                  >
                    <Info className="h-3.5 w-3.5 text-[#777267]" />
                    <span>Project Technical Dossier</span>
                  </button>

                  <div className="pt-1 border-t border-[#DCC9AD]/40">
                    <button
                      onClick={async () => {
                        await signOut();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 transition-colors text-left font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNavClick('login')}
                className="px-3 py-1.5 text-xs font-semibold text-[#292821] hover:text-[#B65F43] hover:bg-white rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B65F43] hover:bg-[#9A4B32] rounded-lg transition-colors shadow-2xs"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[#DCC9AD] bg-white text-[#292821] hover:bg-[#FAF7F0]"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCC9AD] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentSection === item.id
                    ? 'bg-[#B65F43] text-white'
                    : 'bg-[#FAF7F0] text-[#292821] hover:bg-[#F3ECE1]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#DCC9AD]/60 space-y-2">
            <button
              onClick={() => handleNavClick('upload')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F0] text-xs font-semibold text-[#292821]"
            >
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#B65F43]" />
                <span>Deposit Folio &amp; OCR</span>
              </span>
            </button>

            <button
              onClick={() => handleNavClick('collection')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#FAF7F0] text-xs font-semibold text-[#292821]"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-[#B65F43]" />
                <span>Saved Heritage Records</span>
              </span>
              {savedCount > 0 && (
                <span className="bg-[#B65F43] text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('dossier')}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F0] text-xs font-semibold text-[#777267]"
            >
              <Info className="h-4 w-4" />
              <span>Project Technical Dossier</span>
            </button>
          </div>

          <div className="pt-3 border-t border-[#DCC9AD]/60">
            {user ? (
              <div className="flex items-center justify-between p-2.5 bg-[#FAF7F0] rounded-xl">
                <div>
                  <p className="font-semibold text-xs text-[#292821]">{getUserDisplayName()}</p>
                  <p className="text-[11px] text-[#777267]">{user.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="w-full py-2.5 text-xs font-semibold text-[#292821] bg-[#FAF7F0] border border-[#DCC9AD] rounded-xl text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('signup')}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#B65F43] rounded-xl text-center shadow-xs"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
