import test from 'node:test';
import assert from 'node:assert/strict';
import {
  searchEntities,
  filterGraph,
  getConnectedNeighborhood,
  validateExtractionProposal,
  getEvidenceConfidenceDescription
} from './graphLogic';
import { HeritageEntity, HeritageRelationship } from '../types/knowledgeGraph';

const mockEntities: HeritageEntity[] = [
  {
    id: 'e1',
    slug: 'rani-ki-vav',
    name: 'Rani ki Vav',
    entityType: 'heritage_site',
    description: '11th-century stepwell in Patan',
    aliases: ['The Queen’s Stepwell', 'Ran-ki-Vav'],
    verificationStatus: 'verified'
  },
  {
    id: 'e2',
    slug: 'rani-udayamati',
    name: 'Queen Udayamati',
    entityType: 'person',
    description: 'Queen consort of Gujarat',
    aliases: ['Rani Udayamati'],
    verificationStatus: 'verified'
  },
  {
    id: 'e3',
    slug: 'sarkhej-roza',
    name: 'Sarkhej Roza',
    entityType: 'heritage_site',
    description: 'Mosque and tomb complex',
    aliases: ['Acropolis of Ahmedabad'],
    verificationStatus: 'pending'
  }
];

const mockRelationships: HeritageRelationship[] = [
  {
    id: 'r1',
    sourceEntityId: 'e1',
    targetEntityId: 'e2',
    relationshipType: 'commissioned_by',
    supportingDocTitle: 'Prabandha-Chintamani',
    supportingPassage: 'Queen Udayamati built in Patan a stepped reservoir surpassing all others.',
    pageNumber: 'p. 157',
    evidenceClassification: 'historical_chronicle',
    verificationStatus: 'verified'
  }
];

test('searchEntities finds entity by name and alias', () => {
  const resultByName = searchEntities(mockEntities, 'Rani ki Vav');
  assert.equal(resultByName.length, 1);
  assert.equal(resultByName[0].id, 'e1');

  const resultByAlias = searchEntities(mockEntities, 'Queen’s Stepwell');
  assert.equal(resultByAlias.length, 1);
  assert.equal(resultByAlias[0].id, 'e1');

  const empty = searchEntities(mockEntities, 'Nonexistent Monolith');
  assert.equal(empty.length, 0);
});

test('filterGraph filters by entityType and maintains referential integrity', () => {
  // When only filtering by person, e1 is excluded, so edge r1 must also be excluded
  const result = filterGraph(mockEntities, mockRelationships, {
    searchQuery: '',
    selectedEntityTypes: ['person'],
    selectedRelationshipTypes: [],
    verificationFilter: 'all'
  });

  assert.equal(result.filteredEntities.length, 1);
  assert.equal(result.filteredEntities[0].id, 'e2');
  assert.equal(result.filteredRelationships.length, 0); // r1 dropped because e1 is not in set
});

test('filterGraph filters by verificationStatus correctly', () => {
  const verifiedOnly = filterGraph(mockEntities, mockRelationships, {
    searchQuery: '',
    selectedEntityTypes: [],
    selectedRelationshipTypes: [],
    verificationFilter: 'verified'
  });

  assert.equal(verifiedOnly.filteredEntities.length, 2);
  assert.ok(verifiedOnly.filteredEntities.every(e => e.verificationStatus === 'verified'));

  const pendingOnly = filterGraph(mockEntities, mockRelationships, {
    searchQuery: '',
    selectedEntityTypes: [],
    selectedRelationshipTypes: [],
    verificationFilter: 'pending'
  });

  assert.equal(pendingOnly.filteredEntities.length, 1);
  assert.equal(pendingOnly.filteredEntities[0].id, 'e3');
});

test('getConnectedNeighborhood retrieves incoming and outgoing connections', () => {
  const n1 = getConnectedNeighborhood('e1', mockRelationships);
  assert.equal(n1.connectedEntityIds.has('e2'), true);
  assert.equal(n1.outgoingEdges.length, 1);
  assert.equal(n1.incomingEdges.length, 0);

  const n2 = getConnectedNeighborhood('e2', mockRelationships);
  assert.equal(n2.connectedEntityIds.has('e1'), true);
  assert.equal(n2.outgoingEdges.length, 0);
  assert.equal(n2.incomingEdges.length, 1);
});

test('validateExtractionProposal prevents duplicates, empty quotes, and cycle', () => {
  // Empty quote
  const invalidQuote = validateExtractionProposal(
    {
      sourceName: 'A',
      targetName: 'B',
      relationshipType: 'built_by',
      supportingPassage: 'short',
      evidenceClassification: 'ai_proposal',
      confidenceNote: ''
    },
    mockRelationships,
    'e1',
    'e3'
  );
  assert.equal(invalidQuote.isValid, false);

  // Duplicate relationship
  const duplicate = validateExtractionProposal(
    {
      sourceName: 'Rani ki Vav',
      targetName: 'Queen Udayamati',
      relationshipType: 'commissioned_by',
      supportingPassage: 'Valid passage of sufficient length and archival citation.',
      evidenceClassification: 'historical_chronicle',
      confidenceNote: ''
    },
    mockRelationships,
    'e1',
    'e2'
  );
  assert.equal(duplicate.isValid, false);

  // Valid proposal
  const valid = validateExtractionProposal(
    {
      sourceName: 'Rani ki Vav',
      targetName: 'Sarkhej Roza',
      relationshipType: 'associated_event',
      supportingPassage: 'Authentic archival passage connecting both sites through architectural influence.',
      evidenceClassification: 'curator_analysis',
      confidenceNote: ''
    },
    mockRelationships,
    'e1',
    'e3'
  );
  assert.equal(valid.isValid, true);
});

test('getEvidenceConfidenceDescription labels primary vs ai correctly', () => {
  const epigraph = getEvidenceConfidenceDescription('epigraphic_record', 'p. 182');
  assert.equal(epigraph.tone, 'high');
  assert.ok(epigraph.label.includes('Epigraph'));

  const ai = getEvidenceConfidenceDescription('ai_proposal');
  assert.equal(ai.tone, 'pending');
  assert.ok(ai.explanation.includes('archival confirmation'));
});

test('seed knowledge graph dataset has strictly unique entity and relationship IDs with zero orphaned edges', async () => {
  const { SEED_HERITAGE_ENTITIES, SEED_HERITAGE_RELATIONSHIPS } = await import('../data/seedKnowledgeGraph');
  
  // Verify entity IDs uniqueness
  const seenEntityIds = new Set<string>();
  const duplicateEntityIds: string[] = [];
  for (const ent of SEED_HERITAGE_ENTITIES) {
    if (seenEntityIds.has(ent.id)) {
      duplicateEntityIds.push(ent.id);
    }
    seenEntityIds.add(ent.id);
  }
  assert.deepEqual(duplicateEntityIds, [], `Duplicate entity IDs found: ${duplicateEntityIds.join(', ')}`);

  // Verify relationship IDs uniqueness
  const seenRelIds = new Set<string>();
  const duplicateRelIds: string[] = [];
  for (const rel of SEED_HERITAGE_RELATIONSHIPS) {
    if (seenRelIds.has(rel.id)) {
      duplicateRelIds.push(rel.id);
    }
    seenRelIds.add(rel.id);
  }
  assert.deepEqual(duplicateRelIds, [], `Duplicate relationship IDs found: ${duplicateRelIds.join(', ')}`);

  // Verify all source and target entity IDs exist
  const missingSources = SEED_HERITAGE_RELATIONSHIPS.filter(r => !seenEntityIds.has(r.sourceEntityId));
  const missingTargets = SEED_HERITAGE_RELATIONSHIPS.filter(r => !seenEntityIds.has(r.targetEntityId));
  assert.equal(missingSources.length, 0, `Missing source entities: ${missingSources.map(r => r.sourceEntityId).join(', ')}`);
  assert.equal(missingTargets.length, 0, `Missing target entities: ${missingTargets.map(r => r.targetEntityId).join(', ')}`);
});

