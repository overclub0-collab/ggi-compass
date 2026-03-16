import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Box, Layers, Sun, Footprints, Menu, X, Monitor } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlannerLeftPanel } from '@/components/planner/PlannerLeftPanel';
import { PlannerCanvas } from '@/components/planner/PlannerCanvas';
import { PlannerCanvas3D } from '@/components/planner/PlannerCanvas3D';
import { FurnitureDetailPanel } from '@/components/planner/FurnitureDetailPanel';
import { QuoteSummary } from '@/components/planner/QuoteSummary';
import { ConsultationDialog } from '@/components/planner/ConsultationDialog';
import { DEFAULT_ARCHITECTURAL_CONFIG, ArchitecturalConfig } from '@/components/planner/ArchitecturalSettingsPanel';
import { PlannerStartScreen } from '@/components/planner/PlannerStartScreen';
import { usePlannerState } from '@/hooks/usePlannerState';
import { useIsMobile } from '@/hooks/use-mobile';
import { FurnitureItem, RoomDimensions } from '@/types/planner';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const SpacePlanner = () => {
  const {
    roomDimensions, setRoomDimensions,
    placedFurniture, selectedId, setSelectedId, selectedFurniture,
    scale, setScale,
    addFurniture, updateFurniturePosition,
    rotateFurniture, changeFurnitureColor, removeFurniture,
    clearAll, getTotalPrice,
  } = usePlannerState();

  const isMobile = useIsMobile();
  const [started, setStarted] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [fpsMode, setFpsMode] = useState(false);
  const [, setDraggingFurniture] = useState<FurnitureItem | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [archConfig, setArchConfig] = useState<ArchitecturalConfig>(DEFAULT_ARCHITECTURAL_CONFIG);
  const [hdriPreset, setHdriPreset] = useState<'apartment' | 'studio' | 'warehouse' | 'city' | 'sunset' | 'forest'>('apartment');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pinnedFurniture = pinnedId ? placedFurniture.find(f => f.id === pinnedId) : undefined;

  const handleStart = useCallback((mode: 'template' | 'free', dimensions?: RoomDimensions, templateArchConfig?: ArchitecturalConfig) => {
    if (dimensions) setRoomDimensions(dimensions);
    if (templateArchConfig) setArchConfig(templateArchConfig);
    setStarted(true);
  }, [setRoomDimensions]);

  const handleDragStart = useCallback((furniture: FurnitureItem) => {
    setDraggingFurniture(furniture);
    if (isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

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

  const handleSelect = useCallback((id: string | null) => {
    if (id === null) return;
    setSelectedId(id);
  }, [setSelectedId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 0.3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.05));

  const navigate = useNavigate();
  const [showPcOnlyModal, setShowPcOnlyModal] = useState(false);

  // Block access on screens < 1024px
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setShowPcOnlyModal(true);
    }
  }, []);

  if (showPcOnlyModal) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Monitor className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">PC 환경에서 이용해 주세요</h1>
          <p className="text-muted-foreground leading-relaxed">
            본 서비스는 고사양 3D 렌더링 및 정밀 설계를 위해
            PC 환경에 최적화되어 있습니다.
            <br />
            원활한 사용을 위해 PC 버전을 이용해 주세요.
          </p>
          <Button onClick={() => navigate('/')} className="px-8">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return <PlannerStartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-[#0A1931] text-white px-2 sm:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {isMobile && (
            <Button
              variant="ghost" size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="h-8 w-8 text-white hover:bg-white/10"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-1 sm:gap-2">
            <ArrowLeft className="h-4 w-4" />
            <img src={ggiLogo} alt="GGI" className="h-6 sm:h-7" />
          </Link>
          <div className="h-5 w-px bg-white/20 hidden sm:block" />
          <h1 className="font-bold text-xs sm:text-sm hidden sm:block">3D 인테리어</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <Button
              variant="ghost" size="sm"
              onClick={() => { setViewMode('2d'); setFpsMode(false); }}
              className={`h-7 px-2 sm:px-2.5 text-xs font-bold gap-1 ${viewMode === '2d' ? 'bg-white/25 text-white' : 'text-white/60'}`}
            >
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">2D</span>
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-7 px-2 sm:px-2.5 text-xs font-bold gap-1 ${viewMode === '3d' ? 'bg-white/25 text-white' : 'text-white/60'}`}
            >
              <Box className="h-3 w-3" />
              <span className="hidden sm:inline">3D</span>
            </Button>
          </div>

          {/* Zoom controls — 2D only, desktop only */}
          {viewMode === '2d' && !isMobile && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-7 w-7 text-white">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] px-1.5 min-w-[40px] text-center">{Math.round(scale * 1000)}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-7 w-7 text-white">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* FPS mode toggle — 3D only, desktop only */}
          {viewMode === '3d' && !isMobile && (
            <Button
              variant="ghost" size="sm"
              onClick={() => setFpsMode(prev => !prev)}
              className={`h-7 px-2.5 text-xs font-bold gap-1 ${fpsMode ? 'bg-amber-500/30 text-amber-200' : 'text-white/60 bg-white/10'}`}
            >
              <Footprints className="h-3 w-3" />
              {fpsMode ? '1인칭' : '워크스루'}
            </Button>
          )}

          {/* HDRI Environment Preset — 3D only, desktop only */}
          {viewMode === '3d' && !isMobile && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-0.5">
              <Sun className="h-3.5 w-3.5 text-white/70" />
              <Select value={hdriPreset} onValueChange={(v) => setHdriPreset(v as typeof hdriPreset)}>
                <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent text-white text-xs px-1.5 focus:ring-0 focus:ring-offset-0 [&>span]:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">🏠 Apartment</SelectItem>
                  <SelectItem value="studio">💡 Studio</SelectItem>
                  <SelectItem value="warehouse">🏭 Warehouse</SelectItem>
                  <SelectItem value="city">🌆 City</SelectItem>
                  <SelectItem value="sunset">🌅 Sunset</SelectItem>
                  <SelectItem value="forest">🌲 Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop: inline sidebar */}
        {!isMobile && (
          <PlannerLeftPanel
            roomDimensions={roomDimensions}
            onRoomDimensionsChange={setRoomDimensions}
            archConfig={archConfig}
            onArchConfigChange={setArchConfig}
            onDragStart={handleDragStart}
          />
        )}

        {/* Mobile: sheet sidebar */}
        {isMobile && (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="font-bold text-sm">제품 / 설정</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileSidebarOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PlannerLeftPanel
                    roomDimensions={roomDimensions}
                    onRoomDimensionsChange={setRoomDimensions}
                    archConfig={archConfig}
                    onArchConfigChange={setArchConfig}
                    onDragStart={handleDragStart}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Canvas area - takes full width on mobile */}
        <div className="flex-1 min-w-0">
          {viewMode === '2d' ? (
            <PlannerCanvas
              roomDimensions={roomDimensions}
              placedFurniture={placedFurniture}
              selectedId={selectedId}
              scale={isMobile ? scale * 0.6 : scale}
              onDrop={handleDrop}
              onSelect={handleSelect}
              onMove={updateFurniturePosition}
              architecturalConfig={archConfig}
              onArchConfigChange={setArchConfig}
            />
          ) : (
            <div className="w-full h-full relative">
              <PlannerCanvas3D
                roomDimensions={roomDimensions}
                placedFurniture={placedFurniture}
                selectedId={selectedId}
                scale={scale}
                onSelect={handleSelect}
                onRightClickSelect={handleRightClickSelect}
                architecturalConfig={archConfig}
                hdriPreset={hdriPreset}
                fpsMode={isMobile ? false : fpsMode}
                onExitFps={() => setFpsMode(false)}
              />
            </div>
          )}
        </div>

        {!isMobile && (
          <FurnitureDetailPanel
            selectedFurniture={selectedFurniture}
            pinnedFurniture={pinnedFurniture}
            onRotate={rotateFurniture}
            onDelete={handleDelete}
            onClose={() => { setSelectedId(null); setPinnedId(null); }}
            onUnpin={handleUnpin}
            onColorChange={changeFurnitureColor}
          />
        )}
      </div>

      {/* Footer - hide on mobile */}
      {!isMobile && (
        <div className="h-7 bg-[#0A1931]/5 border-t border-border flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
          <span>✅ 여성기업 인증</span>
          <span>🏛️ 나라장터 조달 등록</span>
          <span>📋 GGI 3D 인테리어</span>
        </div>
      )}

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
