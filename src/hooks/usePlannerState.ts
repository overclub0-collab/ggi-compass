import { useState, useCallback } from 'react';
import { PlacedFurniture, RoomDimensions, FurnitureItem } from '@/types/planner';

const DEFAULT_ROOM: RoomDimensions = {
  width: 5000, // 5m
  height: 4000, // 4m
};

const SNAP_THRESHOLD = 20; // pixels

export const usePlannerState = () => {
  const [roomDimensions, setRoomDimensions] = useState<RoomDimensions>(DEFAULT_ROOM);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.1); // 0.1 px per mm = 100px per meter

  const addFurniture = useCallback((furniture: FurnitureItem, x: number, y: number) => {
    const newPlaced: PlacedFurniture = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      furnitureId: furniture.id,
      x,
      y,
      rotation: 0,
      furniture,
    };
    setPlacedFurniture(prev => [...prev, newPlaced]);
    setSelectedId(newPlaced.id);
  }, []);

  const updateFurniturePosition = useCallback((id: string, x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    setPlacedFurniture(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const itemWidth = item.rotation % 180 === 0 
        ? item.furniture.width * scale 
        : item.furniture.height * scale;
      const itemHeight = item.rotation % 180 === 0 
        ? item.furniture.height * scale 
        : item.furniture.width * scale;

      // Snap to walls
      let snappedX = x;
      let snappedY = y;

      // Snap to left wall
      if (Math.abs(x) < SNAP_THRESHOLD) snappedX = 0;
      // Snap to right wall
      if (Math.abs(x + itemWidth - canvasWidth) < SNAP_THRESHOLD) snappedX = canvasWidth - itemWidth;
      // Snap to top wall
      if (Math.abs(y) < SNAP_THRESHOLD) snappedY = 0;
      // Snap to bottom wall
      if (Math.abs(y + itemHeight - canvasHeight) < SNAP_THRESHOLD) snappedY = canvasHeight - itemHeight;

      // Snap to other furniture
      prev.forEach(other => {
        if (other.id === id) return;
        
        const otherWidth = other.rotation % 180 === 0 
          ? other.furniture.width * scale 
          : other.furniture.height * scale;
        const otherHeight = other.rotation % 180 === 0 
          ? other.furniture.height * scale 
          : other.furniture.width * scale;

        // Snap to right edge of other
        if (Math.abs(snappedX - (other.x + otherWidth)) < SNAP_THRESHOLD) {
          snappedX = other.x + otherWidth;
        }
        // Snap to left edge of other
        if (Math.abs((snappedX + itemWidth) - other.x) < SNAP_THRESHOLD) {
          snappedX = other.x - itemWidth;
        }
        // Snap to bottom edge of other
        if (Math.abs(snappedY - (other.y + otherHeight)) < SNAP_THRESHOLD) {
          snappedY = other.y + otherHeight;
        }
        // Snap to top edge of other
        if (Math.abs((snappedY + itemHeight) - other.y) < SNAP_THRESHOLD) {
          snappedY = other.y - itemHeight;
        }
      });

      // Clamp to canvas bounds
      snappedX = Math.max(0, Math.min(snappedX, canvasWidth - itemWidth));
      snappedY = Math.max(0, Math.min(snappedY, canvasHeight - itemHeight));

      return { ...item, x: snappedX, y: snappedY };
    }));
  }, [scale]);

  const rotateFurniture = useCallback((id: string) => {
    setPlacedFurniture(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, rotation: (item.rotation + 90) % 360 };
    }));
  }, []);

  const changeFurnitureColor = useCallback((id: string, color: string) => {
    setPlacedFurniture(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, furniture: { ...item.furniture, color } };
    }));
  }, []);

  const removeFurniture = useCallback((id: string) => {
    setPlacedFurniture(prev => prev.filter(item => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const clearAll = useCallback(() => {
    setPlacedFurniture([]);
    setSelectedId(null);
  }, []);

  const getTotalPrice = useCallback(() => {
    return placedFurniture.reduce((sum, item) => sum + item.furniture.price, 0);
  }, [placedFurniture]);

  const selectedFurniture = placedFurniture.find(f => f.id === selectedId);

  return {
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
    changeFurnitureColor,
    removeFurniture,
    clearAll,
    getTotalPrice,
  };
};
