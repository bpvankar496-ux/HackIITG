import React from 'react';
import { X, ArrowRight, Quote, BookOpen, ExternalLink, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { HeritageRelationship, HeritageEntity } from '../../types/knowledgeGraph';
import { getEvidenceConfidenceDescription } from '../../utils/graphLogic';
import { ENTITY_COLORS, getEntityIcon } from './GraphLegend';

interface RelationshipDetailsPanelProps {
  relationship: HeritageRelationship | null;
  entities: HeritageEntity[];
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
  onNavigateToSite?: (slug: string) => void;
}

export const RelationshipDetailsPanel: React.FC<RelationshipDetailsPanelProps> = ({
  relationship,
  entities,
  onClose,
  onSelectEntity,
  onNavigateToSite
}) => {
  if (!relationship) return null;

  const entityMap = new Map(entities.map(e => [e.id, e]));
  const source = entityMap.get(relationship.sourceEntityId);
  const target = entityMap.get(relationship.targetEntityId);

  const confidenceInfo = getEvidenceConfidenceDescription(
    relationship.evidenceClassification,
    relationship.pageNumber
  );

  return (
    <aside
      className="absolute top-0 right-0 bottom-0 w-full sm:w-96 max-w-full bg-white/95 backdrop-blur-md border-l border-[#DCC9AD] shadow-xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      aria-labelledby="rel-panel-title"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#DCC9AD] bg-[#F8F5EF]/70 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#B65F43] font-bold">
              Archival Relationship
            </span>

            {relationship.verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#667653] bg-[#667653]/15 px-2 py-0.5 rounded-full border border-[#667653]/30">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C27803] bg-[#C27803]/15 px-2 py-0.5 rounded-full border border-[#C27803]/30">
                <Clock className="w-3 h-3" />
                Pending Verification
              </span>
            )}
          </div>

          <h2 id="rel-panel-title" className="font-serif text-xl font-bold text-[#292821] capitalize">
            {relationship.relationshipType.replace(/_/g, ' ')}
          </h2>
        </div>

        <button
          onClick={onClose}
          type="button"
          aria-label="Close relationship details"
          className="p-1.5 rounded-lg text-[#777267] hover:text-[#292821] hover:bg-black/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* Source -> Relationship -> Target Card */}
        <div className="bg-[#F8F5EF] p-3 rounded-lg border border-[#DCC9AD] space-y-2">
          {source && (
            <button
              onClick={() => onSelectEntity(source.id)}
              type="button"
              className="w-full text-left p-2 bg-white rounded border border-[#DCC9AD] hover:border-[#B65F43] transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-[#777267]">
                <span>Source Entity</span>
                <span className="text-[10px] uppercase font-mono">
                  {ENTITY_COLORS[source.entityType].label}
                </span>
              </div>
              <p className="font-serif font-bold text-[#292821] mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${ENTITY_COLORS[source.entityType].dot}`} />
                {source.name}
              </p>
            </button>
          )}

          <div className="flex items-center justify-center gap-1 text-xs text-[#B65F43] font-mono font-bold py-0.5">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{relationship.relationshipType.replace(/_/g, ' ')}</span>
          </div>

          {target && (
            <button
              onClick={() => onSelectEntity(target.id)}
              type="button"
              className="w-full text-left p-2 bg-white rounded border border-[#DCC9AD] hover:border-[#B65F43] transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-[#777267]">
                <span>Target Entity</span>
                <span className="text-[10px] uppercase font-mono">
                  {ENTITY_COLORS[target.entityType].label}
                </span>
              </div>
              <p className="font-serif font-bold text-[#292821] mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${ENTITY_COLORS[target.entityType].dot}`} />
                {target.name}
              </p>
            </button>
          )}
        </div>

        {/* Verbatim Supporting Evidence Passage */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#777267] mb-1.5">
            <Quote className="w-3.5 h-3.5 text-[#B65F43]" />
            <span>Supporting Archival Passage</span>
          </div>

          <blockquote className="bg-[#FAF7F0] border-l-4 border-[#B65F43] p-3.5 rounded-r-lg text-xs leading-relaxed text-[#292821] italic font-serif">
            {relationship.supportingPassage}
          </blockquote>
        </div>

        {/* Source Document Citation & Provenance */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#777267] mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#667653]" />
            <span>Document & Provenance</span>
          </div>

          <div className="bg-[#F8F5EF]/60 p-3 rounded-lg border border-[#DCC9AD] space-y-1.5 text-xs">
            <div>
              <span className="text-[#777267] block text-[11px]">Primary Source / Dossier:</span>
              <p className="font-semibold text-[#292821]">{relationship.supportingDocTitle}</p>
            </div>

            {relationship.pageNumber && (
              <div>
                <span className="text-[#777267] block text-[11px]">Page / Folio / Inscription Reference:</span>
                <p className="font-mono text-[#292821] font-medium">{relationship.pageNumber}</p>
              </div>
            )}

            {relationship.supportingDocUrl && (
              <a
                href={relationship.supportingDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#B65F43] hover:underline font-medium text-xs mt-1"
              >
                <span>View Archival Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Evidence Classification & Evidentiary Weight */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267] mb-1.5">
            Evidence Classification
          </h3>

          <div className="bg-white p-3 rounded-lg border border-[#DCC9AD] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#292821]">
                {confidenceInfo.label}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  confidenceInfo.tone === 'high'
                    ? 'bg-[#667653]/15 text-[#667653]'
                    : confidenceInfo.tone === 'medium'
                    ? 'bg-[#C27803]/15 text-[#C27803]'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {relationship.evidenceClassification.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs text-[#777267] leading-relaxed">
              {confidenceInfo.explanation}
            </p>

            {relationship.confidenceNote && (
              <div className="mt-2 pt-2 border-t border-[#DCC9AD]/40 text-xs text-[#292821]">
                <span className="font-medium text-[#777267]">Archivist Note: </span>
                {relationship.confidenceNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
