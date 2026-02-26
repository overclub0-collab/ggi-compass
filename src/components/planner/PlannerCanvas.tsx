import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FurnitureItem, PlacedFurniture, RoomDimensions } from '@/types/planner';

interface PlannerCanvasProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onDrop: (furniture: FurnitureItem, x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
}

export const PlannerCanvas = ({
  roomDimensions,
  placedFurniture,
  selectedId,
  scale,
  onDrop,
  onSelect,
  onMove,
}: PlannerCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasWidth = roomDimensions.width * scale;
  const canvasHeight = roomDimensions.height * scale;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const furnitureData = e.dataTransfer.getData('furniture');
    if (!furnitureData || !canvasRef.current) return;

    const furniture: FurnitureItem = JSON.parse(furnitureData);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - (furniture.width * scale) / 2;
    const y = e.clientY - rect.top - (furniture.height * scale) / 2;

    onDrop(furniture, Math.max(0, x), Math.max(0, y));
  };

  // Left-click = select and show detail panel, then start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, item: PlacedFurniture) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(item.id);
    setDragging(item.id);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y,
    });
  }, [onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x + rect.left;
    const y = e.clientY - rect.top - dragOffset.y + rect.top;
    
    onMove(dragging, x, y, canvasWidth, canvasHeight);
  }, [dragging, dragOffset, onMove, canvasWidth, canvasHeight]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch: long press to select, normal touch to drag
  const handleTouchStart = useCallback((e: React.TouchEvent, item: PlacedFurniture) => {
    e.stopPropagation();
    const touch = e.touches[0];
    onSelect(item.id);
    setDragging(item.id);
    setDragOffset({
      x: touch.clientX - item.x,
      y: touch.clientY - item.y,
    });
  }, [onSelect]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || !canvasRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - dragOffset.x + rect.left;
    const y = touch.clientY - rect.top - dragOffset.y + rect.top;
    
    onMove(dragging, x, y, canvasWidth, canvasHeight);
  }, [dragging, dragOffset, onMove, canvasWidth, canvasHeight]);

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex-1 bg-muted/30 p-4 overflow-auto flex items-center justify-center">
      {/* Tooltip hint */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        클릭: 제품정보 & 이동 | 빈 공간 클릭: 선택 해제
      </div>
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => onSelect(null)}
        onContextMenu={(e) => e.preventDefault()}
        className="relative bg-white border-2 border-border shadow-lg"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          minWidth: canvasWidth,
          minHeight: canvasHeight,
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${100 * scale}px ${100 * scale}px`,
        }}
      >
        {/* Dimension labels */}
        <div className="absolute -top-6 left-0 right-0 text-center text-xs text-muted-foreground font-medium">
          {roomDimensions.width / 1000}m
        </div>
        <div 
          className="absolute -left-8 top-0 bottom-0 flex items-center text-xs text-muted-foreground font-medium"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {roomDimensions.height / 1000}m
        </div>

        {/* Placed furniture */}
        {placedFurniture.map((item) => {
          const width = item.rotation % 180 === 0 
            ? item.furniture.width * scale 
            : item.furniture.height * scale;
          const height = item.rotation % 180 === 0 
            ? item.furniture.height * scale 
            : item.furniture.width * scale;

          return (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onContextMenu={(e) => handleContextMenu(e)}
              onTouchStart={(e) => handleTouchStart(e, item)}
              className={cn(
                "absolute cursor-move transition-shadow flex items-center justify-center",
                "border-2 rounded-sm select-none",
                selectedId === item.id 
                  ? "border-primary shadow-lg ring-2 ring-primary/30" 
                  : "border-foreground/30 hover:border-primary/50"
              )}
              style={{
                left: item.x,
                top: item.y,
                width,
                height,
                backgroundColor: item.furniture.color || 'hsl(var(--muted))',
                transform: `rotate(${item.rotation}deg)`,
                transformOrigin: 'center center',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
              }}
            >
              <div
                className="flex flex-col items-center gap-0"
                style={{ transform: `rotate(-${item.rotation}deg)`, maxWidth: '90%' }}
              >
                <span className="text-[10px] font-medium text-foreground/70 text-center px-1 truncate w-full">
                  {item.furniture.name}
                </span>
                <span className="text-[8px] text-foreground/50 font-mono">
                  {item.furniture.width}×{item.furniture.height}×
                  <span className="font-bold text-primary/80">H{item.furniture.depth || 750}</span>
                </span>
              </div>
            </div>
          );
        })}

        {/* Wall thickness indicators */}
        <div className="absolute inset-0 pointer-events-none border-4 border-foreground/20 rounded-sm" />
      </div>
    </div>
  );
};
