import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FurnitureItem, PlacedFurniture, RoomDimensions } from '@/types/planner';
import { ArchitecturalConfig } from '@/components/planner/ArchitecturalSettingsPanel';

interface PlannerCanvasProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onDrop: (furniture: FurnitureItem, x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  architecturalConfig?: ArchitecturalConfig;
}

// Helper: get wall position in px for an architectural element
function getWallPosition(
  wall: string,
  positionRatio: number,
  canvasWidth: number,
  canvasHeight: number,
  elementWidthPx: number
) {
  switch (wall) {
    case 'back': return { x: positionRatio * canvasWidth - elementWidthPx / 2, y: 0, rotation: 0, isHorizontal: true };
    case 'front': return { x: positionRatio * canvasWidth - elementWidthPx / 2, y: canvasHeight - 6, rotation: 0, isHorizontal: true };
    case 'left': return { x: 0, y: positionRatio * canvasHeight - elementWidthPx / 2, rotation: 0, isHorizontal: false };
    case 'right': return { x: canvasWidth - 6, y: positionRatio * canvasHeight - elementWidthPx / 2, rotation: 0, isHorizontal: false };
    default: return { x: 0, y: 0, rotation: 0, isHorizontal: true };
  }
}

export const PlannerCanvas = ({
  roomDimensions,
  placedFurniture,
  selectedId,
  scale,
  onDrop,
  onSelect,
  onMove,
  architecturalConfig,
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

  // Render architectural elements on 2D canvas
  const renderArchElements = () => {
    if (!architecturalConfig) return null;
    const elements: React.ReactNode[] = [];

    // Windows
    architecturalConfig.windows.forEach((win, idx) => {
      const widthPx = win.width * 1000 * scale;
      const pos = getWallPosition(win.wall, win.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      elements.push(
        <div
          key={`win-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 8,
            height: isH ? 8 : widthPx,
          }}
        >
          {/* Window: blue double line with glass fill */}
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-sky-200/60 border-2 border-sky-500" />
            {/* Center line for double pane */}
            <div className={cn("absolute bg-sky-500", isH ? "left-0 right-0 top-1/2 h-[1px]" : "top-0 bottom-0 left-1/2 w-[1px]")} />
          </div>
          <span className={cn(
            "absolute text-[7px] font-bold text-sky-700 whitespace-nowrap",
            isH ? "-bottom-3 left-1/2 -translate-x-1/2" : "-right-3 top-1/2 -translate-y-1/2"
          )}>창</span>
        </div>
      );
    });

    // Doors
    architecturalConfig.doors.forEach((door, idx) => {
      const widthPx = door.width * 1000 * scale;
      const pos = getWallPosition(door.wall, door.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      elements.push(
        <div
          key={`door-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 10,
            height: isH ? 10 : widthPx,
          }}
        >
          {/* Door: opening arc */}
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-amber-100/60 border-2 border-amber-600" />
            {/* Door swing arc */}
            {isH ? (
              <svg className="absolute -bottom-1" width={widthPx} height={widthPx * 0.4} viewBox={`0 0 ${widthPx} ${widthPx * 0.4}`}>
                <path d={`M 0 0 A ${widthPx} ${widthPx * 0.4} 0 0 0 ${widthPx} 0`} fill="none" stroke="hsl(30, 70%, 50%)" strokeWidth="1" strokeDasharray="3 2" />
              </svg>
            ) : (
              <svg className="absolute -right-1" width={widthPx * 0.4} height={widthPx} viewBox={`0 0 ${widthPx * 0.4} ${widthPx}`}>
                <path d={`M 0 0 A ${widthPx * 0.4} ${widthPx} 0 0 1 0 ${widthPx}`} fill="none" stroke="hsl(30, 70%, 50%)" strokeWidth="1" strokeDasharray="3 2" />
              </svg>
            )}
          </div>
          <span className={cn(
            "absolute text-[7px] font-bold text-amber-700 whitespace-nowrap",
            isH ? "-bottom-3 left-1/2 -translate-x-1/2" : "-right-3 top-1/2 -translate-y-1/2"
          )}>문</span>
        </div>
      );
    });

    // Columns
    architecturalConfig.columns.forEach((col, idx) => {
      const radiusPx = col.radius * 1000 * scale;
      const pos = getWallPosition(col.wall, col.positionRatio, canvasWidth, canvasHeight, radiusPx * 2);
      elements.push(
        <div
          key={`col-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: radiusPx * 2,
            height: radiusPx * 2,
          }}
        >
          <div className="w-full h-full rounded-full bg-stone-300 border-2 border-stone-500 shadow-inner" />
        </div>
      );
    });

    // Partitions
    architecturalConfig.partitions.forEach((part, idx) => {
      const widthPx = part.width * 1000 * scale;
      const pos = getWallPosition(part.wall, part.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      elements.push(
        <div
          key={`part-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 6,
            height: isH ? 6 : widthPx,
          }}
        >
          <div className="w-full h-full bg-stone-400/70 border border-stone-600" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }} />
        </div>
      );
    });

    // Outlets
    architecturalConfig.outlets.forEach((outlet, idx) => {
      const size = 10;
      const pos = getWallPosition(outlet.wall, outlet.positionRatio, canvasWidth, canvasHeight, size);
      elements.push(
        <div
          key={`outlet-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: size,
            height: size,
          }}
        >
          <div className="w-full h-full rounded-sm bg-yellow-200 border border-yellow-600 flex items-center justify-center">
            <span className="text-[5px]">⚡</span>
          </div>
        </div>
      );
    });

    // Ceiling lights (show as circle in center area)
    architecturalConfig.ceilingLights.forEach((light, idx) => {
      const size = 16;
      elements.push(
        <div
          key={`light-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: light.xRatio * canvasWidth - size / 2,
            top: light.zRatio * canvasHeight - size / 2,
            width: size,
            height: size,
          }}
        >
          <div className={cn(
            "w-full h-full rounded-full border-2 flex items-center justify-center",
            light.type === 'panel' ? 'bg-yellow-100/50 border-yellow-400' :
            light.type === 'pendant' ? 'bg-orange-100/50 border-orange-400' :
            'bg-white/50 border-gray-400'
          )}>
            <span className="text-[6px]">💡</span>
          </div>
        </div>
      );
    });

    return elements;
  };

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

        {/* Architectural elements */}
        {renderArchElements()}

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
