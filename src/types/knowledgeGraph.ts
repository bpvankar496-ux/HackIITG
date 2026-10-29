/**
 * Types for the Virasat Quest Heritage Knowledge Graph (Step 8)
 */

export type EntityType =
  | 'heritage_site'
  | 'person'
  | 'place'
  | 'historical_period'
  | 'event'
  | 'architectural_style'
  | 'document';

export type RelationshipType =
  | 'commissioned_by'
  | 'built_by'
  | 'patronized_by'
  | 'located_in'
  | 'originated_during'
  | 'associated_event'
  | 'architectural_tradition'
  | 'documented_in'
  | 'successor_of'
  | 'dedicated_to'
  | 'restored_by'
  | 'material_used'
  | 'inscribed_by';

export type EvidenceClassification =
  | 'primary_source'
  | 'archaeological_survey'
  | 'epigraphic_record'
  | 'historical_chronicle'
  | 'unesco_dossier'
  | 'curator_analysis'
  | 'ai_proposal';

export type VerificationStatus = 'verified' | 'pending' | 'community' | 'disputed';

export interface HeritageEntity {
  id: string;
  slug: string;
  name: string;
  entityType: EntityType;
  description: string;
  aliases: string[];
  supportingSiteSlug?: string | null;
  verificationStatus: VerificationStatus;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeritageRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  supportingDocTitle: string;
  supportingDocUrl?: string | null;
  supportingPassage: string;
  pageNumber?: string | null;
  evidenceClassification: EvidenceClassification;
  verificationStatus: VerificationStatus;
  confidenceNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeritageEvidence {
  id: string;
  relationshipId: string;
  documentTitle: string;
  citationReference: string;
  excerpt: string;
  pageOrPlate?: string | null;
  archiveRepository?: string | null;
  isVerified: boolean;
  createdAt?: string;
}

export interface GraphNode extends HeritageEntity {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  degree?: number;
}

export interface GraphEdge extends HeritageRelationship {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GraphFilterState {
  searchQuery: string;
  selectedEntityTypes: EntityType[];
  selectedRelationshipTypes: RelationshipType[];
  verificationFilter: 'all' | 'verified' | 'pending';
}

export interface ExtractionCandidateEntity {
  name: string;
  entityType: EntityType;
  description: string;
  aliases: string[];
  confidence: number;
}

export interface ExtractionCandidateRelationship {
  sourceName: string;
  targetName: string;
  relationshipType: RelationshipType;
  supportingPassage: string;
  pageNumber?: string;
  evidenceClassification: EvidenceClassification;
  confidenceNote: string;
}

export interface ExtractionResult {
  documentTitle: string;
  citationReference: string;
  sourcePassage: string;
  proposedEntities: ExtractionCandidateEntity[];
  proposedRelationships: ExtractionCandidateRelationship[];
  isAiGenerated: boolean;
  warning?: string;
}
