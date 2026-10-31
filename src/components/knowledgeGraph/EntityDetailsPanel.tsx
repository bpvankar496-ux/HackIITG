import React from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Clock, BookOpen, Quote } from 'lucide-react';
import { HeritageEntity, HeritageRelationship } from '../../types/knowledgeGraph';
import { ENTITY_COLORS, getEntityIcon } from './GraphLegend';

interface EntityDetailsPanelProps {
  entity: HeritageEntity | null;
  relationships: HeritageRelationship[];
  allEntities: HeritageEntity[];
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onNavigateToSite?: (slug: string) => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  entity,
  relationships,
  allEntities,
  onClose,
  onSelectEntity,
  onSelectRelationship,
  onNavigateToSite
}) => {
  if (!entity) return null;

  const colorInfo = ENTITY_COLORS[entity.entityType];

  // Outgoing relationships: entity is source
  const outgoing = relationships.filter(r => r.sourceEntityId === entity.id);
  // Incoming relationships: entity is target
  const incoming = relationships.filter(r => r.targetEntityId === entity.id);

  const entityMap = new Map(allEntities.map(e => [e.id, e]));

  return (
    <aside
      className="absolute top-0 right-0 bottom-0 w-full sm:w-96 max-w-full bg-white/95 backdrop-blur-md border-l border-[#DCC9AD] shadow-xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      aria-labelledby="entity-panel-title"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#DCC9AD] bg-[#F8F5EF]/70 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorInfo.bg} ${colorInfo.border} ${colorInfo.text}`}
            >
              {getEntityIcon(entity.entityType, 'w-3 h-3')}
              {colorInfo.label}
            </span>

            {entity.verificationStatus === 'verified' ? (
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

          <h2 id="entity-panel-title" className="font-serif text-2xl font-bold text-[#292821] leading-tight">
            {entity.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          type="button"
          aria-label="Close entity details"
          className="p-1.5 rounded-lg text-[#777267] hover:text-[#292821] hover:bg-black/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267] mb-1.5">
            Archival Summary
          </h3>
          <p className="text-[#292821] leading-relaxed font-sans bg-[#F8F5EF]/40 p-3 rounded-lg border border-[#DCC9AD]/40">
            {entity.description}
          </p>
        </div>

        {/* Aliases */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267] mb-1.5">
              Documented Aliases & Alternate Spellings
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.aliases.map((alias, idx) => (
                <span
                  key={`${alias}-${idx}`}
                  className="px-2.5 py-1 text-xs bg-[#F8F5EF] text-[#292821] rounded-md border border-[#DCC9AD]"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Heritage Site Link */}
        {entity.supportingSiteSlug && onNavigateToSite && (
          <div className="p-3 bg-[#B65F43]/10 border border-[#B65F43]/30 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-serif font-bold text-[#292821] text-sm">
                Archival Record in Virasat Quest
              </p>
              <p className="text-xs text-[#777267]">
                View complete site dossier, 3D model, and photography
              </p>
            </div>
            <button
              onClick={() => onNavigateToSite(entity.supportingSiteSlug!)}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded transition-colors shadow-xs"
            >
              <span>Details</span>
            </button>
          </div>
        )}

        {/* Connected Outgoing Relationships */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267]">
              Outgoing Connections ({outgoing.length})
            </h3>
          </div>

          {outgoing.length === 0 ? (
            <p className="text-xs text-[#777267] italic">No documented outgoing connections.</p>
          ) : (
            <ul className="space-y-2">
              {outgoing.map(rel => {
                const target = entityMap.get(rel.targetEntityId);
                if (!target) return null;
                const targetColor = ENTITY_COLORS[target.entityType];

                return (
                  <li
                    key={rel.id}
                    className="p-2.5 bg-[#F8F5EF]/60 rounded-lg border border-[#DCC9AD] hover:border-[#B65F43] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[#B65F43] font-medium flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {rel.relationshipType.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => onSelectRelationship(rel.id)}
                        type="button"
                        className="text-[11px] text-[#777267] underline hover:text-[#B65F43]"
                      >
                        Inspect Evidence
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectEntity(target.id)}
                      type="button"
                      className="mt-1.5 w-full text-left font-serif font-bold text-[#292821] group-hover:text-[#B65F43] flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${targetColor.dot}`} />
                        {target.name}
                      </span>
                      <span className="text-[10px] text-[#777267] uppercase font-sans">
                        {targetColor.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Connected Incoming Relationships */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267]">
              Incoming Connections ({incoming.length})
            </h3>
          </div>

          {incoming.length === 0 ? (
            <p className="text-xs text-[#777267] italic">No documented incoming connections.</p>
          ) : (
            <ul className="space-y-2">
              {incoming.map(rel => {
                const source = entityMap.get(rel.sourceEntityId);
                if (!source) return null;
                const sourceColor = ENTITY_COLORS[source.entityType];

                return (
                  <li
                    key={rel.id}
                    className="p-2.5 bg-[#F8F5EF]/60 rounded-lg border border-[#DCC9AD] hover:border-[#B65F43] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[#667653] font-medium flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" />
                        is {rel.relationshipType.replace(/_/g, ' ')} of
                      </span>
                      <button
                        onClick={() => onSelectRelationship(rel.id)}
                        type="button"
                        className="text-[11px] text-[#777267] underline hover:text-[#B65F43]"
                      >
                        Inspect Evidence
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectEntity(source.id)}
                      type="button"
                      className="mt-1.5 w-full text-left font-serif font-bold text-[#292821] group-hover:text-[#B65F43] flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${sourceColor.dot}`} />
                        {source.name}
                      </span>
                      <span className="text-[10px] text-[#777267] uppercase font-sans">
                        {sourceColor.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};
