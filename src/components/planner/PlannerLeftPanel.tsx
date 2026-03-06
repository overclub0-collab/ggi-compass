import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FurnitureSidebar } from './FurnitureSidebar';
import { ArchitecturalSettingsInline } from './ArchitecturalSettingsInline';
import { RoomDimensions, FurnitureItem } from '@/types/planner';
import { ArchitecturalConfig } from './ArchitecturalSettingsPanel';
import { Ruler, Building2, Package } from 'lucide-react';

interface PlannerLeftPanelProps {
  roomDimensions: RoomDimensions;
  onRoomDimensionsChange: (d: RoomDimensions) => void;
  archConfig: ArchitecturalConfig;
  onArchConfigChange: (c: ArchitecturalConfig) => void;
  onDragStart: (furniture: FurnitureItem) => void;
}

function RoomSizePanel({ roomDimensions, onChange }: { roomDimensions: RoomDimensions; onChange: (d: RoomDimensions) => void }) {
  const [width, setWidth] = useState(roomDimensions.width / 1000);
  const [height, setHeight] = useState(roomDimensions.height / 1000);

  const handleSave = () => {
    onChange({ width: width * 1000, height: height * 1000 });
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-bold text-[#000]">📐 공간 크기 설정</h3>
      <p className="text-xs text-[#000]/60">배치할 공간의 가로와 세로 크기를 미터(m) 단위로 입력하세요.</p>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-semibold text-[#000] w-10 shrink-0">가로</Label>
          <Input
            type="number" min={1} max={30} step={0.1}
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
            className="h-9 text-sm border-2 border-border"
          />
          <span className="text-xs text-[#000]/60 shrink-0">m</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs font-semibold text-[#000] w-10 shrink-0">세로</Label>
          <Input
            type="number" min={1} max={30} step={0.1}
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
            className="h-9 text-sm border-2 border-border"
          />
          <span className="text-xs text-[#000]/60 shrink-0">m</span>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full h-9 text-sm font-bold">
        적용
      </Button>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-[11px] text-[#000]/50">
          현재 크기: {roomDimensions.width / 1000}m × {roomDimensions.height / 1000}m
          ({(roomDimensions.width / 1000 * roomDimensions.height / 1000).toFixed(1)}㎡)
        </p>
      </div>
    </div>
  );
}

export const PlannerLeftPanel = ({
  roomDimensions,
  onRoomDimensionsChange,
  archConfig,
  onArchConfigChange,
  onDragStart,
}: PlannerLeftPanelProps) => {
  return (
    <div className="w-[280px] flex flex-col h-full bg-background border-r border-border shrink-0">
      <Tabs defaultValue="products" className="flex flex-col h-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none shrink-0">
          <TabsTrigger
            value="products"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#000] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#000] text-xs font-bold py-2.5 gap-1"
          >
            <Package className="h-3.5 w-3.5" />
            제품
          </TabsTrigger>
          <TabsTrigger
            value="room"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#000] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#000] text-xs font-bold py-2.5 gap-1"
          >
            <Ruler className="h-3.5 w-3.5" />
            공간 설정
          </TabsTrigger>
          <TabsTrigger
            value="arch"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#000] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[#000] text-xs font-bold py-2.5 gap-1"
          >
            <Building2 className="h-3.5 w-3.5" />
            건축 요소
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="flex-1 mt-0 overflow-hidden">
          <FurnitureSidebar onDragStart={onDragStart} />
        </TabsContent>

        <TabsContent value="room" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <RoomSizePanel roomDimensions={roomDimensions} onChange={onRoomDimensionsChange} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="arch" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <ArchitecturalSettingsInline config={archConfig} onChange={onArchConfigChange} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
