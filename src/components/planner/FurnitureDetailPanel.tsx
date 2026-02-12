import { RotateCw, Trash2, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacedFurniture } from '@/types/planner';

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
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onColorChange?: (id: string, color: string) => void;
}

export const FurnitureDetailPanel = ({
  selectedFurniture,
  onRotate,
  onDelete,
  onClose,
  onColorChange,
}: FurnitureDetailPanelProps) => {
  if (!selectedFurniture) {
    return (
      <div className="w-64 bg-card border-l border-border p-4 flex flex-col items-center justify-center text-center">
        <div className="text-muted-foreground">
          <p className="text-sm font-medium mb-1">가구를 선택하세요</p>
          <p className="text-xs">캔버스의 가구를 클릭하면<br />상세 정보가 표시됩니다</p>
        </div>
      </div>
    );
  }

  const { furniture, rotation } = selectedFurniture;

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-primary">가구 정보</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Furniture Preview */}
      <div className="p-4 border-b border-border">
        {furniture.thumbnail ? (
          <img
            src={furniture.thumbnail}
            alt={furniture.name}
            className="w-full aspect-square rounded-lg object-cover mb-3 bg-muted"
          />
        ) : (
          <div
            className="w-full aspect-square rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: furniture.color || 'hsl(var(--muted))' }}
          >
            <div
              className="w-3/4 h-3/4 border-2 border-foreground/30 rounded-sm transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                backgroundColor: furniture.color,
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        )}
        <h4 className="font-bold text-foreground">{furniture.name}</h4>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">규격 (W×D×H)</label>
          <p className="text-sm font-medium text-foreground">
            {furniture.width} × {furniture.height} × {furniture.depth || 750} mm
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">현재 회전</label>
          <p className="text-sm font-medium text-foreground">{rotation}°</p>
        </div>

        {furniture.price > 0 && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">가격</label>
            <p className="text-lg font-bold text-accent">
              ₩{furniture.price.toLocaleString()}
            </p>
          </div>
        )}

        {/* Color Palette */}
        {onColorChange && (
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Palette className="h-3 w-3" />
              컬러 변경
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  title={preset.name}
                  onClick={() => onColorChange(selectedFurniture.id, preset.color)}
                  className="w-full aspect-square rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: preset.color,
                    borderColor: furniture.color === preset.color ? 'hsl(var(--primary))' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={() => onRotate(selectedFurniture.id)}
          variant="outline"
          className="w-full gap-2"
        >
          <RotateCw className="h-4 w-4" />
          90° 회전
        </Button>
        <Button
          onClick={() => onDelete(selectedFurniture.id)}
          variant="destructive"
          className="w-full gap-2"
        >
          <Trash2 className="h-4 w-4" />
          삭제
        </Button>
      </div>
    </div>
  );
};
