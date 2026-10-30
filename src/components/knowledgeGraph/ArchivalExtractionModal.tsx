import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Quote, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import {
  SAMPLE_ARCHIVAL_DOCUMENTS,
  SampleArchivalDocument,
  extractArchivalKnowledge
} from '../../lib/knowledgeGraphExtraction';
import {
  ExtractionResult,
  HeritageEntity,
  HeritageRelationship
} from '../../types/knowledgeGraph';
import { ENTITY_COLORS, getEntityIcon } from './GraphLegend';

interface ArchivalExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEntities: HeritageEntity[];
  existingRelationships: HeritageRelationship[];
  onAddEntitiesAndRelationships: (
    newEntities: HeritageEntity[],
    newRelationships: HeritageRelationship[]
  ) => void;
}

export const ArchivalExtractionModal: React.FC<ArchivalExtractionModalProps> = ({
  isOpen,
  onClose,
  existingEntities,
  existingRelationships,
  onAddEntitiesAndRelationships
}) => {
  if (!isOpen) return null;

  const [selectedDocId, setSelectedDocId] = useState<string>(SAMPLE_ARCHIVAL_DOCUMENTS[0].id);
  const [docTitle, setDocTitle] = useState(SAMPLE_ARCHIVAL_DOCUMENTS[0].title);
  const [citationRef, setCitationRef] = useState(SAMPLE_ARCHIVAL_DOCUMENTS[0].reference);
  const [archivalText, setArchivalText] = useState(SAMPLE_ARCHIVAL_DOCUMENTS[0].excerpt);

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // When user selects a sample document
  const handleSelectSample = (doc: SampleArchivalDocument) => {
    setSelectedDocId(doc.id);
    setDocTitle(doc.title);
    setCitationRef(doc.reference);
    setArchivalText(doc.excerpt);
    setExtractionResult(null);
    setExtractionError(null);
    setAddedMessage(null);
  };

  const handleRunExtraction = async () => {
    setIsProcessing(true);
    setExtractionError(null);
    setAddedMessage(null);

    try {
      const res = await extractArchivalKnowledge(archivalText, docTitle, citationRef);
      setExtractionResult(res);
    } catch (err: any) {
      setExtractionError(err.message || 'Archival text extraction failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptProposals = (verificationStatus: 'verified' | 'pending') => {
    if (!extractionResult) return;

    // Helper to find if entity already exists in database/graph
    const findExistingEntity = (name: string): HeritageEntity | undefined => {
      const clean = name.trim().toLowerCase();
      const slugCandidate = clean.replace(/[^a-z0-9]+/g, '-');
      return existingEntities.find(
        e =>
          e.name.toLowerCase() === clean ||
          e.slug.toLowerCase() === slugCandidate ||
          (e.aliases || []).some(a => a.toLowerCase() === clean)
      );
    };

    const newEntities: HeritageEntity[] = [];
    const entityNameToId = new Map<string, string>();

    // 1. Process candidate entities
    for (const pe of extractionResult.proposedEntities) {
      const existing = findExistingEntity(pe.name);
      if (existing) {
        entityNameToId.set(pe.name.toLowerCase(), existing.id);
      } else {
        const id = `ent-${pe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
        entityNameToId.set(pe.name.toLowerCase(), id);
        newEntities.push({
          id,
          slug: pe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: pe.name,
          entityType: pe.entityType,
          description: pe.description,
          aliases: pe.aliases,
          verificationStatus,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Process candidate relationships with duplicate checks
    const newRelationships: HeritageRelationship[] = [];
    let skippedDuplicates = 0;

    for (const pr of extractionResult.proposedRelationships) {
      const sId =
        entityNameToId.get(pr.sourceName.toLowerCase()) ||
        findExistingEntity(pr.sourceName)?.id ||
        `ent-${pr.sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      const tId =
        entityNameToId.get(pr.targetName.toLowerCase()) ||
        findExistingEntity(pr.targetName)?.id ||
        `ent-${pr.targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      if (sId === tId) continue; // No self cycles

      const alreadyExists = existingRelationships.some(
        r =>
          r.sourceEntityId === sId &&
          r.targetEntityId === tId &&
          r.relationshipType === pr.relationshipType
      );

      if (alreadyExists) {
        skippedDuplicates++;
        continue;
      }

      newRelationships.push({
        id: `rel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        sourceEntityId: sId,
        targetEntityId: tId,
        relationshipType: pr.relationshipType,
        supportingDocTitle: extractionResult.documentTitle,
        supportingPassage: pr.supportingPassage,
        pageNumber: pr.pageNumber || extractionResult.citationReference,
        evidenceClassification: pr.evidenceClassification,
        verificationStatus,
        confidenceNote: pr.confidenceNote,
        createdAt: new Date().toISOString()
      });
    }

    onAddEntitiesAndRelationships(newEntities, newRelationships);
    setAddedMessage(
      `Accepted: ${newEntities.length} new entities created, ${newRelationships.length} relationships documented${
        skippedDuplicates > 0 ? ` (${skippedDuplicates} existing relationships avoided duplicate creation)` : ''
      }.`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-extraction-title"
    >
      <div className="relative w-full max-w-4xl bg-[#F8F5EF] border border-[#DCC9AD] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#DCC9AD] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-extraction-title" className="font-serif text-xl font-bold text-[#292821]">
                Archival Evidence & Knowledge Extractor
              </h2>
              <p className="text-xs text-[#777267]">
                Extract candidate entities, explicitly supported relationships, and verbatim citations from primary texts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            className="p-1.5 text-[#777267] hover:text-[#292821] hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Sample Dossier Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#777267] mb-2">
              Select Primary Source Document Dossier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_ARCHIVAL_DOCUMENTS.map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectSample(doc)}
                  className={`p-3 text-left rounded-lg border text-xs transition-all ${
                    selectedDocId === doc.id
                      ? 'bg-white border-[#B65F43] shadow-xs'
                      : 'bg-white/70 border-[#DCC9AD] hover:border-[#777267]'
                  }`}
                >
                  <p className="font-serif font-bold text-[#292821] truncate">{doc.title}</p>
                  <p className="text-[11px] text-[#777267] mt-0.5">{doc.period}</p>
                  <p className="text-[10px] font-mono text-[#B65F43] truncate mt-1">{doc.reference}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Document Citation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-title-input" className="block text-xs font-bold text-[#777267] mb-1">
                Document Title
              </label>
              <input
                id="doc-title-input"
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>
            <div>
              <label htmlFor="doc-ref-input" className="block text-xs font-bold text-[#777267] mb-1">
                Citation / Inscription Reference
              </label>
              <input
                id="doc-ref-input"
                type="text"
                value={citationRef}
                onChange={e => setCitationRef(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              />
            </div>
          </div>

          {/* Archival Passage Textarea */}
          <div>
            <label htmlFor="archival-text-input" className="block text-xs font-bold text-[#777267] mb-1">
              Archival Text Passage (Extracted OCR / Chronicle / Epigraph Excerpt)
            </label>
            <textarea
              id="archival-text-input"
              rows={4}
              value={archivalText}
              onChange={e => setArchivalText(e.target.value)}
              className="w-full p-3 text-xs font-serif leading-relaxed bg-white border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
              placeholder="Paste archival text snippet here..."
            />
          </div>

          {/* Run Extraction Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#777267] italic">
              Extracts entities only when supported by verifiable textual evidence.
            </span>

            <button
              onClick={handleRunExtraction}
              disabled={isProcessing || !archivalText.trim()}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] disabled:opacity-60 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Archival Text…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze & Extract Knowledge</span>
                </>
              )}
            </button>
          </div>

          {/* Error Notice */}
          {extractionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{extractionError}</span>
            </div>
          )}

          {/* Success Notice */}
          {addedMessage && (
            <div className="p-3 bg-[#667653]/15 border border-[#667653]/40 rounded-lg text-xs text-[#667653] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{addedMessage}</span>
            </div>
          )}

          {/* Extraction Results */}
          {extractionResult && (
            <div className="border border-[#DCC9AD] rounded-xl bg-white p-5 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCC9AD]/60">
                <h3 className="font-serif font-bold text-base text-[#292821]">
                  Extracted Archival Knowledge
                </h3>
                <span className="text-[11px] font-mono bg-[#F8F5EF] px-2 py-0.5 rounded border border-[#DCC9AD] text-[#777267]">
                  {extractionResult.proposedEntities.length} Entities •{' '}
                  {extractionResult.proposedRelationships.length} Relationships
                </span>
              </div>

              {/* Proposed Entities */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#777267] mb-2">
                  Candidate Entities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractionResult.proposedEntities.map((ent, idx) => {
                    const color = ENTITY_COLORS[ent.entityType];
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-[#DCC9AD] bg-[#F8F5EF]/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-[#292821] text-xs">
                            {ent.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${color.bg} ${color.border} ${color.text}`}
                          >
                            {getEntityIcon(ent.entityType, 'w-2.5 h-2.5')}
                            {color.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#777267] line-clamp-2">
                          {ent.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proposed Relationships */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#777267] mb-2">
                  Explicitly Supported Relationships
                </h4>
                {extractionResult.proposedRelationships.length === 0 ? (
                  <p className="text-xs text-[#777267] italic p-3 bg-[#F8F5EF] rounded-lg">
                    No explicit direct relation was identified. Entities are retained as solitary archival nodes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extractionResult.proposedRelationships.map((rel, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF7F0] border border-[#DCC9AD] rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-serif font-bold text-[#292821] flex items-center gap-1.5">
                            <span>{rel.sourceName}</span>
                            <span className="font-mono text-[#B65F43] font-medium text-[11px] bg-[#B65F43]/10 px-2 py-0.5 rounded">
                              {rel.relationshipType.replace(/_/g, ' ')}
                            </span>
                            <span>{rel.targetName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#777267]">
                            {rel.evidenceClassification.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <blockquote className="text-xs italic text-[#292821] border-l-2 border-[#B65F43] pl-2.5 py-0.5 font-serif bg-white/70">
                          “{rel.supportingPassage}”
                        </blockquote>

                        <p className="text-[10px] text-[#777267] font-mono">
                          Citation: {rel.pageNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons to Accept into Knowledge Graph */}
              <div className="pt-3 border-t border-[#DCC9AD]/60 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#777267]">
                  Curator Decision: Accept proposals as pending review or mark verified.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptProposals('pending')}
                    type="button"
                    className="px-4 py-2 text-xs font-medium bg-[#C27803] hover:bg-[#A36402] text-white rounded-lg transition-colors shadow-xs"
                  >
                    Accept as Pending Review
                  </button>

                  <button
                    onClick={() => handleAcceptProposals('verified')}
                    type="button"
                    className="px-4 py-2 text-xs font-medium bg-[#667653] hover:bg-[#526042] text-white rounded-lg transition-colors shadow-xs"
                  >
                    Accept & Mark Verified
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
