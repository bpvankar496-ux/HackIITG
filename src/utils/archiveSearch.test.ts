import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSnippet,
  highlightMatchingSegments,
  calculateRelevanceScore,
  applyArchiveFilters,
  ArchivePassageResult,
} from './archiveSearch.ts';

test('extractSnippet extracts a clean window around the matching term', () => {
  const text =
    'The stepwell of Rani ki Vav in Patan was built during the Solanki dynasty by Queen Udayamati. Its seven pillared terraces contain over five hundred principal sculptures.';
  
  const snippet = extractSnippet(text, 'Solanki', 80);
  assert.ok(snippet.includes('Solanki'));
  assert.ok(snippet.includes('...'));
  assert.ok(snippet.length <= 95);
});

test('extractSnippet handles queries with no match by returning start of text', () => {
  const text = 'Architectural survey of the Sun Temple in Modhera Gujarat.';
  const snippet = extractSnippet(text, 'Chola', 40);
  assert.ok(snippet.startsWith('Architectural survey'));
  assert.ok(snippet.endsWith('...'));
});

test('highlightMatchingSegments splits text safely without HTML injection', () => {
  const text = 'Survey of Rani ki Vav at Patan, Gujarat.';
  const segments = highlightMatchingSegments(text, 'Rani Patan');

  assert.equal(segments.length, 5);
  // 'Survey of ' (no match)
  assert.equal(segments[0].text, 'Survey of ');
  assert.equal(segments[0].isMatch, false);

  // 'Rani' (match)
  assert.equal(segments[1].text, 'Rani');
  assert.equal(segments[1].isMatch, true);

  // ' ki Vav at ' (no match)
  assert.equal(segments[2].text, ' ki Vav at ');
  assert.equal(segments[2].isMatch, false);

  // 'Patan' (match)
  assert.equal(segments[3].text, 'Patan');
  assert.equal(segments[3].isMatch, true);

  // ', Gujarat.' (no match)
  assert.equal(segments[4].text, ', Gujarat.');
  assert.equal(segments[4].isMatch, false);
});

test('calculateRelevanceScore weights title and location higher than body', () => {
  const titleMatchScore = calculateRelevanceScore(
    'Rani ki Vav Patan Survey',
    'Patan',
    '11th century',
    'General architectural notes on temple structures.',
    'Rani ki Vav'
  );

  const bodyOnlyScore = calculateRelevanceScore(
    'General Western India Antiquities',
    'Ahmedabad',
    '19th century',
    'A brief passing mention of the stepwell Rani ki Vav in distant regions.',
    'Rani ki Vav'
  );

  assert.ok(titleMatchScore > bodyOnlyScore);
});

test('applyArchiveFilters filters by document type, location, and period', () => {
  const sampleResults: ArchivePassageResult[] = [
    {
      passageId: '1',
      documentId: 'doc-1',
      pageNumber: 1,
      extractedText: 'Patani survey plate',
      snippet: 'Patani survey plate',
      confidenceScore: 0.99,
      extractionMethod: 'pdf_text_layer',
      extractionStatus: 'completed',
      documentTitle: 'Report on Kathiawad',
      documentType: 'architectural_record',
      historicalPeriod: '1876 CE',
      locationName: 'Patan, Gujarat',
      language: 'English',
      verificationStatus: 'verified',
      sourceName: 'ASI',
      attribution: 'Public Domain',
      storagePath: 'vault/test.pdf',
      relevanceScore: 80,
    },
    {
      passageId: '2',
      documentId: 'doc-2',
      pageNumber: 2,
      extractedText: 'Copperplate inscription of Bhima I',
      snippet: 'Copperplate inscription',
      confidenceScore: 0.95,
      extractionMethod: 'gemini_multimodal_ocr',
      extractionStatus: 'completed',
      documentTitle: 'Solanki Inscription',
      documentType: 'manuscript',
      historicalPeriod: '1063 CE',
      locationName: 'Modhera, Gujarat',
      language: 'Sanskrit',
      verificationStatus: 'unverified',
      sourceName: 'Epigraphia Indica',
      attribution: 'ASI',
      storagePath: 'vault/copper.png',
      relevanceScore: 60,
    },
  ];

  // Filter by documentType = 'manuscript'
  const manuscripts = applyArchiveFilters(sampleResults, { documentType: 'manuscript' });
  assert.equal(manuscripts.length, 1);
  assert.equal(manuscripts[0].passageId, '2');

  // Filter by location = 'Patan'
  const patanDocs = applyArchiveFilters(sampleResults, { location: 'Patan' });
  assert.equal(patanDocs.length, 1);
  assert.equal(patanDocs[0].passageId, '1');

  // Filter with no match
  const noMatch = applyArchiveFilters(sampleResults, { historicalPeriod: 'Chola' });
  assert.equal(noMatch.length, 0);
});
