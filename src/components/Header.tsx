/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Compass,
  BookOpen,
  Sparkles,
  Network,
  Upload,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Bookmark,
  Menu,
  X,
  ChevronDown,
  Landmark,
  Gamepad2,
  Home,
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'explore'
  | 'graph'
  | 'explorer'
  | 'assistant'
  | 'games'
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
    { id: 'overview', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { id: 'explore', label: 'Explore', icon: <Landmark className="h-4 w-4" /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <Network className="h-4 w-4" /> },
    { id: 'explorer', label: 'Archival Vault', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'assistant', label: 'AI Research', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="h-4 w-4" /> },
  ];

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleBrandClick = () => {
    onNavigate('overview');
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
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex shrink-0 items-center gap-3 text-left">
          <button
            type="button"
            onClick={handleBrandClick}
            className="group transition-opacity hover:opacity-90"
            aria-label="Virasat Quest — Virtual Tour"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B65F43] text-white shadow-xs transition-transform group-hover:scale-105">
              <Compass className="h-5 w-5 stroke-[1.8]" />
            </span>
          </button>
          <div>
            <button
              type="button"
              onClick={handleBrandClick}
              className="block whitespace-nowrap font-serif text-xl font-bold leading-tight tracking-tight text-[#292821] transition-colors hover:text-[#B65F43]"
              translate="no"
              aria-label="Virasat Quest — Virtual Tour"
            >
              Virasat Quest
            </button>
            <p className="hidden whitespace-nowrap text-[11px] font-normal leading-tight text-[#777267] min-[1700px]:block">
              Cultural &amp; Architectural Heritage Archive
            </p>
          </div>
        </div>

        {/* Primary Clean Desktop Navigation (6 prioritized items) */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex xl:gap-0" aria-label="Main Navigation">
          {primaryNavItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors 2xl:px-3 ${
                  isActive
                    ? 'bg-[#B65F43]/10 text-[#B65F43] font-semibold'
                    : 'text-[#4a473f] hover:text-[#B65F43] hover:bg-white/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-[#B65F43]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Deposit Folio & Auth Controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <LanguageSwitcher />

          {/* Quick Deposit Folio button */}
          {user && (
          <button
            onClick={() => handleNavClick('upload')}
            className={`hidden 2xl:inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-medium rounded-lg border transition-all ${
              currentSection === 'upload'
                ? 'bg-[#16192E] text-white border-[#16192E]'
                : 'bg-white text-[#292821] border-[#DCC9AD] hover:border-[#B65F43] hover:bg-[#FAF7F0]'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-[#B65F43]" />
            <span>Deposit Folio</span>
          </button>
          )}

          {/* User Account Controls */}
          {user ? (
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-[#DCC9AD] bg-white px-3 py-1.5 text-[13px] font-medium text-[#292821] transition-colors hover:bg-[#FAF7F0]"
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
                    onClick={() => handleNavClick('upload')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#292821] hover:bg-[#FAF7F0] transition-colors text-left 2xl:hidden"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#B65F43]" />
                    <span>Deposit Folio</span>
                  </button>

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
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                onClick={() => handleNavClick('login')}
                className="whitespace-nowrap rounded-lg border border-[#DCC9AD] bg-white px-4 py-2 text-[13px] font-medium text-[#292821] transition-colors hover:border-[#B65F43] hover:text-[#B65F43]"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick('signup')}
                className="whitespace-nowrap rounded-lg bg-[#B65F43] px-4 py-2 text-[13px] font-semibold text-white shadow-2xs transition-colors hover:bg-[#9A4B32]"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 xl:hidden">
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
        <div className="xl:hidden max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-[#DCC9AD] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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