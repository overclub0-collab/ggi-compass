import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FurnitureItem, PlacedFurniture, RoomDimensions } from '@/types/planner';
import { ArchitecturalConfig } from '@/components/planner/ArchitecturalSettingsPanel';
import { Trash2 } from 'lucide-react';

interface PlannerCanvasProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onDrop: (furniture: FurnitureItem, x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  architecturalConfig?: ArchitecturalConfig;
  onArchConfigChange?: (config: ArchitecturalConfig) => void;
}

type ArchDragInfo = {
  category: keyof ArchitecturalConfig;
  index: number;
  startMouseX: number;
  startMouseY: number;
  startRatio: number;
  wall: string;
};

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
  onArchConfigChange,
}: PlannerCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [archDrag, setArchDrag] = useState<ArchDragInfo | null>(null);
  const [hoveredArch, setHoveredArch] = useState<string | null>(null);

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
    if (archDrag && canvasRef.current && architecturalConfig && onArchConfigChange) {
      const rect = canvasRef.current.getBoundingClientRect();
      const isH = archDrag.wall === 'back' || archDrag.wall === 'front';
      const mousePos = isH ? (e.clientX - rect.left) : (e.clientY - rect.top);
      const totalLen = isH ? canvasWidth : canvasHeight;
      const newRatio = Math.max(0.05, Math.min(0.95, mousePos / totalLen));
      
      const newConfig = { ...architecturalConfig };
      const arr = [...(newConfig[archDrag.category] as any[])];
      arr[archDrag.index] = { ...arr[archDrag.index], positionRatio: newRatio };
      (newConfig as any)[archDrag.category] = arr;
      onArchConfigChange(newConfig);
      return;
    }
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x + rect.left;
    const y = e.clientY - rect.top - dragOffset.y + rect.top;
    onMove(dragging, x, y, canvasWidth, canvasHeight);
  }, [dragging, dragOffset, onMove, canvasWidth, canvasHeight, archDrag, architecturalConfig, onArchConfigChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setArchDrag(null);
  }, []);

  useEffect(() => {
    if (dragging || archDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, archDrag, handleMouseMove, handleMouseUp]);

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

  // Delete an architectural element
  const handleDeleteArch = (category: keyof ArchitecturalConfig, index: number) => {
    if (!architecturalConfig || !onArchConfigChange) return;
    const newConfig = { ...architecturalConfig };
    const arr = [...(newConfig[category] as any[])];
    arr.splice(index, 1);
    (newConfig as any)[category] = arr;
    onArchConfigChange(newConfig);
  };

  // Start dragging an architectural element
  const handleArchMouseDown = (e: React.MouseEvent, category: keyof ArchitecturalConfig, index: number, wall: string, ratio: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setArchDrag({
      category,
      index,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRatio: ratio,
      wall,
    });
  };

  // Render architectural elements on 2D canvas — NOW INTERACTIVE
  const renderArchElements = () => {
    if (!architecturalConfig) return null;
    const elements: React.ReactNode[] = [];

    // Windows
    architecturalConfig.windows.forEach((win, idx) => {
      const widthPx = win.width * 1000 * scale;
      const pos = getWallPosition(win.wall, win.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      const key = `win-${idx}`;
      const isHovered = hoveredArch === key;

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing group/arch z-10", archDrag?.category === 'windows' && archDrag.index === idx && "z-30")}
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 12,
            height: isH ? 12 : widthPx,
          }}
          onMouseDown={(e) => handleArchMouseDown(e, 'windows', idx, win.wall, win.positionRatio)}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn("w-full h-full relative transition-all", isHovered && "ring-2 ring-sky-400 rounded-sm")}>
            <div className="absolute inset-0 bg-sky-200/70 border-2 border-sky-500 rounded-sm" />
            <div className={cn("absolute bg-sky-500", isH ? "left-0 right-0 top-1/2 h-[1px]" : "top-0 bottom-0 left-1/2 w-[1px]")} />
          </div>
          <span className={cn(
            "absolute text-[7px] font-bold text-sky-700 whitespace-nowrap pointer-events-none",
            isH ? "-bottom-3 left-1/2 -translate-x-1/2" : "-right-3 top-1/2 -translate-y-1/2"
          )}>창</span>
          {/* Delete button */}
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('windows', idx); }}
              className="absolute -top-3 -right-3 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });

    // Doors
    architecturalConfig.doors.forEach((door, idx) => {
      const widthPx = door.width * 1000 * scale;
      const pos = getWallPosition(door.wall, door.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      const key = `door-${idx}`;
      const isHovered = hoveredArch === key;
      const materialColor = door.material === 'glass' ? 'bg-sky-100/70 border-sky-400' :
                           door.material === 'metal' ? 'bg-gray-300/70 border-gray-500' :
                           'bg-amber-100/70 border-amber-600';

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing group/arch z-10", archDrag?.category === 'doors' && archDrag.index === idx && "z-30")}
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 14,
            height: isH ? 14 : widthPx,
          }}
          onMouseDown={(e) => handleArchMouseDown(e, 'doors', idx, door.wall, door.positionRatio)}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn("w-full h-full relative transition-all", isHovered && "ring-2 ring-amber-400 rounded-sm")}>
            <div className={cn("absolute inset-0 border-2 rounded-sm", materialColor)} />
            {isH ? (
              <svg className="absolute -bottom-1 pointer-events-none" width={widthPx} height={widthPx * 0.4} viewBox={`0 0 ${widthPx} ${widthPx * 0.4}`}>
                <path d={`M 0 0 A ${widthPx} ${widthPx * 0.4} 0 0 0 ${widthPx} 0`} fill="none" stroke="hsl(30, 70%, 50%)" strokeWidth="1" strokeDasharray="3 2" />
              </svg>
            ) : (
              <svg className="absolute -right-1 pointer-events-none" width={widthPx * 0.4} height={widthPx} viewBox={`0 0 ${widthPx * 0.4} ${widthPx}`}>
                <path d={`M 0 0 A ${widthPx * 0.4} ${widthPx} 0 0 1 0 ${widthPx}`} fill="none" stroke="hsl(30, 70%, 50%)" strokeWidth="1" strokeDasharray="3 2" />
              </svg>
            )}
          </div>
          <span className={cn(
            "absolute text-[7px] font-bold text-amber-700 whitespace-nowrap pointer-events-none",
            isH ? "-bottom-3 left-1/2 -translate-x-1/2" : "-right-3 top-1/2 -translate-y-1/2"
          )}>문</span>
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('doors', idx); }}
              className="absolute -top-3 -right-3 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });

    // Columns
    architecturalConfig.columns.forEach((col, idx) => {
      const radiusPx = col.radius * 1000 * scale;
      const pos = getWallPosition(col.wall, col.positionRatio, canvasWidth, canvasHeight, radiusPx * 2);
      const key = `col-${idx}`;
      const isHovered = hoveredArch === key;

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing z-10")}
          style={{
            left: pos.x,
            top: pos.y,
            width: radiusPx * 2,
            height: radiusPx * 2,
          }}
          onMouseDown={(e) => handleArchMouseDown(e, 'columns', idx, col.wall, col.positionRatio)}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn("w-full h-full rounded-full bg-stone-300 border-2 border-stone-500 shadow-inner transition-all", isHovered && "ring-2 ring-stone-400")} />
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('columns', idx); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });

    // Partitions
    architecturalConfig.partitions.forEach((part, idx) => {
      const widthPx = part.width * 1000 * scale;
      const pos = getWallPosition(part.wall, part.positionRatio, canvasWidth, canvasHeight, widthPx);
      const isH = pos.isHorizontal;
      const key = `part-${idx}`;
      const isHovered = hoveredArch === key;

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing z-10")}
          style={{
            left: pos.x,
            top: pos.y,
            width: isH ? widthPx : 8,
            height: isH ? 8 : widthPx,
          }}
          onMouseDown={(e) => handleArchMouseDown(e, 'partitions', idx, part.wall, part.positionRatio)}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn("w-full h-full bg-stone-400/70 border border-stone-600 transition-all", isHovered && "ring-2 ring-stone-500")} 
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }} />
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('partitions', idx); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });

    // Outlets
    architecturalConfig.outlets.forEach((outlet, idx) => {
      const size = 14;
      const pos = getWallPosition(outlet.wall, outlet.positionRatio, canvasWidth, canvasHeight, size);
      const key = `outlet-${idx}`;
      const isHovered = hoveredArch === key;

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing z-10")}
          style={{
            left: pos.x,
            top: pos.y,
            width: size,
            height: size,
          }}
          onMouseDown={(e) => handleArchMouseDown(e, 'outlets', idx, outlet.wall, outlet.positionRatio)}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn("w-full h-full rounded-sm bg-yellow-200 border border-yellow-600 flex items-center justify-center transition-all", isHovered && "ring-2 ring-yellow-400")}>
            <span className="text-[6px]">⚡</span>
          </div>
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('outlets', idx); }}
              className="absolute -top-2 -right-2 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      );
    });

    // Ceiling lights
    architecturalConfig.ceilingLights.forEach((light, idx) => {
      const size = 18;
      const key = `light-${idx}`;
      const isHovered = hoveredArch === key;

      elements.push(
        <div
          key={key}
          className={cn("absolute cursor-grab active:cursor-grabbing z-10")}
          style={{
            left: light.xRatio * canvasWidth - size / 2,
            top: light.zRatio * canvasHeight - size / 2,
            width: size,
            height: size,
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            // For lights, we need both x and z ratio drag
            const startX = e.clientX;
            const startY = e.clientY;
            const startXRatio = light.xRatio;
            const startZRatio = light.zRatio;
            
            const onMove = (ev: MouseEvent) => {
              if (!canvasRef.current || !architecturalConfig || !onArchConfigChange) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const newXRatio = Math.max(0.05, Math.min(0.95, (ev.clientX - rect.left) / canvasWidth));
              const newZRatio = Math.max(0.05, Math.min(0.95, (ev.clientY - rect.top) / canvasHeight));
              const newConfig = { ...architecturalConfig };
              const arr = [...newConfig.ceilingLights];
              arr[idx] = { ...arr[idx], xRatio: newXRatio, zRatio: newZRatio };
              newConfig.ceilingLights = arr;
              onArchConfigChange(newConfig);
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          onMouseEnter={() => setHoveredArch(key)}
          onMouseLeave={() => setHoveredArch(null)}
        >
          <div className={cn(
            "w-full h-full rounded-full border-2 flex items-center justify-center transition-all",
            light.type === 'panel' ? 'bg-yellow-100/60 border-yellow-400' :
            light.type === 'pendant' ? 'bg-orange-100/60 border-orange-400' :
            'bg-white/60 border-gray-400',
            isHovered && "ring-2 ring-yellow-400 scale-110"
          )}>
            <span className="text-[7px]">💡</span>
          </div>
          {isHovered && onArchConfigChange && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteArch('ceilingLights', idx); }}
              className="absolute -top-2 -right-2 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="flex-1 bg-muted/30 p-4 overflow-auto flex items-center justify-center">
      {/* Tooltip hint */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        가구/건축요소 드래그: 이동 | 건축요소 호버: 🗑️ 삭제
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

        {/* Wall labels */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">뒷벽</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-[9px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded">앞벽</div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 text-[9px] font-bold text-green-500 bg-green-50 px-1 py-0.5 rounded" style={{ writingMode: 'vertical-rl' }}>좌벽</div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 text-[9px] font-bold text-orange-500 bg-orange-50 px-1 py-0.5 rounded" style={{ writingMode: 'vertical-rl' }}>우벽</div>

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
