/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { readSaved, syncSavedOnLogin, SAVED_EVENT } from './lib/savedSites';
import { Header, NavSection } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ExploreView } from './components/ExploreView';
import { KnowledgeGraphView } from './components/knowledgeGraph/KnowledgeGraphView';
import { ArchiveExplorerView } from './components/ArchiveExplorerView';
import { DocumentUploadView } from './components/DocumentUploadView';
import { ResearchAssistantView } from './components/ResearchAssistantView';
import { HeritageMapView } from './components/HeritageMapView';
import { GamesView } from './components/GamesView';
import { motion, useReducedMotion } from 'motion/react';
import { CollectionView } from './components/CollectionView';
import { HeritageDetailView } from './components/HeritageDetailView';
import { AdminImportView } from './components/AdminImportView';
import { ProjectDossier } from './components/ProjectDossier';
import { LoginView } from './components/auth/LoginView';
import { SignUpView } from './components/auth/SignUpView';

import { SEED_HERITAGE_ENTITIES, SEED_HERITAGE_RELATIONSHIPS } from './data/seedKnowledgeGraph';

function VirasatQuestApp() {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [activeSiteSlug, setActiveSiteSlug] = useState<string>('rani-ki-vav');
  const [graphTargetSlug, setGraphTargetSlug] = useState<string | undefined>(undefined);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Sync saved passport items count from localStorage
  const { user } = useAuth();
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

  // Handle URL hash changes for deep linking and browser history navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
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
      } else if (hash === 'knowledge-graph') {
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
          'map',
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
    if (section === 'heritage-detail' && slug) {
      setActiveSiteSlug(slug);
      window.location.hash = `heritage/${slug}`;
    } else if (section === 'graph') {
      setGraphTargetSlug(slug);
      window.location.hash = slug ? `knowledge-graph/${slug}` : 'knowledge-graph';
      setCurrentSection('graph');
    } else {
      setCurrentSection(section as NavSection);
      window.location.hash = section === 'overview' ? '' : section;
    }
    updateSavedCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDetailView = window.location.hash.startsWith('#heritage/');
  const reduceMotion = useReducedMotion();
  const pageKey = isDetailView ? `detail-${activeSiteSlug}` : currentSection;

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292821] flex flex-col font-sans">
      {/* Primary Top Header & Navigation */}
      <Header
        currentSection={currentSection}
        onNavigate={(sec) => navigateTo(sec)}
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
        {/* Detail view takes precedence when hash matches #heritage/:slug */}
        {isDetailView ? (
          <HeritageDetailView
            slug={activeSiteSlug}
            onBack={() => {
              window.location.hash = 'explore';
              setCurrentSection('explore');
            }}
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

            {/* Section 3: Heritage Knowledge Graph */}
            {currentSection === 'graph' && (
              <KnowledgeGraphView
                initialEntities={SEED_HERITAGE_ENTITIES}
                initialRelationships={SEED_HERITAGE_RELATIONSHIPS}
                targetEntitySlug={graphTargetSlug}
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
              />
            )}

            {/* Section 4: Archival Vault & Deep Passage Search */}
            {currentSection === 'explorer' && (
              <ArchiveExplorerView
                onNavigateToUpload={() => navigateTo('upload')}
                onNavigateToMap={() => navigateTo('map')}
              />
            )}

            {/* Section 5: Grounded AI Heritage Research Assistant */}
            {currentSection === 'assistant' && (
              <ResearchAssistantView
                onNavigateToExplorer={() => navigateTo('explorer')}
                onNavigateToUpload={() => navigateTo('upload')}
                onNavigateToGraph={(slug) => navigateTo('graph', slug)}
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
              />
            )}

            {/* Section 6: Geospatial Heritage Map */}
            {currentSection === 'map' && (
              <HeritageMapView
                onNavigateToExplorer={() => navigateTo('explorer')}
                onNavigateToAssistant={() => navigateTo('assistant')}
                onNavigateToUpload={() => navigateTo('upload')}
              />
            )}

            {/* Games: heritage quiz and Simon */}
            {currentSection === 'games' && <GamesView />}

            {/* Section 7: Document Intake & Multi-Modal OCR */}
            {currentSection === 'upload' && (
              <DocumentUploadView
                onUploadSuccess={() => {
                  navigateTo('explorer');
                }}
                onNavigateToArchive={() => navigateTo('explorer')}
              />
            )}

            {/* Section 8: Saved Heritage Records / Personal Collection */}
            {currentSection === 'collection' && (
              <CollectionView
                onNavigateToSite={(slug) => navigateTo('heritage-detail', slug)}
                onNavigateToExplore={() => navigateTo('explore')}
              />
            )}

            {/* Section 9: Dedicated Authentication Views */}
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

            {/* Section 10: Admin Batch Ingestion & Dataset Audit */}
            {currentSection === 'admin-import' && <AdminImportView />}

            {/* Section 11: Project Technical Dossier */}
            {currentSection === 'dossier' && <ProjectDossier />}
          </>
        )}
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
