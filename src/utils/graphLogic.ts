import {
  HeritageEntity,
  HeritageRelationship,
  GraphFilterState,
  EntityType,
  RelationshipType,
  EvidenceClassification,
  ExtractionCandidateRelationship
} from '../types/knowledgeGraph';

/**
 * Searches entities by name or aliases (case-insensitive substring match).
 */
export function searchEntities(entities: HeritageEntity[], query: string): HeritageEntity[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return entities;

  return entities.filter(ent => {
    const nameMatch = ent.name.toLowerCase().includes(clean);
    const aliasMatch = (ent.aliases || []).some(a => a.toLowerCase().includes(clean));
    const descMatch = ent.description.toLowerCase().includes(clean);
    return nameMatch || aliasMatch || descMatch;
  });
}

/**
 * Filters nodes and relationships based on user filter criteria.
 * Enforces integrity: no edge can exist without both its source and target nodes present.
 */
export function filterGraph(
  entities: HeritageEntity[],
  relationships: HeritageRelationship[],
  filters: GraphFilterState
): { filteredEntities: HeritageEntity[]; filteredRelationships: HeritageRelationship[] } {
  // 1. Filter entities by entityType and verificationStatus
  let filteredEntities = entities.filter(ent => {
    // Entity type check
    if (filters.selectedEntityTypes.length > 0) {
      if (!filters.selectedEntityTypes.includes(ent.entityType)) {
        return false;
      }
    }

    // Verification filter check
    if (filters.verificationFilter === 'verified' && ent.verificationStatus !== 'verified') {
      return false;
    }
    if (filters.verificationFilter === 'pending' && ent.verificationStatus !== 'pending') {
      return false;
    }

    return true;
  });

  const validEntityIds = new Set(filteredEntities.map(e => e.id));

  // 2. Filter relationships by relationshipType, verification, and presence of both endpoints
  const filteredRelationships = relationships.filter(rel => {
    // Must connect two currently valid entities
    if (!validEntityIds.has(rel.sourceEntityId) || !validEntityIds.has(rel.targetEntityId)) {
      return false;
    }

    // Relationship type check
    if (filters.selectedRelationshipTypes.length > 0) {
      if (!filters.selectedRelationshipTypes.includes(rel.relationshipType)) {
        return false;
      }
    }

    // Verification check
    if (filters.verificationFilter === 'verified' && rel.verificationStatus !== 'verified') {
      return false;
    }
    if (filters.verificationFilter === 'pending' && rel.verificationStatus !== 'pending') {
      return false;
    }

    return true;
  });

  return { filteredEntities, filteredRelationships };
}

/**
 * Retrieves the 1-hop connected neighborhood of a given entity ID.
 */
export function getConnectedNeighborhood(
  entityId: string,
  relationships: HeritageRelationship[]
): {
  connectedEntityIds: Set<string>;
  outgoingEdges: HeritageRelationship[];
  incomingEdges: HeritageRelationship[];
} {
  const connectedEntityIds = new Set<string>();
  const outgoingEdges: HeritageRelationship[] = [];
  const incomingEdges: HeritageRelationship[] = [];

  for (const rel of relationships) {
    if (rel.sourceEntityId === entityId) {
      connectedEntityIds.add(rel.targetEntityId);
      outgoingEdges.push(rel);
    } else if (rel.targetEntityId === entityId) {
      connectedEntityIds.add(rel.sourceEntityId);
      incomingEdges.push(rel);
    }
  }

  return { connectedEntityIds, outgoingEdges, incomingEdges };
}

/**
 * Validates an extracted relationship proposal against archival requirements.
 * Ensures evidence passage is present, entities are defined, and no duplicate relationship exists.
 */
export function validateExtractionProposal(
  proposal: ExtractionCandidateRelationship,
  existingRelationships: HeritageRelationship[],
  sourceId: string,
  targetId: string
): { isValid: boolean; error?: string } {
  if (!proposal.supportingPassage || proposal.supportingPassage.trim().length < 10) {
    return {
      isValid: false,
      error: 'Supporting evidence excerpt must be a non-empty passage of at least 10 characters.'
    };
  }

  if (!sourceId || !targetId) {
    return {
      isValid: false,
      error: 'Source and target entities must resolve to valid identifiers.'
    };
  }

  if (sourceId === targetId) {
    return {
      isValid: false,
      error: 'Self-referential cyclical relationships are not permitted.'
    };
  }

  const isDuplicate = existingRelationships.some(
    r =>
      r.sourceEntityId === sourceId &&
      r.targetEntityId === targetId &&
      r.relationshipType === proposal.relationshipType
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: `A relationship of type "${proposal.relationshipType}" already exists between these entities.`
    };
  }

  return { isValid: true };
}

/**
 * Classifies archival confidence for human-readable explanation in the UI.
 * Distinctly separates primary historical epigraphy from uncalibrated AI suggestions.
 */
export function getEvidenceConfidenceDescription(
  classification: EvidenceClassification,
  pageNumber?: string | null
): { label: string; tone: 'high' | 'medium' | 'pending'; explanation: string } {
  switch (classification) {
    case 'primary_source':
    case 'epigraphic_record':
      return {
        label: 'Direct Archival Epigraph',
        tone: 'high',
        explanation: `Sourced directly from in situ stone or copper-plate inscription${pageNumber ? ` (${pageNumber})` : ''}. Highest evidentiary weight.`
      };
    case 'archaeological_survey':
    case 'unesco_dossier':
      return {
        label: 'Peer-Reviewed Survey',
        tone: 'high',
        explanation: `Published by the Archaeological Survey of India (ASI) or UNESCO World Heritage Committee${pageNumber ? ` (${pageNumber})` : ''}.`
      };
    case 'historical_chronicle':
      return {
        label: 'Historical Chronicle',
        tone: 'medium',
        explanation: 'Documented in medieval chronicles (e.g. Prabandha-Chintamani, Mirat-i-Ahmadi). Corroboration advised.'
      };
    case 'curator_analysis':
      return {
        label: 'Curator Verified',
        tone: 'medium',
        explanation: 'Synthesized and verified by an authorized heritage archivist.'
      };
    case 'ai_proposal':
    default:
      return {
        label: 'Pending Archival Review',
        tone: 'pending',
        explanation: 'Proposed by automated extraction model. Requires archival confirmation against physical records before verification.'
      };
  }
}
