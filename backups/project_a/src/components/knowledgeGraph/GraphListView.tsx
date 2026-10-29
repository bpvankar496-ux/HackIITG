import React, { useState } from 'react';
import { HeritageEntity, HeritageRelationship } from '../../types/knowledgeGraph';
import { ENTITY_COLORS, getEntityIcon } from './GraphLegend';
import { ArrowRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

interface GraphListViewProps {
  entities: HeritageEntity[];
  relationships: HeritageRelationship[];
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onNavigateToSite?: (slug: string) => void;
}

export const GraphListView: React.FC<GraphListViewProps> = ({
  entities,
  relationships,
  onSelectEntity,
  onSelectRelationship,
  onNavigateToSite
}) => {
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships'>('entities');
  const entityMap = new Map(entities.map(e => [e.id, e]));

  return (
    <div className="w-full bg-white border border-[#DCC9AD] rounded-xl shadow-xs overflow-hidden">
      {/* Sub-Tabs */}
      <div className="flex border-b border-[#DCC9AD] bg-[#F8F5EF]/60 px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'entities'
              ? 'border-[#B65F43] text-[#B65F43]'
              : 'border-transparent text-[#777267] hover:text-[#292821]'
          }`}
        >
          Entities Catalogue ({entities.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('relationships')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'relationships'
              ? 'border-[#B65F43] text-[#B65F43]'
              : 'border-transparent text-[#777267] hover:text-[#292821]'
          }`}
        >
          Documented Relationships ({relationships.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-x-auto">
        {activeTab === 'entities' ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCC9AD] text-xs font-mono uppercase text-[#777267]">
                <th className="py-2.5 px-3">Entity Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Aliases</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCC9AD]/40">
              {entities.map(ent => {
                const info = ENTITY_COLORS[ent.entityType];
                return (
                  <tr key={ent.id} className="hover:bg-[#F8F5EF]/60 transition-colors">
                    <td className="py-3 px-3 font-serif font-bold text-[#292821]">
                      <button
                        onClick={() => onSelectEntity(ent.id)}
                        type="button"
                        className="hover:text-[#B65F43] text-left inline-flex items-center gap-2"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${info.dot}`} />
                        <span>{ent.name}</span>
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${info.bg} ${info.border} ${info.text}`}
                      >
                        {getEntityIcon(ent.entityType, 'w-3 h-3')}
                        {info.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-xs text-[#777267] max-w-xs truncate">
                      {ent.aliases && ent.aliases.length > 0 ? ent.aliases.join(', ') : '—'}
                    </td>

                    <td className="py-3 px-3">
                      {ent.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#667653] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#C27803] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectEntity(ent.id)}
                        type="button"
                        className="text-xs text-[#B65F43] hover:underline font-medium"
                      >
                        Details
                      </button>
                      {ent.supportingSiteSlug && onNavigateToSite && (
                        <button
                          onClick={() => onNavigateToSite(ent.supportingSiteSlug!)}
                          type="button"
                          className="text-xs text-[#292821] hover:underline font-medium inline-flex items-center gap-0.5"
                        >
                          <span>Site</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DCC9AD] text-xs font-mono uppercase text-[#777267]">
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Relationship</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Primary Source Document</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCC9AD]/40">
              {relationships.map(rel => {
                const src = entityMap.get(rel.sourceEntityId);
                const tgt = entityMap.get(rel.targetEntityId);
                if (!src || !tgt) return null;

                return (
                  <tr key={rel.id} className="hover:bg-[#F8F5EF]/60 transition-colors">
                    <td className="py-3 px-3 font-serif font-bold text-[#292821]">
                      <button
                        onClick={() => onSelectEntity(src.id)}
                        type="button"
                        className="hover:text-[#B65F43] text-left"
                      >
                        {src.name}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-xs text-[#B65F43] bg-[#B65F43]/10 px-2 py-0.5 rounded border border-[#B65F43]/30 font-medium inline-flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {rel.relationshipType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-serif font-bold text-[#292821]">
                      <button
                        onClick={() => onSelectEntity(tgt.id)}
                        type="button"
                        className="hover:text-[#B65F43] text-left"
                      >
                        {tgt.name}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-xs text-[#292821] max-w-xs">
                      <p className="font-medium truncate">{rel.supportingDocTitle}</p>
                      {rel.pageNumber && (
                        <p className="text-[11px] text-[#777267] font-mono">{rel.pageNumber}</p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-xs">
                      <span className="font-mono text-[11px] bg-gray-100 text-[#292821] px-2 py-0.5 rounded">
                        {rel.evidenceClassification.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectRelationship(rel.id)}
                        type="button"
                        className="text-xs text-[#B65F43] hover:underline font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
