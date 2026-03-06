import { RotateCw, Trash2, X, Palette, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacedFurniture } from '@/types/planner';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export const FurnitureDetailPanel = ({
  selectedFurniture,
  pinnedFurniture,
  onRotate,
  onDelete,
  onClose,
  onUnpin,
  onColorChange,
}: FurnitureDetailPanelProps) => {
  // Pinned takes absolute priority and persists until explicitly closed
  const displayFurniture = pinnedFurniture || selectedFurniture;
  const isPinned = !!pinnedFurniture;

  return (
    <div className="w-64 bg-background/60 backdrop-blur-xl border-l border-border/40 flex flex-col shadow-lg">
      <AnimatePresence mode="wait">
        {!displayFurniture ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Pin className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">가구를 선택하세요</p>
            <p className="text-[11px] text-muted-foreground/60">클릭: 선택 | 우클릭: 정보 고정</p>
          </motion.div>
        ) : (
          <motion.div
            key={displayFurniture.id + (isPinned ? '-pinned' : '')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isPinned && <Pin className="h-3.5 w-3.5 text-[#0A1931]" />}
                <h3 className="font-bold text-sm text-foreground">
                  {isPinned ? '고정됨' : '가구 정보'}
                </h3>
              </div>
              <button
                onClick={isPinned ? onUnpin : onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title={isPinned ? '고정 해제' : '닫기'}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Furniture Preview */}
            <div className="p-4 border-b border-border/30">
              {displayFurniture.furniture.thumbnail ? (
                <img
                  src={displayFurniture.furniture.thumbnail}
                  alt={displayFurniture.furniture.name}
                  className="w-full aspect-square rounded-xl object-cover mb-3 bg-muted shadow-sm"
                />
              ) : (
                <div
                  className="w-full aspect-square rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: displayFurniture.furniture.color || 'hsl(var(--muted))' }}
                >
                  <div
                    className="w-3/4 h-3/4 border-2 border-foreground/20 rounded transition-transform"
                    style={{
                      transform: `rotate(${displayFurniture.rotation}deg)`,
                      backgroundColor: displayFurniture.furniture.color,
                      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)',
                    }}
                  />
                </div>
              )}
              <h4 className="font-bold text-foreground">{displayFurniture.furniture.name}</h4>
            </div>

            {/* Details */}
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">규격 (W×D×H)</label>
                <p className="text-sm font-semibold text-foreground">
                  {displayFurniture.furniture.width} × {displayFurniture.furniture.height} × {displayFurniture.furniture.depth || 750} mm
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">현재 회전</label>
                <p className="text-sm font-semibold text-foreground">{displayFurniture.rotation}°</p>
              </div>

              {displayFurniture.furniture.price > 0 && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 block mb-1">가격</label>
                  <p className="text-lg font-bold text-[#0A1931]">
                    ₩{displayFurniture.furniture.price.toLocaleString()}
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
                        onClick={() => onColorChange(displayFurniture.id, preset.color)}
                        className="w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 shadow-sm"
                        style={{
                          backgroundColor: preset.color,
                          borderColor: displayFurniture.furniture.color === preset.color ? '#0A1931' : 'transparent',
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
                onClick={() => onRotate(displayFurniture.id)}
                variant="outline"
                className="w-full gap-2 rounded-xl"
              >
                <RotateCw className="h-4 w-4" />
                90° 회전
              </Button>
              <Button
                onClick={() => onDelete(displayFurniture.id)}
                variant="destructive"
                className="w-full gap-2 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
