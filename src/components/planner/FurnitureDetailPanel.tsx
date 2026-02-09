import { RotateCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacedFurniture } from '@/types/planner';

interface FurnitureDetailPanelProps {
  selectedFurniture: PlacedFurniture | undefined;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const FurnitureDetailPanel = ({
  selectedFurniture,
  onRotate,
  onDelete,
  onClose,
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
        <div 
          className="w-full aspect-square rounded-lg flex items-center justify-center mb-3"
          style={{ backgroundColor: furniture.color || 'hsl(var(--muted))' }}
        >
          <div 
            className="w-3/4 h-3/4 border-2 border-foreground/30 rounded-sm transition-transform"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              backgroundColor: furniture.color,
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)'
            }}
          />
        </div>
        <h4 className="font-bold text-foreground">{furniture.name}</h4>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">카테고리</label>
          <p className="text-sm font-medium text-foreground capitalize">{furniture.category}</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">규격</label>
          <p className="text-sm font-medium text-foreground">
            {furniture.width} × {furniture.height} mm
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">현재 회전</label>
          <p className="text-sm font-medium text-foreground">{rotation}°</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">가격</label>
          <p className="text-lg font-bold text-accent">
            ₩{furniture.price.toLocaleString()}
          </p>
        </div>
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
