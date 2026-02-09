import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FurnitureSidebar } from '@/components/planner/FurnitureSidebar';
import { PlannerCanvas } from '@/components/planner/PlannerCanvas';
import { FurnitureDetailPanel } from '@/components/planner/FurnitureDetailPanel';
import { RoomSettingsDialog } from '@/components/planner/RoomSettingsDialog';
import { QuoteSummary } from '@/components/planner/QuoteSummary';
import { ConsultationDialog } from '@/components/planner/ConsultationDialog';
import { usePlannerState } from '@/hooks/usePlannerState';
import { FurnitureItem } from '@/types/planner';
import ggiLogo from '@/assets/ggi-logo-new.png';

const SpacePlanner = () => {
  const {
    roomDimensions,
    setRoomDimensions,
    placedFurniture,
    selectedId,
    setSelectedId,
    selectedFurniture,
    scale,
    setScale,
    addFurniture,
    updateFurniturePosition,
    rotateFurniture,
    removeFurniture,
    clearAll,
    getTotalPrice,
  } = usePlannerState();

  const [consultationOpen, setConsultationOpen] = useState(false);
  const [, setDraggingFurniture] = useState<FurnitureItem | null>(null);

  const handleDragStart = useCallback((furniture: FurnitureItem) => {
    setDraggingFurniture(furniture);
  }, []);

  const handleDrop = useCallback((furniture: FurnitureItem, x: number, y: number) => {
    addFurniture(furniture, x, y);
    setDraggingFurniture(null);
  }, [addFurniture]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 0.3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.05));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 bg-primary text-primary-foreground px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <img src={ggiLogo} alt="GGI" className="h-8" />
          </Link>
          <div className="h-6 w-px bg-primary-foreground/30" />
          <h1 className="font-bold text-lg">공간 스타일링 시뮬레이터</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <RoomSettingsDialog
            roomDimensions={roomDimensions}
            onSave={setRoomDimensions}
          />
          <div className="flex items-center gap-1 bg-primary-foreground/10 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2 min-w-[50px] text-center">
              {Math.round(scale * 1000)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Furniture Categories */}
        <FurnitureSidebar onDragStart={handleDragStart} />

        {/* Center - Canvas */}
        <PlannerCanvas
          roomDimensions={roomDimensions}
          placedFurniture={placedFurniture}
          selectedId={selectedId}
          scale={scale}
          onDrop={handleDrop}
          onSelect={setSelectedId}
          onMove={updateFurniturePosition}
        />

        {/* Right Panel - Details */}
        <FurnitureDetailPanel
          selectedFurniture={selectedFurniture}
          onRotate={rotateFurniture}
          onDelete={removeFurniture}
          onClose={() => setSelectedId(null)}
        />
      </div>

      {/* Bottom - Quote Summary */}
      <QuoteSummary
        placedFurniture={placedFurniture}
        totalPrice={getTotalPrice()}
        onClearAll={clearAll}
        onConsultation={() => setConsultationOpen(true)}
      />

      {/* Consultation Dialog */}
      <ConsultationDialog
        open={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        placedFurniture={placedFurniture}
        totalPrice={getTotalPrice()}
      />
    </div>
  );
};

export default SpacePlanner;
