import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineExtractionRoute,
  sanitizeExtractedText,
  computeWordCount,
  classifyPageStatus,
  calculateConfidenceScore,
  segmentTextIntoPages,
} from './ocrPipeline.ts';

test('determineExtractionRoute routes images directly to Gemini OCR', () => {
  const jpgRoute = determineExtractionRoute('image/jpeg', 0, 1);
  assert.equal(jpgRoute.route, 'gemini_multimodal_ocr');
  assert.equal(jpgRoute.isScannedOrVisual, true);

  const pngRoute = determineExtractionRoute('image/png', 0, 1);
  assert.equal(pngRoute.route, 'gemini_multimodal_ocr');
  assert.equal(pngRoute.isScannedOrVisual, true);
});

test('determineExtractionRoute identifies scanned PDFs without text layers', () => {
  // 5 chars across 2 pages = 2.5 chars/page -> scanned
  const scannedPdf = determineExtractionRoute('application/pdf', 5, 2);
  assert.equal(scannedPdf.route, 'gemini_multimodal_ocr');
  assert.equal(scannedPdf.isScannedOrVisual, true);
  assert.ok(scannedPdf.reason.includes('Scanned or visual PDF'));
});

test('determineExtractionRoute routes PDFs with valid text layers to native extractor', () => {
  // 2500 chars across 2 pages = 1250 chars/page -> native text layer
  const textPdf = determineExtractionRoute('application/pdf', 2500, 2);
  assert.equal(textPdf.route, 'pdf_text_layer');
  assert.equal(textPdf.isScannedOrVisual, false);
  assert.ok(textPdf.reason.includes('Usable text layer detected'));
});

test('determineExtractionRoute rejects unsupported MIME types', () => {
  const audioRoute = determineExtractionRoute('audio/mp3', 0, 1);
  assert.equal(audioRoute.route, 'unsupported');
});

test('sanitizeExtractedText cleans control characters and normalizes Unicode', () => {
  const raw = 'Archaeological Survey \x00of India\x08 \t\nVol II: Patan Stepwells\r\n';
  const cleaned = sanitizeExtractedText(raw);
  assert.equal(cleaned.includes('\x00'), false);
  assert.equal(cleaned.includes('\x08'), false);
  assert.ok(cleaned.includes('Archaeological Survey of India'));
  assert.ok(cleaned.includes('Patan Stepwells'));
});

test('computeWordCount handles multilingual texts correctly', () => {
  assert.equal(computeWordCount(''), 0);
  assert.equal(computeWordCount('   '), 0);
  assert.equal(computeWordCount('Report on the Antiquities of Kathiawad and Kachh'), 8);
  // Devanagari Sanskrit epigraph tokens
  assert.equal(computeWordCount('ॐ नमः शिवाय । श्री रानी की वाव'), 7);
});

test('classifyPageStatus flags empty pages and degraded text', () => {
  assert.equal(classifyPageStatus(''), 'empty_page');
  assert.equal(classifyPageStatus('   \n\t  '), 'empty_page');
  assert.equal(classifyPageStatus('Clear historical text with high legibility', 0.95), 'completed');
  assert.equal(classifyPageStatus('Degraded illegible characters', 0.35), 'needs_review');
});

test('calculateConfidenceScore assigns appropriate confidence', () => {
  assert.equal(calculateConfidenceScore('empty_page_marker', ''), 1.0);
  assert.equal(calculateConfidenceScore('pdf_text_layer', 'Any text'), 0.99);
  assert.equal(calculateConfidenceScore('gemini_multimodal_ocr', 'Text', 0.88), 0.88);
  
  // Heavily corrupted / noisy text gets flagged with low score
  const noisy = '§¶‡¤ ?? !! ¿¿ 128371928371';
  const score = calculateConfidenceScore('gemini_multimodal_ocr', noisy);
  assert.ok(score <= 0.50);
});

test('segmentTextIntoPages handles form feed characters and page delimiters', () => {
  const multiPageFormFeed = 'Page One Content\fPage Two Content\fPage Three Content';
  const pages = segmentTextIntoPages(multiPageFormFeed, 3);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].pageNumber, 1);
  assert.equal(pages[0].text, 'Page One Content');
  assert.equal(pages[1].pageNumber, 2);
  assert.equal(pages[1].text, 'Page Two Content');
  assert.equal(pages[2].pageNumber, 3);
  assert.equal(pages[2].text, 'Page Three Content');
});
