/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { readSaved, syncSavedOnLogin, SAVED_EVENT } from './lib/savedSites';
import { Header, NavSection } from './components/Header';
import { Footer } from './components/Footer';
import { motion, useReducedMotion } from 'motion/react';

const LandingPage = React.lazy(() => import('./components/LandingPage'));
const ExploreView = React.lazy(() => import('./components/ExploreView'));
const KnowledgeGraphRoute = React.lazy(async () => ({
  default: (await import('./components/KnowledgeGraphRoute')).KnowledgeGraphRoute,
}));
const ArchiveExplorerView = React.lazy(async () => ({
  default: (await import('./components/ArchiveExplorerView')).ArchiveExplorerView,
}));
const DocumentUploadView = React.lazy(async () => ({
  default: (await import('./components/DocumentUploadView')).DocumentUploadView,
}));
const ResearchAssistantView = React.lazy(async () => ({
  default: (await import('./components/ResearchAssistantView')).ResearchAssistantView,
}));
const GamesView = React.lazy(() => import('./components/GamesView'));
const CollectionView = React.lazy(() => import('./components/CollectionView'));
const HeritageDetailView = React.lazy(() => import('./components/HeritageDetailView'));
const AdminImportView = React.lazy(() => import('./components/AdminImportView'));
const ProjectDossier = React.lazy(async () => ({
  default: (await import('./components/ProjectDossier')).ProjectDossier,
}));
const LoginView = React.lazy(() => import('./components/auth/LoginView'));
const SignUpView = React.lazy(() => import('./components/auth/SignUpView'));

function VirasatQuestApp() {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [activeSiteSlug, setActiveSiteSlug] = useState<string>('rani-ki-vav');
  const [graphTargetSlug, setGraphTargetSlug] = useState<string | undefined>(undefined);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [routeHash, setRouteHash] = useState(() => window.location.hash);

  // Sync saved passport items count from localStorage
  const { user, loading: authLoading, isConfigured } = useAuth();
  const updateSavedCount = () => setSavedCount(readSaved().length);

  useEffect(() => {
    updateSavedCount();
    window.addEventListener(SAVED_EVENT, updateSavedCount);
    return () => window.removeEventListener(SAVED_EVENT, updateSavedCount);
  }, []);

  // Signed-in users: merge this browser's saved list with their account
  useEffect(() => {
    if (user?.id) void syncSavedOnLogin(user.id);
  }, [user?.id]);

  // After a Google round trip, send the visitor back to the page they originally wanted
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem('vq:redirect');
      if (pending) {
        sessionStorage.removeItem('vq:redirect');
        window.location.hash = pending;
      } else if (['#login', '#signup'].includes(window.location.hash)) {
        window.location.hash = '';
      }
    } catch {
      /* storage unavailable: stay put */
    }
  }, [user?.id]);

  // Handle URL hash changes for deep linking and browser history navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const isRetiredMapRoute = hash === 'map' || hash.startsWith('map/');

      // The standalone Heritage Map is retired. Keep old bookmarks useful by
      // taking visitors to the main site explorer instead.
      if (isRetiredMapRoute) {
        const fallbackHash = '#explore';
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${fallbackHash}`,
        );
        setRouteHash(fallbackHash);
        setCurrentSection('explore');
        return;
      }

      setRouteHash(window.location.hash);
      if (!hash || hash === 'home' || hash === 'overview') {
        setCurrentSection('overview');
      } else if (hash.startsWith('heritage/')) {
        const slug = hash.replace('heritage/', '');
        setActiveSiteSlug(slug);
        setCurrentSection('explore');
      } else if (hash.startsWith('knowledge-graph/') || hash.startsWith('graph/')) {
        const slug = hash.replace(/^(?:knowledge-graph|graph)\//, '');
        setGraphTargetSlug(slug);
        setCurrentSection('graph');
      } else if (hash === 'knowledge-graph' || hash === 'graph') {
        setGraphTargetSlug(undefined);
        setCurrentSection('graph');
      } else if (hash === 'vault' || hash === 'archive') {
        setCurrentSection('explorer');
      } else if (hash === 'saved') {
        setCurrentSection('collection');
      } else if (
        [
          'overview',
          'explore',
          'graph',
          'explorer',
          'assistant',
          'games',
          'upload',
          'collection',
          'login',
          'signup',
          'dossier',
          'admin-import',
        ].includes(hash)
      ) {
        setCurrentSection(hash as NavSection);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // State-directed navigation with URL hash synchronization
  const navigateTo = (section: NavSection | 'heritage-detail', slug?: string) => {
    let nextHash = '';

    if (section === 'heritage-detail' && slug) {
      setActiveSiteSlug(slug);
      setCurrentSection('explore');
      nextHash = `#heritage/${slug}`;
    } else if (section === 'graph') {
      setGraphTargetSlug(slug);
      setCurrentSection('graph');
      nextHash = slug ? `#knowledge-graph/${slug}` : '#knowledge-graph';
    } else {
      setCurrentSection(section as NavSection);
      nextHash = section === 'overview' ? '' : `#${section}`;
    }

    // Update React immediately; the hashchange listener remains responsible
    // for browser back/forward navigation and direct links.
    setRouteHash(nextHash);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }

    updateSavedCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDetailView = routeHash.startsWith('#heritage/');
  const reduceMotion = useReducedMotion();
  const pageKey = isDetailView ? `detail-${activeSiteSlug}` : currentSection;

  // Only the landing page and the login / signup screens are public.
  // If Supabase isn't configured (local dev) accounts can't exist, so nothing is locked.
  const isPublicSection =
    !isDetailView && ['overview', 'login', 'signup'].includes(currentSection);
  const isLocked = isConfigured && !user && !isPublicSection;

  return (
    <div className="min-h-screen page-grid text-[#292821] flex flex-col font-sans">
      {/* Primary Top Header & Navigation */}
      <Header
        currentSection={currentSection}
        onNavigate={(section) => navigateTo(section)}
        savedCount={savedCount}
      />

      {/* Main Routed Content Area */}
      <motion.main
        key={pageKey}
        className="flex-1"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#777267]">Loading heritage archive…</div>}>
          {/* Members-only pages: show sign-in instead, and keep the URL so we return here after login */}
          {isLocked && authLoading ? (
            <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#777267]">
              Checking your session…
            </div>
          ) : isLocked ? (
            <LoginView
              notice="Please sign in or create a free account to continue. You'll land right back on the page you picked."
              onNavigateToSignUp={() => navigateTo('signup')}
              onNavigateToHome={() => navigateTo('overview')}
              onLoginSuccess={() => {}}
            />
          ) : isDetailView ? (
            <HeritageDetailView
              slug={activeSiteSlug}
              onBack={() => navigateTo('explore')}
              onNavigateToGraph={(slug) => navigateTo('graph', slug)}
            />
          ) : (
            <>
            {/* Section 1: Overview / Professional Homepage */}
            {currentSection === 'overview' && (
              <LandingPage
                onNavigate={(sec) => navigateTo(sec)}
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
                onNavigateToGraph={(slug) => navigateTo('graph', slug)}
              />
            )}

            {/* Section 2: Explore Heritage Monuments */}
            {currentSection === 'explore' && (
              <ExploreView
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
              />
            )}

            {/* Heritage Knowledge Graph */}
            {currentSection === 'graph' && (
              <KnowledgeGraphRoute
                targetEntitySlug={graphTargetSlug}
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
              />
            )}

            {/* Archival Vault & Deep Passage Search */}
            {currentSection === 'explorer' && (
              <ArchiveExplorerView
                onNavigateToUpload={() => navigateTo('upload')}
              />
            )}

            {/* Grounded AI Heritage Research Assistant */}
            {currentSection === 'assistant' && (
              <ResearchAssistantView
                onNavigateToExplorer={() => navigateTo('explorer')}
                onNavigateToUpload={() => navigateTo('upload')}
                onNavigateToGraph={(slug) => navigateTo('graph', slug)}
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
              />
            )}

            {/* Games: heritage quiz and Simon */}
            {currentSection === 'games' && <GamesView />}

            {/* Document Intake & Multi-Modal OCR */}
            {currentSection === 'upload' && (
              <DocumentUploadView
                onUploadSuccess={() => {
                  navigateTo('explorer');
                }}
                onNavigateToArchive={() => navigateTo('explorer')}
              />
            )}

            {/* Saved Heritage Records / Personal Collection */}
            {currentSection === 'collection' && (
              <CollectionView
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
                onNavigateToExplore={() => navigateTo('explore')}
              />
            )}

            {/* Dedicated Authentication Views */}
            {currentSection === 'login' && (
              <LoginView
                onNavigateToSignUp={() => navigateTo('signup')}
                onNavigateToHome={() => navigateTo('overview')}
                onLoginSuccess={() => navigateTo('overview')}
              />
            )}

            {currentSection === 'signup' && (
              <SignUpView
                onNavigateToLogin={() => navigateTo('login')}
                onNavigateToHome={() => navigateTo('overview')}
                onSignUpSuccess={() => navigateTo('overview')}
              />
            )}

            {/* Admin Batch Ingestion & Dataset Audit */}
            {currentSection === 'admin-import' && <AdminImportView />}

            {/* Project Technical Dossier */}
            {currentSection === 'dossier' && <ProjectDossier />}
            </>
          )}
        </Suspense>
      </motion.main>

      {/* Editorial Footer */}
      <Footer onNavigate={(sec) => navigateTo(sec)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VirasatQuestApp />
    </AuthProvider>
  );
}
