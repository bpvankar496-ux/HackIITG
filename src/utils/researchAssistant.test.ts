/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  validateResearchQuery,
  formatCitationLabel,
  buildGroundedAssistantPrompt,
  extractCitationsFromAnswer,
  generateFallbackGroundedAnswer,
  ArchivalCitation,
} from './researchAssistant.ts';
import type { ArchivePassageResult } from './archiveSearch.ts';

const mockPassages: ArchivePassageResult[] = [
  {
    passageId: 'pass-1',
    documentId: 'doc-burgess-1876',
    pageNumber: 2,
    extractedText: 'The subterranean stepped well known as the Rani ki Vav was commissioned by Queen Udayamati, the consort of Bhimadeva I.',
    snippet: 'The subterranean stepped well known as the Rani ki Vav was commissioned by Queen Udayamati...',
    confidenceScore: 0.98,
    extractionMethod: 'pdf_text_layer',
    extractionStatus: 'completed',
    documentTitle: 'Report on the Antiquities of Kathiawad and Kachh',
    documentType: 'architectural_record',
    historicalPeriod: '1876 CE',
    locationName: 'Patan and Modhera, Gujarat',
    language: 'English with Sanskrit transcriptions',
    verificationStatus: 'unverified',
    sourceName: 'Archaeological Survey of Western India',
    attribution: 'Dr. James Burgess, Public Domain',
    storagePath: 'vault/burgess.pdf',
    relevanceScore: 12.5,
  },
  {
    passageId: 'pass-2',
    documentId: 'doc-burgess-1876',
    pageNumber: 4,
    extractedText: 'Dominant is the Vaishnava iconography: the Dashavatara including the boar incarnation (Varaha) lifting Bhudevi, Vamana, Narasimha, and Sheshashayi Vishnu.',
    snippet: 'Dominant is the Vaishnava iconography: the Dashavatara including the boar incarnation (Varaha)...',
    confidenceScore: 0.95,
    extractionMethod: 'pdf_text_layer',
    extractionStatus: 'completed',
    documentTitle: 'Report on the Antiquities of Kathiawad and Kachh',
    documentType: 'architectural_record',
    historicalPeriod: '1876 CE',
    locationName: 'Patan and Modhera, Gujarat',
    language: 'English with Sanskrit transcriptions',
    verificationStatus: 'unverified',
    sourceName: 'Archaeological Survey of Western India',
    attribution: 'Dr. James Burgess, Public Domain',
    storagePath: 'vault/burgess.pdf',
    relevanceScore: 9.2,
  },
];

describe('Research Assistant Pure Logic Tests', () => {
  test('validateResearchQuery handles valid, short, and oversized inputs', () => {
    // Valid query
    const res1 = validateResearchQuery('Who commissioned Rani ki Vav in Patan?');
    assert.strictEqual(res1.valid, true);
    assert.strictEqual(res1.cleanQuery, 'Who commissioned Rani ki Vav in Patan?');

    // Too short query
    const res2 = validateResearchQuery('hi');
    assert.strictEqual(res2.valid, false);
    assert.ok(res2.error?.includes('too short'));

    // Empty query
    const res3 = validateResearchQuery('   ');
    assert.strictEqual(res3.valid, false);
    assert.ok(res3.error?.includes('Please enter'));

    // Oversized query
    const longText = 'a'.repeat(650);
    const res4 = validateResearchQuery(longText);
    assert.strictEqual(res4.valid, false);
    assert.ok(res4.error?.includes('exceeds maximum'));
  });

  test('formatCitationLabel formats clean title and folio location', () => {
    const citation: ArchivalCitation = {
      citationId: 1,
      documentId: 'doc-1',
      documentTitle: 'Burgess Survey of Kathiawad',
      pageNumber: 3,
      passageSnippet: 'Detailed description of the stepped corridor.',
    };

    const label = formatCitationLabel(citation);
    assert.strictEqual(label, 'Burgess Survey of Kathiawad (p. 3)');
  });

  test('buildGroundedAssistantPrompt encapsulates untrusted passages and encloses rules', () => {
    const { systemInstruction, userPrompt } = buildGroundedAssistantPrompt(
      'What deities are depicted on the subterranean walls?',
      mockPassages
    );

    // Assert system directives
    assert.ok(systemInstruction.includes('STRICT ARCHIVAL GROUNDING'));
    assert.ok(systemInstruction.includes('CITATION DISCIPLINE'));
    assert.ok(systemInstruction.includes('PROMPT INJECTION RESISTANCE'));

    // Assert user prompt contains evidence brackets
    assert.ok(userPrompt.includes('<archival_evidence>'));
    assert.ok(userPrompt.includes('</archival_evidence>'));
    assert.ok(userPrompt.includes('[Citation 1]'));
    assert.ok(userPrompt.includes('[Citation 2]'));
    assert.ok(userPrompt.includes('Queen Udayamati'));
    assert.ok(userPrompt.includes('Dashavatara'));
  });

  test('buildGroundedAssistantPrompt handles zero passages gracefully', () => {
    const { userPrompt } = buildGroundedAssistantPrompt('Tell me about Agra Fort', []);
    assert.ok(userPrompt.includes('NO MATCHING ARCHIVAL PASSAGES WERE RETRIEVED'));
  });

  test('extractCitationsFromAnswer parses [Citation 1] tokens correctly', () => {
    const answer = 'According to colonial records [Citation 1], Rani ki Vav was commissioned by Queen Udayamati. The carvings represent Vishnu avatars including Varaha and Sheshashayi [Citation 2].';
    const citations = extractCitationsFromAnswer(answer, mockPassages);

    assert.strictEqual(citations.length, 2);
    assert.strictEqual(citations[0].citationId, 1);
    assert.strictEqual(citations[0].pageNumber, 2);
    assert.strictEqual(citations[1].citationId, 2);
    assert.strictEqual(citations[1].pageNumber, 4);
    assert.strictEqual(citations[0].documentTitle, 'Report on the Antiquities of Kathiawad and Kachh');
  });

  test('generateFallbackGroundedAnswer provides grounded text and citations when offline', () => {
    const res = generateFallbackGroundedAnswer('Who built Rani ki Vav?', mockPassages);
    assert.ok(res.answer.includes('Report on the Antiquities of Kathiawad and Kachh'));
    assert.ok(res.answer.includes('[Citation 1]'));
    assert.strictEqual(res.citations.length, 2);

    // With zero passages
    const zeroRes = generateFallbackGroundedAnswer('Something unknown', []);
    assert.ok(zeroRes.answer.includes('do not contain verified evidence'));
    assert.strictEqual(zeroRes.citations.length, 0);
  });
});
