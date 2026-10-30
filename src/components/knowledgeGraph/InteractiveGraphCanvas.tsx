import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HeritageEntity, HeritageRelationship, GraphNode, GraphEdge } from '../../types/knowledgeGraph';
import { ENTITY_COLORS } from './GraphLegend';

interface InteractiveGraphCanvasProps {
  entities: HeritageEntity[];
  relationships: HeritageRelationship[];
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  searchQuery: string;
  onSelectEntity: (entityId: string) => void;
  onSelectRelationship: (relationshipId: string) => void;
  onClearSelection: () => void;
  isSimulating: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (newZoom: number) => void;
  onPanChange: (newPan: { x: number; y: number }) => void;
}

export const InteractiveGraphCanvas: React.FC<InteractiveGraphCanvasProps> = ({
  entities,
  relationships,
  selectedEntityId,
  selectedRelationshipId,
  searchQuery,
  onSelectEntity,
  onSelectRelationship,
  onClearSelection,
  isSimulating,
  zoom,
  pan,
  onZoomChange,
  onPanChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, GraphNode>>(new Map());
  const [nodesList, setNodesList] = useState<GraphNode[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Dragging state
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Initialize or update node positions
  useEffect(() => {
    const currentMap = nodesRef.current;
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    const newMap = new Map<string, GraphNode>();
    const total = entities.length;

    entities.forEach((ent, index) => {
      const existing = currentMap.get(ent.id);
      if (existing) {
        newMap.set(ent.id, {
          ...ent,
          x: existing.x,
          y: existing.y,
          vx: existing.vx || 0,
          vy: existing.vy || 0,
          fx: existing.fx,
          fy: existing.fy
        });
      } else {
        // Arrange initially in radial layout
        const angle = (index / Math.max(1, total)) * 2 * Math.PI;
        const radius = 160 + (index % 3) * 60;
        newMap.set(ent.id, {
          ...ent,
          x: cx + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
          y: cy + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0
        });
      }
    });

    nodesRef.current = newMap;
    setNodesList(Array.from(newMap.values()));
  }, [entities]);

  // Force-directed simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    let animId: number;
    let iteration = 0;

    const stepSimulation = () => {
      const nodes = Array.from(nodesRef.current.values());
      if (nodes.length === 0) return;

      const width = containerRef.current?.clientWidth || 900;
      const height = containerRef.current?.clientHeight || 600;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Repulsion between nodes (Coulomb force)
      const kRepel = 4000;
      for (let i = 0; i < nodes.length; i++) {
        const u = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const v = nodes[j];
          const dx = (u.x || 0) - (v.x || 0);
          const dy = (u.y || 0) - (v.y || 0);
          const distSq = dx * dx + dy * dy + 100;
          const dist = Math.sqrt(distSq);
          const force = kRepel / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!u.fx) {
            u.vx = (u.vx || 0) + fx;
            u.vy = (u.vy || 0) + fy;
          }
          if (!v.fx) {
            v.vx = (v.vx || 0) - fx;
            v.vy = (v.vy || 0) - fy;
          }
        }
      }

      // 2. Spring attraction along relationships (Hooke's law)
      const kSpring = 0.04;
      const idealLength = 140;

      for (const rel of relationships) {
        const u = nodesRef.current.get(rel.sourceEntityId);
        const v = nodesRef.current.get(rel.targetEntityId);
        if (!u || !v) continue;

        const dx = (v.x || 0) - (u.x || 0);
        const dy = (v.y || 0) - (u.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - idealLength;
        const force = displacement * kSpring;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!u.fx) {
          u.vx = (u.vx || 0) + fx;
          u.vy = (u.vy || 0) + fy;
        }
        if (!v.fx) {
          v.vx = (v.vx || 0) - fx;
          v.vy = (v.vy || 0) - fy;
        }
      }

      // 3. Center gravity force
      const kCenter = 0.008;
      for (const node of nodes) {
        if (!node.fx) {
          const dx = cx - (node.x || 0);
          const dy = cy - (node.y || 0);
          node.vx = (node.vx || 0) + dx * kCenter;
          node.vy = (node.vy || 0) + dy * kCenter;
        }
      }

      // 4. Update positions with damping
      const damping = 0.85;
      for (const node of nodes) {
        if (!node.fx && draggedNodeRef.current?.id !== node.id) {
          node.vx = (node.vx || 0) * damping;
          node.vy = (node.vy || 0) * damping;
          node.x = (node.x || 0) + (node.vx || 0);
          node.y = (node.y || 0) + (node.vy || 0);
        }
      }

      iteration++;
      if (iteration % 2 === 0) {
        setNodesList([...nodes]);
      }

      animId = requestAnimationFrame(stepSimulation);
    };

    animId = requestAnimationFrame(stepSimulation);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, relationships]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.5);
    onZoomChange(newZoom);
  };

  // Canvas Pan & Node Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvasRef.current) {
      onPanChange({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
      return;
    }

    if (draggedNodeRef.current) {
      const node = draggedNodeRef.current;
      // Convert screen coordinate to graph canvas space
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      node.x = mouseX;
      node.y = mouseY;
      node.fx = mouseX;
      node.fy = mouseY;
      setNodesList(Array.from(nodesRef.current.values()));
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    if (draggedNodeRef.current) {
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
    }
  };

  const startNodeDrag = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    draggedNodeRef.current = node;
  };

  // Search match determination
  const isSearchMatch = useCallback(
    (node: HeritageEntity) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return false;
      return (
        node.name.toLowerCase().includes(q) ||
        (node.aliases || []).some(a => a.toLowerCase().includes(q))
      );
    },
    [searchQuery]
  );

  // Active neighborhood calculation
  const connectedIds = React.useMemo(() => {
    if (!selectedEntityId) return null;
    const set = new Set<string>();
    set.add(selectedEntityId);
    for (const rel of relationships) {
      if (rel.sourceEntityId === selectedEntityId) set.add(rel.targetEntityId);
      if (rel.targetEntityId === selectedEntityId) set.add(rel.sourceEntityId);
    }
    return set;
  }, [selectedEntityId, relationships]);

  const nodeMap = new Map(nodesList.map(n => [n.id, n]));

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#F8F5EF]"
      style={{
        backgroundImage: 'radial-gradient(#DCC9AD 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px'
      }}
      role="region"
      aria-label="Interactive Heritage Knowledge Graph Canvas"
    >
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          {/* Arrow markers for directed relationships */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B65F43" />
          </marker>
          <marker
            id="arrow-hover"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#9A4B32" />
          </marker>
          <marker
            id="arrow-dim"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DCC9AD" />
          </marker>
        </defs>

        {/* 1. Edges / Relationships */}
        <g className="edges-layer">
          {relationships.map(rel => {
            const source = nodeMap.get(rel.sourceEntityId);
            const target = nodeMap.get(rel.targetEntityId);
            if (!source || !target || source.x == null || target.x == null || source.y == null || target.y == null) return null;

            const isSelected = selectedRelationshipId === rel.id;
            const isEdgeHovered = hoveredEdgeId === rel.id;
            const isConnectedToActiveNode =
              selectedEntityId === rel.sourceEntityId ||
              selectedEntityId === rel.targetEntityId;

            const isDimmed =
              (selectedEntityId && !isConnectedToActiveNode) ||
              (selectedRelationshipId && !isSelected);

            // Compute midpoint for relationship label
            const mx = (source.x + target.x) / 2;
            const my = (source.y + target.y) / 2;

            return (
              <g
                key={rel.id}
                onClick={e => {
                  e.stopPropagation();
                  onSelectRelationship(rel.id);
                }}
                onMouseEnter={() => setHoveredEdgeId(rel.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                className="cursor-pointer group"
              >
                {/* Invisible wider stroke for easier clicking */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Visible line */}
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={
                    isSelected
                      ? '#B65F43'
                      : isEdgeHovered
                      ? '#9A4B32'
                      : isConnectedToActiveNode
                      ? '#B65F43'
                      : isDimmed
                      ? '#DCC9AD'
                      : '#8C7355'
                  }
                  strokeWidth={isSelected || isEdgeHovered ? 2.5 : isConnectedToActiveNode ? 2 : 1.2}
                  strokeDasharray={rel.verificationStatus === 'pending' ? '4 3' : 'none'}
                  markerEnd={isDimmed ? 'url(#arrow-dim)' : isSelected || isEdgeHovered ? 'url(#arrow-hover)' : 'url(#arrow)'}
                  opacity={isDimmed ? 0.25 : 0.85}
                  className="transition-all"
                />

                {/* Relationship Text Label on Midpoint */}
                {(isSelected || isEdgeHovered || isConnectedToActiveNode || zoom >= 0.85) && (
                  <g transform={`translate(${mx}, ${my})`} opacity={isDimmed ? 0.2 : 1}>
                    <rect
                      x="-48"
                      y="-9"
                      width="96"
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke={isSelected ? '#B65F43' : '#DCC9AD'}
                      strokeWidth="1"
                      className="shadow-2xs"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className="text-[9.5px] font-mono fill-[#292821] font-medium pointer-events-none select-none"
                    >
                      {rel.relationshipType.replace(/_/g, ' ')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 2. Nodes / Entities */}
        <g className="nodes-layer">
          {nodesList.map(node => {
            if (node.x == null || node.y == null) return null;

            const isSelected = selectedEntityId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const match = isSearchMatch(node);
            const isDimmed = connectedIds && !connectedIds.has(node.id) && !match;
            const colorInfo = ENTITY_COLORS[node.entityType];

            const nodeRadius = isSelected ? 22 : isHovered ? 20 : 17;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={e => {
                  e.stopPropagation();
                  onSelectEntity(node.id);
                }}
                onMouseDown={e => startNodeDrag(node, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
                opacity={isDimmed ? 0.25 : 1}
              >
                {/* Search Match Pulsing Ring */}
                {match && (
                  <circle
                    r={nodeRadius + 10}
                    fill="none"
                    stroke="#C27803"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Selection Aura */}
                {isSelected && (
                  <circle
                    r={nodeRadius + 7}
                    fill={colorInfo.fill}
                    fillOpacity="0.2"
                    stroke={colorInfo.fill}
                    strokeWidth="2"
                  />
                )}

                {/* Outer Node Circle */}
                <circle
                  r={nodeRadius}
                  fill="#FFFFFF"
                  stroke={isSelected ? colorInfo.fill : isHovered ? '#292821' : colorInfo.fill}
                  strokeWidth={isSelected ? 3.5 : 2}
                  className="shadow-md transition-all"
                />

                {/* Inner Color Dot */}
                <circle
                  r={nodeRadius - 5}
                  fill={colorInfo.fill}
                  fillOpacity="0.85"
                />

                {/* Center Badge Dot / Symbol */}
                <circle
                  r="3.5"
                  fill="#FFFFFF"
                />

                {/* Verification pending indicator (amber pip) */}
                {node.verificationStatus === 'pending' && (
                  <circle
                    cx={nodeRadius - 3}
                    cy={-nodeRadius + 3}
                    r="4"
                    fill="#C27803"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* Label Text */}
                <text
                  y={nodeRadius + 14}
                  textAnchor="middle"
                  className={`text-[11.5px] select-none pointer-events-none font-medium ${
                    isSelected
                      ? 'fill-[#B65F43] font-bold font-serif text-[13px]'
                      : 'fill-[#292821] font-sans'
                  }`}
                  style={{
                    textShadow: '0 1px 3px rgba(255,255,255,0.9), 0 -1px 3px rgba(255,255,255,0.9)'
                  }}
                >
                  {node.name.length > 24 ? node.name.slice(0, 22) + '…' : node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNodeId && (
        (() => {
          const hovered = nodeMap.get(hoveredNodeId);
          if (!hovered) return null;
          const info = ENTITY_COLORS[hovered.entityType];

          return (
            <div
              className="absolute top-4 left-4 z-20 pointer-events-none bg-white/95 backdrop-blur-md p-3 rounded-lg border border-[#DCC9AD] shadow-lg max-w-xs text-xs space-y-1 animate-in fade-in duration-100"
            >
              <div className="flex items-center gap-1.5 font-bold font-serif text-sm text-[#292821]">
                <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                {hovered.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-[#777267]">
                <span>{info.label}</span>
                <span>•</span>
                <span className={hovered.verificationStatus === 'verified' ? 'text-[#667653]' : 'text-[#C27803]'}>
                  {hovered.verificationStatus}
                </span>
              </div>
              <p className="text-[11px] text-[#292821] line-clamp-2 leading-relaxed">
                {hovered.description}
              </p>
            </div>
          );
        })()
      )}
    </div>
  );
};
