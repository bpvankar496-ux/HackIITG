/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Info,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import {
  validateUploadFile,
  validateDocumentMetadata,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  VALID_DOCUMENT_TYPES,
  DocumentTypeEnum,
} from '../utils/uploadValidation';
import { DocumentRecord } from '../types/database.types';

interface DocumentUploadViewProps {
  onUploadSuccess: (doc: DocumentRecord) => void;
  onNavigateToArchive: () => void;
}

export const DocumentUploadView: React.FC<DocumentUploadViewProps> = ({
  onUploadSuccess,
  onNavigateToArchive,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Metadata form fields
  const [title, setTitle] = useState<string>('');
  const [docType, setDocType] = useState<DocumentTypeEnum>('historical_document');
  const [description, setDescription] = useState<string>('');
  const [historicalPeriod, setHistoricalPeriod] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [locationName, setLocationName] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [attribution, setAttribution] = useState<string>('');

  // UI state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<DocumentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFile = (selectedFile: File) => {
    setFileError(null);
    setServerError(null);
    setSuccessDoc(null);

    const val = validateUploadFile({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });

    if (!val.valid) {
      setFileError(val.error || 'Invalid file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    // Autofill title if empty
    if (!title.trim()) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleSelectFile(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!file) {
      setFileError('Please select a historical document file to upload.');
      return;
    }

    // Validate metadata
    const metaVal = validateDocumentMetadata({
      title,
      document_type: docType,
      description,
      historical_period: historicalPeriod,
      language,
      location_name: locationName,
      latitude,
      longitude,
      source_name: sourceName,
      attribution,
    });

    if (!metaVal.valid) {
      setFieldErrors(metaVal.errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    setUploadProgress(20);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);

      const fileBase64 = await base64Promise;
      setUploadProgress(50);

      // Submit to server endpoint
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          filename: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          metadata: {
            title,
            document_type: docType,
            description,
            historical_period: historicalPeriod,
            language,
            location_name: locationName,
            latitude,
            longitude,
            source_name: sourceName,
            attribution,
          },
        }),
      });

      setUploadProgress(90);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Upload failed on server.');
      }

      setUploadProgress(100);
      setSuccessDoc(data.document);
      onUploadSuccess(data.document);

      // Reset form
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTitle('');
      setDescription('');
      setHistoricalPeriod('');
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setSourceName('');
      setAttribution('');
    } catch (err: any) {
      setServerError(err.message || 'An error occurred during document upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Title */}
      <div className="border-b border-[#E2D7C3] pb-6">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#B38E46]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6860]">
            Archival Document Intake
          </span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#16192E]">
          Upload Historical Document
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6860]">
          Deposit digitized colonial reports, architectural plans, manuscripts, or historical photographs into the private storage vault.
        </p>
      </div>

      {/* Success Notification */}
      {successDoc && (
        <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-serif font-bold text-base text-emerald-900">
                Document Successfully Deposited into Archive Vault
              </h3>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                <strong>{successDoc.title}</strong> has been secured in the private Supabase Storage bucket (<code className="font-mono text-[11px] bg-emerald-100 px-1 py-0.5 rounded">{successDoc.storage_path}</code>) and registered in the metadata repository.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onNavigateToArchive}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors"
                >
                  <span>Inspect in Archive Explorer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessDoc(null)}
                  className="text-xs text-emerald-800 underline hover:text-emerald-950"
                >
                  Upload another document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Error Alert */}
      {serverError && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Upload Failed:</strong> {serverError}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Step 1: File Selection Area */}
        <div className="rounded-xl border border-[#E2D7C3] bg-white p-6 shadow-xs">
          <h2 className="font-serif text-lg font-bold text-[#16192E] flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16192E] text-xs text-white font-mono">1</span>
            <span>Historical Document File</span>
          </h2>
          <p className="mt-1 text-xs text-[#6B6860]">
            Supported formats: PDF, JPEG, PNG. Maximum size: 20 MB per file.
          </p>

          {!file ? (
            /* Drag and Drop Box */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#B38E46] bg-[#F4EFE6]'
                  : 'border-[#C9BBA2] bg-[#FBF9F4] hover:border-[#16192E] hover:bg-[#F4EFE6]/60'
              }`}
            >
              <Upload className="h-10 w-10 text-[#B38E46] mb-3 stroke-[1.5]" />
              <div className="text-sm font-semibold text-[#16192E]">
                Drag and drop your historical file here, or <span className="text-[#B38E46] underline">browse</span>
              </div>
              <p className="mt-1 text-xs text-[#8E8A81]">
                Scanned survey folios, manuscripts, plates, or historical photographs
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelectFile(f);
                }}
                className="hidden"
              />
            </div>
          ) : (
            /* Selected File Card */
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#C9BBA2] bg-[#F4EFE6] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-[#E2D7C3] text-[#16192E]">
                  <FileText className="h-5 w-5 text-[#B38E46]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#16192E] truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6B6860] mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    <span>&bull;</span>
                    <span className="uppercase font-mono text-[10px] text-[#B38E46]">
                      {file.type || 'DOCUMENT'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-lg p-1.5 text-[#6B6860] hover:bg-white hover:text-red-700 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {fileError && (
            <p className="mt-2 text-xs text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{fileError}</span>
            </p>
          )}
        </div>

        {/* Step 2: Metadata Form */}
        <div className="rounded-xl border border-[#E2D7C3] bg-white p-6 shadow-xs">
          <h2 className="font-serif text-lg font-bold text-[#16192E] flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16192E] text-xs text-white font-mono">2</span>
            <span>Archival Metadata</span>
          </h2>
          <p className="mt-1 text-xs text-[#6B6860]">
            Accurate historical provenance and source attribution for research integrity.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Title (Required) */}
            <div className="sm:col-span-2">
              <label htmlFor="doc-title" className="block text-xs font-semibold text-[#16192E]">
                Document Title <span className="text-red-600">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Architectural Survey of Western India: Report on Kathiawad and Kachh"
                className={`mt-1.5 w-full rounded-lg border bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 ${
                  fieldErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-[#E2D7C3] focus:ring-[#B38E46]'
                }`}
              />
              {fieldErrors.title && (
                <span className="mt-1 block text-[11px] text-red-600">{fieldErrors.title}</span>
              )}
            </div>

            {/* Document Type (Required) */}
            <div>
              <label htmlFor="doc-type" className="block text-xs font-semibold text-[#16192E]">
                Document Classification <span className="text-red-600">*</span>
              </label>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentTypeEnum)}
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              >
                <option value="historical_document">Historical Document</option>
                <option value="manuscript">Manuscript / Epigraph</option>
                <option value="architectural_record">Architectural Record / Survey</option>
                <option value="photograph">Archival Photograph</option>
                <option value="map">Historical Cartographic Map</option>
                <option value="other">Other Cultural Record</option>
              </select>
            </div>

            {/* Historical Period */}
            <div>
              <label htmlFor="doc-period" className="block text-xs font-semibold text-[#16192E]">
                Historical Period / Date
              </label>
              <input
                id="doc-period"
                type="text"
                value={historicalPeriod}
                onChange={(e) => setHistoricalPeriod(e.target.value)}
                placeholder="e.g. 11th century CE or 1876 CE"
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>

            {/* Language */}
            <div>
              <label htmlFor="doc-language" className="block text-xs font-semibold text-[#16192E]">
                Original Language / Script
              </label>
              <input
                id="doc-language"
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Sanskrit (Devanagari), English, Persian"
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>

            {/* Location Name */}
            <div>
              <label htmlFor="doc-location" className="block text-xs font-semibold text-[#16192E]">
                Associated Landmark or Region
              </label>
              <input
                id="doc-location"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Rani ki Vav, Patan, Gujarat"
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>

            {/* Latitude & Longitude */}
            <div>
              <label htmlFor="doc-lat" className="block text-xs font-semibold text-[#16192E]">
                Latitude (Optional Coordinate)
              </label>
              <input
                id="doc-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 23.8593"
                className={`mt-1.5 w-full rounded-lg border bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 ${
                  fieldErrors.latitude ? 'border-red-400 focus:ring-red-400' : 'border-[#E2D7C3] focus:ring-[#B38E46]'
                }`}
              />
              {fieldErrors.latitude && (
                <span className="mt-1 block text-[11px] text-red-600">{fieldErrors.latitude}</span>
              )}
            </div>

            <div>
              <label htmlFor="doc-lng" className="block text-xs font-semibold text-[#16192E]">
                Longitude (Optional Coordinate)
              </label>
              <input
                id="doc-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 72.1017"
                className={`mt-1.5 w-full rounded-lg border bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 ${
                  fieldErrors.longitude ? 'border-red-400 focus:ring-red-400' : 'border-[#E2D7C3] focus:ring-[#B38E46]'
                }`}
              />
              {fieldErrors.longitude && (
                <span className="mt-1 block text-[11px] text-red-600">{fieldErrors.longitude}</span>
              )}
            </div>

            {/* Source Name */}
            <div>
              <label htmlFor="doc-source" className="block text-xs font-semibold text-[#16192E]">
                Source Archive / Repository
              </label>
              <input
                id="doc-source"
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Archaeological Survey of India Western Circle"
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>

            {/* Attribution */}
            <div>
              <label htmlFor="doc-attribution" className="block text-xs font-semibold text-[#16192E]">
                Attribution / Rights Information
              </label>
              <input
                id="doc-attribution"
                type="text"
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                placeholder="e.g. Public Domain (Historical Archive) or CC BY 4.0"
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="doc-desc" className="block text-xs font-semibold text-[#16192E]">
                Description &amp; Historical Context
              </label>
              <textarea
                id="doc-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of document contents, epigraphic notes, architectural drawings, or folio details..."
                className="mt-1.5 w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3.5 py-2 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
              />
            </div>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isSubmitting && (
          <div className="rounded-xl border border-[#E2D7C3] bg-white p-4">
            <div className="flex items-center justify-between text-xs text-[#6B6860] mb-1.5">
              <span>Securing document in private storage vault...</span>
              <span className="font-mono font-semibold">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE5D5]">
              <div
                className="h-full bg-[#B38E46] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onNavigateToArchive}
            className="rounded-lg border border-[#E2D7C3] bg-white px-5 py-2.5 text-xs font-semibold text-[#6B6860] hover:bg-[#F4EFE6] transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="flex items-center gap-2 rounded-lg bg-[#16192E] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#272B40] transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-[#C9A45C]" />
            <span>{isSubmitting ? 'Depositing Document…' : 'Deposit into Archive Vault'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
