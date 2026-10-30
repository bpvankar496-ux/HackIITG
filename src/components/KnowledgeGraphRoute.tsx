import React from 'react';
import { KnowledgeGraphView } from './knowledgeGraph/KnowledgeGraphView';
import { SEED_HERITAGE_ENTITIES, SEED_HERITAGE_RELATIONSHIPS } from '../data/seedKnowledgeGraph';

interface KnowledgeGraphRouteProps {
  targetEntitySlug?: string;
  onNavigateToSite: (slug: string) => void;
}

/** Loads graph data together with the graph route rather than the initial page. */
export const KnowledgeGraphRoute: React.FC<KnowledgeGraphRouteProps> = (props) => (
  <KnowledgeGraphView
    initialEntities={SEED_HERITAGE_ENTITIES}
    initialRelationships={SEED_HERITAGE_RELATIONSHIPS}
    targetEntitySlug={props.targetEntitySlug}
    onNavigateToSite={props.onNavigateToSite}
  />
);
