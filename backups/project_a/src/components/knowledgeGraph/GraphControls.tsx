import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Play, Pause, Download, Compass } from 'lucide-react';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitView: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onExportJson?: () => void;
  currentZoom?: number;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitView,
  isSimulating,
  onToggleSimulation,
  onExportJson,
  currentZoom = 1
}) => {
  return (
    <div
      className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-[#DCC9AD] shadow-md"
      role="toolbar"
      aria-label="Graph navigation controls"
    >
      <button
        onClick={onZoomIn}
        type="button"
        title="Zoom in"
        aria-label="Zoom in"
        className="p-2 text-[#292821] hover:bg-[#F8F5EF] hover:text-[#B65F43] rounded transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <span className="text-[10px] font-mono text-[#777267] px-1 select-none">
        {Math.round(currentZoom * 100)}%
      </span>

      <button
        onClick={onZoomOut}
        type="button"
        title="Zoom out"
        aria-label="Zoom out"
        className="p-2 text-[#292821] hover:bg-[#F8F5EF] hover:text-[#B65F43] rounded transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="w-5 h-px bg-[#DCC9AD]/60 my-0.5" />

      <button
        onClick={onResetView}
        type="button"
        title="Reset view to default"
        aria-label="Reset view to default"
        className="p-2 text-[#292821] hover:bg-[#F8F5EF] hover:text-[#B65F43] rounded transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <button
        onClick={onFitView}
        type="button"
        title="Fit all nodes to screen"
        aria-label="Fit all nodes to screen"
        className="p-2 text-[#292821] hover:bg-[#F8F5EF] hover:text-[#B65F43] rounded transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="w-5 h-px bg-[#DCC9AD]/60 my-0.5" />

      <button
        onClick={onToggleSimulation}
        type="button"
        title={isSimulating ? 'Pause physics layout' : 'Resume physics layout'}
        aria-label={isSimulating ? 'Pause physics layout' : 'Resume physics layout'}
        className={`p-2 rounded transition-colors ${
          isSimulating
            ? 'text-[#667653] hover:bg-[#667653]/15'
            : 'text-[#C27803] hover:bg-[#C27803]/15'
        }`}
      >
        {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      {onExportJson && (
        <button
          onClick={onExportJson}
          type="button"
          title="Export graph as archival JSON"
          aria-label="Export graph as archival JSON"
          className="p-2 text-[#292821] hover:bg-[#F8F5EF] hover:text-[#B65F43] rounded transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
