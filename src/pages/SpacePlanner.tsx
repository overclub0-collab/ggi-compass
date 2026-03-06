import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Box, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FurnitureSidebar } from '@/components/planner/FurnitureSidebar';
import { PlannerCanvas } from '@/components/planner/PlannerCanvas';
import { PlannerCanvas3D } from '@/components/planner/PlannerCanvas3D';
import { FurnitureDetailPanel } from '@/components/planner/FurnitureDetailPanel';
import { RoomSettingsDialog } from '@/components/planner/RoomSettingsDialog';
import { QuoteSummary } from '@/components/planner/QuoteSummary';
import { ConsultationDialog } from '@/components/planner/ConsultationDialog';
import { ArchitecturalSettingsPanel, DEFAULT_ARCHITECTURAL_CONFIG, ArchitecturalConfig } from '@/components/planner/ArchitecturalSettingsPanel';
import { PlannerStartScreen } from '@/components/planner/PlannerStartScreen';
import { usePlannerState } from '@/hooks/usePlannerState';
import { FurnitureItem, RoomDimensions } from '@/types/planner';
import ggiLogo from '@/assets/ggi-logo-new.png';

const SpacePlanner = () => {
  const {
    roomDimensions, setRoomDimensions,
    placedFurniture, selectedId, setSelectedId, selectedFurniture,
    scale, setScale,
    addFurniture, updateFurniturePosition,
    rotateFurniture, changeFurnitureColor, removeFurniture,
    clearAll, getTotalPrice,
  } = usePlannerState();

  const [started, setStarted] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [, setDraggingFurniture] = useState<FurnitureItem | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [archConfig, setArchConfig] = useState<ArchitecturalConfig>(DEFAULT_ARCHITECTURAL_CONFIG);

  const pinnedFurniture = pinnedId ? placedFurniture.find(f => f.id === pinnedId) : undefined;

  const handleStart = useCallback((mode: 'template' | 'free', dimensions?: RoomDimensions) => {
    if (dimensions) setRoomDimensions(dimensions);
    setStarted(true);
  }, [setRoomDimensions]);

  const handleDragStart = useCallback((furniture: FurnitureItem) => {
    setDraggingFurniture(furniture);
  }, []);

  const handleDrop = useCallback((furniture: FurnitureItem, x: number, y: number) => {
    addFurniture(furniture, x, y);
    setDraggingFurniture(null);
  }, [addFurniture]);

  const handleRightClickSelect = useCallback((id: string) => {
    setPinnedId(prev => prev === id ? null : id);
  }, []);

  const handleUnpin = useCallback(() => {
    setPinnedId(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    removeFurniture(id);
    if (pinnedId === id) setPinnedId(null);
  }, [removeFurniture, pinnedId]);

  // Left-click select — DON'T clear if something is pinned
  const handleSelect = useCallback((id: string | null) => {
    if (id === null && pinnedId) return;
    setSelectedId(id);
  }, [setSelectedId, pinnedId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 0.3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.05));

  // Show start screen if not started
  if (!started) {
    return <PlannerStartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 bg-[#0A1931] text-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <img src={ggiLogo} alt="GGI" className="h-8" />
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <h1 className="font-bold text-lg">3D 인테리어</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <Button
              variant="ghost" size="sm"
              onClick={() => setViewMode('2d')}
              className={`h-8 px-3 text-xs font-bold gap-1 ${viewMode === '2d' ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/10'}`}
            >
              <Layers className="h-3.5 w-3.5" />2D
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-8 px-3 text-xs font-bold gap-1 ${viewMode === '3d' ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/10'}`}
            >
              <Box className="h-3.5 w-3.5" />3D
            </Button>
          </div>

          <RoomSettingsDialog roomDimensions={roomDimensions} onSave={setRoomDimensions} />
          
          <div className="relative">
            <ArchitecturalSettingsPanel config={archConfig} onChange={setArchConfig} />
          </div>

          {viewMode === '2d' && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8 text-white hover:bg-white/20">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs px-2 min-w-[50px] text-center">{Math.round(scale * 1000)}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8 text-white hover:bg-white/20">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <FurnitureSidebar onDragStart={handleDragStart} />

        {viewMode === '2d' ? (
          <PlannerCanvas
            roomDimensions={roomDimensions}
            placedFurniture={placedFurniture}
            selectedId={selectedId}
            scale={scale}
            onDrop={handleDrop}
            onSelect={handleSelect}
            onMove={updateFurniturePosition}
          />
        ) : (
          <PlannerCanvas3D
            roomDimensions={roomDimensions}
            placedFurniture={placedFurniture}
            selectedId={selectedId}
            scale={scale}
            onSelect={handleSelect}
            onRightClickSelect={handleRightClickSelect}
            architecturalConfig={archConfig}
          />
        )}

        <FurnitureDetailPanel
          selectedFurniture={selectedFurniture}
          pinnedFurniture={pinnedFurniture}
          onRotate={rotateFurniture}
          onDelete={handleDelete}
          onClose={() => { setSelectedId(null); setPinnedId(null); }}
          onUnpin={handleUnpin}
          onColorChange={changeFurnitureColor}
        />
      </div>

      {/* Brand Trust Badges */}
      <div className="h-8 bg-[#0A1931]/5 border-t border-border flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="font-medium">✅ 여성기업 인증</span>
        <span className="font-medium">🏛️ 나라장터 조달 등록</span>
        <span className="font-medium">📋 GGI 3D 인테리어</span>
      </div>

      <QuoteSummary
        placedFurniture={placedFurniture}
        totalPrice={getTotalPrice()}
        onClearAll={clearAll}
        onConsultation={() => setConsultationOpen(true)}
      />

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
