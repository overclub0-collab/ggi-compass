import { useState } from 'react';
import { Monitor, Armchair, Archive, Square, BookOpen, Sofa } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FurnitureItem, FURNITURE_CATEGORIES, SAMPLE_FURNITURE } from '@/types/planner';

interface FurnitureSidebarProps {
  onDragStart: (furniture: FurnitureItem) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  desk: Monitor,
  chair: Armchair,
  storage: Archive,
  table: Square,
  sofa: Sofa,
  shelf: BookOpen,
};

export const FurnitureSidebar = ({ onDragStart }: FurnitureSidebarProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('desk');

  const filteredFurniture = SAMPLE_FURNITURE.filter(f => f.category === selectedCategory);

  const handleDragStart = (e: React.DragEvent, furniture: FurnitureItem) => {
    e.dataTransfer.setData('furniture', JSON.stringify(furniture));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(furniture);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Category Icons */}
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-bold text-primary mb-3">가구 카테고리</h2>
        <div className="grid grid-cols-3 gap-2">
          {FURNITURE_CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  "hover:bg-accent/20",
                  selectedCategory === cat.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Furniture List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredFurniture.map((furniture) => (
            <div
              key={furniture.id}
              draggable
              onDragStart={(e) => handleDragStart(e, furniture)}
              className={cn(
                "group cursor-grab active:cursor-grabbing",
                "bg-background border border-border rounded-lg p-3",
                "hover:border-primary hover:shadow-md transition-all"
              )}
            >
              {/* Top-view thumbnail representation */}
              <div 
                className="w-full aspect-[4/3] rounded mb-2 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: furniture.color || 'hsl(var(--muted))' }}
              >
                {/* Simplified top-view representation */}
                <div 
                  className="border-2 border-foreground/30 rounded-sm"
                  style={{
                    width: `${Math.min(80, (furniture.width / 20))}%`,
                    height: `${Math.min(80, (furniture.height / 15))}%`,
                    backgroundColor: furniture.color,
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              
              <h3 className="font-semibold text-sm text-foreground truncate">
                {furniture.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {furniture.width} × {furniture.height} mm
              </p>
              <p className="text-sm font-bold text-accent mt-1">
                ₩{furniture.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
