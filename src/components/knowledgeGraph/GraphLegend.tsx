import React from 'react';
import { EntityType } from '../../types/knowledgeGraph';
import { Landmark, User, MapPin, History, Calendar, Columns, Scroll } from 'lucide-react';

export const ENTITY_COLORS: Record<EntityType, { bg: string; border: string; text: string; fill: string; dot: string; label: string }> = {
  heritage_site: {
    bg: 'bg-[#B65F43]/15',
    border: 'border-[#B65F43]',
    text: 'text-[#B65F43]',
    fill: '#B65F43',
    dot: 'bg-[#B65F43]',
    label: 'Heritage Site'
  },
  person: {
    bg: 'bg-[#C27803]/15',
    border: 'border-[#C27803]',
    text: 'text-[#C27803]',
    fill: '#C27803',
    dot: 'bg-[#C27803]',
    label: 'Person / Patron'
  },
  place: {
    bg: 'bg-[#2E7969]/15',
    border: 'border-[#2E7969]',
    text: 'text-[#2E7969]',
    fill: '#2E7969',
    dot: 'bg-[#2E7969]',
    label: 'Place / Region'
  },
  historical_period: {
    bg: 'bg-[#4A5568]/15',
    border: 'border-[#4A5568]',
    text: 'text-[#4A5568]',
    fill: '#4A5568',
    dot: 'bg-[#4A5568]',
    label: 'Historical Period'
  },
  event: {
    bg: 'bg-[#A63446]/15',
    border: 'border-[#A63446]',
    text: 'text-[#A63446]',
    fill: '#A63446',
    dot: 'bg-[#A63446]',
    label: 'Documented Event'
  },
  architectural_style: {
    bg: 'bg-[#667653]/15',
    border: 'border-[#667653]',
    text: 'text-[#667653]',
    fill: '#667653',
    dot: 'bg-[#667653]',
    label: 'Architectural Style'
  },
  document: {
    bg: 'bg-[#8C7355]/15',
    border: 'border-[#8C7355]',
    text: 'text-[#8C7355]',
    fill: '#8C7355',
    dot: 'bg-[#8C7355]',
    label: 'Archival Document'
  }
};

export function getEntityIcon(type: EntityType, className = 'w-4 h-4') {
  switch (type) {
    case 'heritage_site':
      return <Landmark className={className} />;
    case 'person':
      return <User className={className} />;
    case 'place':
      return <MapPin className={className} />;
    case 'historical_period':
      return <History className={className} />;
    case 'event':
      return <Calendar className={className} />;
    case 'architectural_style':
      return <Columns className={className} />;
    case 'document':
      return <Scroll className={className} />;
    default:
      return <Landmark className={className} />;
  }
}

interface GraphLegendProps {
  counts?: Partial<Record<EntityType, number>>;
  selectedTypes: EntityType[];
  onToggleType: (type: EntityType) => void;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ counts = {}, selectedTypes, onToggleType }) => {
  const types: EntityType[] = [
    'heritage_site',
    'person',
    'place',
    'historical_period',
    'event',
    'architectural_style',
    'document'
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium text-[#777267] uppercase tracking-wider text-[11px] mr-1">Legend:</span>
      {types.map(t => {
        const info = ENTITY_COLORS[t];
        const isSelected = selectedTypes.length === 0 || selectedTypes.includes(t);
        const count = counts[t] ?? 0;

        return (
          <button
            key={t}
            onClick={() => onToggleType(t)}
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              isSelected
                ? `${info.bg} ${info.border} ${info.text} font-medium shadow-xs`
                : 'bg-white/60 border-gray-200 text-gray-400 opacity-60 hover:opacity-90'
            }`}
            title={`Toggle ${info.label}`}
          >
            <span className={`w-2 h-2 rounded-full ${info.dot}`} />
            {getEntityIcon(t, 'w-3.5 h-3.5')}
            <span>{info.label}</span>
            {count > 0 && (
              <span className="ml-0.5 text-[10px] opacity-75 font-mono">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
