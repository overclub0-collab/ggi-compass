import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { RotateCw, Trash2, X, Palette, Pin, SplitSquareHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacedFurniture } from '@/types/planner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { FurnitureObject } from './FurnitureModels';
import * as THREE from 'three';

const COLOR_PRESETS = [
  { name: '내추럴 우드', color: 'hsl(30, 40%, 65%)' },
  { name: '다크 우드', color: 'hsl(25, 35%, 35%)' },
  { name: '화이트', color: 'hsl(0, 0%, 92%)' },
  { name: '라이트 그레이', color: 'hsl(210, 10%, 80%)' },
  { name: '파스텔 블루', color: 'hsl(210, 40%, 75%)' },
  { name: '파스텔 핑크', color: 'hsl(350, 40%, 80%)' },
  { name: '민트', color: 'hsl(160, 35%, 70%)' },
  { name: '차콜', color: 'hsl(0, 0%, 28%)' },
];

interface FurnitureDetailPanelProps {
  selectedFurniture: PlacedFurniture | undefined;
  pinnedFurniture?: PlacedFurniture | undefined;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onUnpin?: () => void;
  onColorChange?: (id: string, color: string) => void;
  viewMode?: '2d' | '3d';
}

// Mini 3D preview of the selected furniture for comparison
function Mini3DPreview({ item }: { item: PlacedFurniture }) {
  const w = item.furniture.width / 1000;
  const d = item.furniture.height / 1000;
  const h = (item.furniture.depth || 750) / 1000;
  const maxDim = Math.max(w, d, h);
  const camDist = maxDim * 2.2;

  // Create a centered version of the item for the preview
  const centeredItem = useMemo(() => ({
    ...item,
    x: 0,
    y: 0,
    rotation: 0,
  }), [item]);

  return (
    <Canvas
      camera={{ position: [camDist * 0.8, camDist * 0.6, camDist * 0.8], fov: 40 }}
      style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
      gl={{ antialias: true }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} color="#c8d8f0" />
      <Environment preset="apartment" background={false} environmentIntensity={0.4} />
      <color attach="background" args={['#f5f3ef']} />
      
      <group position={[-w / 2, 0, -d / 2]}>
        <FurnitureObject
          item={centeredItem}
          isSelected={false}
          onSelect={() => {}}
        />
      </group>

      {/* Simple ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[maxDim * 3, maxDim * 3]} />
        <meshStandardMaterial color="#eae8e3" roughness={0.9} />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={camDist * 0.5}
        maxDistance={camDist * 3}
        target={[0, h * 0.4, 0]}
        autoRotate
        autoRotateSpeed={1.5}
      />
    </Canvas>
  );
}

export const FurnitureDetailPanel = ({
  selectedFurniture,
  pinnedFurniture,
  onRotate,
  onDelete,
  onClose,
  onUnpin,
  onColorChange,
  viewMode = '2d',
}: FurnitureDetailPanelProps) => {
  const displayFurniture = pinnedFurniture || selectedFurniture;
  const isPinned = !!pinnedFurniture;
  const [compareMode, setCompareMode] = useState(false);

  const lastDisplayRef = useRef<PlacedFurniture | undefined>(undefined);
  
  useEffect(() => {
    if (displayFurniture) {
      lastDisplayRef.current = displayFurniture;
    }
  }, [displayFurniture]);

  // Reset compare mode when furniture changes
  useEffect(() => {
    setCompareMode(false);
  }, [displayFurniture?.id]);

  const stableDisplay = displayFurniture || (isPinned ? lastDisplayRef.current : undefined);
  const showContent = !!stableDisplay;
  const hasImage = !!stableDisplay?.furniture.thumbnail;

  return (
    <div className="w-64 bg-background/60 backdrop-blur-xl border-l border-border/40 flex flex-col shadow-lg">
      {!showContent ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <Pin className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">가구를 선택하세요</p>
          <p className="text-[11px] text-muted-foreground/60">클릭: 선택 | 우클릭: 정보 고정</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isPinned && <Pin className="h-3.5 w-3.5 text-[#0A1931]" />}
              <h3 className="font-bold text-sm text-foreground">
                {isPinned ? '고정됨' : '가구 정보'}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {/* Compare toggle — only when image exists */}
              {hasImage && (
                <button
                  onClick={() => setCompareMode(prev => !prev)}
                  className={`p-1.5 rounded-lg transition-colors ${compareMode ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                  title="실제 사진 vs 3D 비교"
                >
                  <SplitSquareHorizontal className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={isPinned ? onUnpin : onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title={isPinned ? '고정 해제' : '닫기'}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Furniture Preview — comparison or standard */}
          <div className="p-4 border-b border-border/30">
            {compareMode && hasImage ? (
              /* Side-by-side comparison */
              <div className="space-y-2">
                <div className="flex items-center gap-1 mb-2">
                  <SplitSquareHorizontal className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">실제 vs 3D 비교</span>
                </div>
                {/* Real photo */}
                <div className="relative">
                  <div className="absolute top-1.5 left-1.5 bg-foreground/70 text-background text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
                    실제 사진
                  </div>
                  <img
                    src={stableDisplay!.furniture.thumbnail}
                    alt={stableDisplay!.furniture.name}
                    className="w-full aspect-[4/3] rounded-xl object-cover bg-muted shadow-sm"
                  />
                </div>
                {/* 3D model preview */}
                <div className="relative">
                  <div className="absolute top-1.5 left-1.5 bg-primary/80 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
                    3D 모델
                  </div>
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-sm">
                    <Suspense fallback={
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    }>
                      <Mini3DPreview item={stableDisplay!} />
                    </Suspense>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard single preview */
              <>
                {stableDisplay!.furniture.thumbnail ? (
                  <img
                    src={stableDisplay!.furniture.thumbnail}
                    alt={stableDisplay!.furniture.name}
                    className="w-full aspect-square rounded-xl object-cover mb-3 bg-muted shadow-sm"
                  />
                ) : (
                  <div
                    className="w-full aspect-square rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: stableDisplay!.furniture.color || 'hsl(var(--muted))' }}
                  >
                    <div
                      className="w-3/4 h-3/4 border-2 border-foreground/20 rounded transition-transform"
                      style={{
                        transform: `rotate(${stableDisplay!.rotation}deg)`,
                        backgroundColor: stableDisplay!.furniture.color,
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                )}
              </>
            )}
            <h4 className="font-bold text-foreground mt-2">{stableDisplay!.furniture.name}</h4>
          </div>

          {/* Details */}
          <div className="p-4 flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">규격 (W×D×H)</label>
              <p className="text-sm font-semibold text-foreground">
                {stableDisplay!.furniture.width} × {stableDisplay!.furniture.height} × {stableDisplay!.furniture.depth || 750} mm
              </p>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">현재 회전</label>
              <p className="text-sm font-semibold text-foreground">{stableDisplay!.rotation}°</p>
            </div>

            {stableDisplay!.furniture.price > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">가격</label>
                <p className="text-lg font-bold text-[#0A1931]">
                  ₩{stableDisplay!.furniture.price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Color Palette */}
            {onColorChange && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1 mb-2">
                  <Palette className="h-3 w-3" />
                  컬러 변경
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      title={preset.name}
                      onClick={() => onColorChange(stableDisplay!.id, preset.color)}
                      className="w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 shadow-sm"
                      style={{
                        backgroundColor: preset.color,
                        borderColor: stableDisplay!.furniture.color === preset.color ? '#0A1931' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/30 space-y-2">
            <Button
              onClick={() => onRotate(stableDisplay!.id)}
              variant="outline"
              className="w-full gap-2 rounded-xl"
            >
              <RotateCw className="h-4 w-4" />
              90° 회전
            </Button>
            <Button
              onClick={() => onDelete(stableDisplay!.id)}
              variant="destructive"
              className="w-full gap-2 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};