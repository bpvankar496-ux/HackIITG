import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUploadFile,
  validateDocumentMetadata,
  generateStoragePath,
  formatBytes,
} from './uploadValidation.ts';

test('validateUploadFile accepts valid PDF, JPEG, and PNG files', () => {
  const pdfRes = validateUploadFile({
    name: 'survey-plate-1876.pdf',
    size: 2 * 1024 * 1024,
    type: 'application/pdf',
  });
  assert.equal(pdfRes.valid, true);
  assert.equal(pdfRes.mimeType, 'application/pdf');

  const jpgRes = validateUploadFile({
    name: 'stepwell-elevation.jpg',
    size: 1.5 * 1024 * 1024,
    type: 'image/jpeg',
  });
  assert.equal(jpgRes.valid, true);
  assert.equal(jpgRes.mimeType, 'image/jpeg');

  const pngRes = validateUploadFile({
    name: 'modhera-plan.png',
    size: 800 * 1024,
    type: 'image/png',
  });
  assert.equal(pngRes.valid, true);
  assert.equal(pngRes.mimeType, 'image/png');
});

test('validateUploadFile rejects empty files and unsupported extensions', () => {
  const emptyRes = validateUploadFile({
    name: 'empty.pdf',
    size: 0,
    type: 'application/pdf',
  });
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.error?.includes('empty'));

  const exeRes = validateUploadFile({
    name: 'malicious.exe',
    size: 1024,
    type: 'application/octet-stream',
  });
  assert.equal(exeRes.valid, false);
  assert.ok(exeRes.error?.includes('Unsupported file extension'));
});

test('validateUploadFile rejects files exceeding 20MB limit', () => {
  const bigRes = validateUploadFile({
    name: 'huge-archive.pdf',
    size: 25 * 1024 * 1024,
    type: 'application/pdf',
  });
  assert.equal(bigRes.valid, false);
  assert.ok(bigRes.error?.includes('exceeds the maximum allowed limit'));
});

test('validateDocumentMetadata validates required title and document type', () => {
  const invalid = validateDocumentMetadata({
    title: '   ',
    document_type: 'unknown_type',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.document_type);

  const valid = validateDocumentMetadata({
    title: 'Architectural Survey of Western India, Vol II',
    document_type: 'architectural_record',
    latitude: 23.8593,
    longitude: 72.1017,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.sanitized.latitude, 23.8593);
  assert.equal(valid.sanitized.longitude, 72.1017);
});

test('validateDocumentMetadata validates coordinate boundaries', () => {
  const badCoords = validateDocumentMetadata({
    title: 'Rani ki Vav Coordinates',
    document_type: 'manuscript',
    latitude: 999, // invalid latitude
    longitude: 72.1017,
  });
  assert.equal(badCoords.valid, false);
  assert.ok(badCoords.errors.latitude);
});

test('generateStoragePath creates collision-resistant paths', () => {
  const path1 = generateStoragePath('user-123', 'My Historical File.PDF');
  const path2 = generateStoragePath('user-123', 'My Historical File.PDF');
  assert.notEqual(path1, path2);
  assert.ok(path1.startsWith('user-123/'));
  assert.ok(path1.endsWith('.pdf'));
});

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 Bytes');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(5242880), '5 MB');
});
