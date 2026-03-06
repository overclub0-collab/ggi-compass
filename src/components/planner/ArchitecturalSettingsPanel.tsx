import { useState } from 'react';
import { PanelTop, DoorOpen, Plus, Minus, Settings2, X, Columns, SquareSplitHorizontal, Plug, Lamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export interface WindowConfig {
  type: 'single' | 'double' | 'sliding' | 'fixed';
  width: number;
  height: number;
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number;
}

export interface DoorConfig {
  type: 'swing' | 'sliding' | 'double';
  width: number;
  height: number;
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number;
}

export interface ColumnConfig {
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number;
  radius: number;
}

export interface PartitionConfig {
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number;
  width: number;
  height: number;
}

export interface OutletConfig {
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number;
}

export interface CeilingLightConfig {
  type: 'panel' | 'pendant' | 'spot';
  xRatio: number;
  zRatio: number;
}

export interface ArchitecturalConfig {
  windows: WindowConfig[];
  doors: DoorConfig[];
  columns: ColumnConfig[];
  partitions: PartitionConfig[];
  outlets: OutletConfig[];
  ceilingLights: CeilingLightConfig[];
}

const WINDOW_TYPES = [
  { value: 'single', label: '단창' },
  { value: 'double', label: '이중창' },
  { value: 'sliding', label: '미닫이창' },
  { value: 'fixed', label: '고정창' },
];

const WINDOW_SIZES = [
  { label: '소 (0.8×1.0m)', width: 0.8, height: 1.0 },
  { label: '중 (1.2×1.4m)', width: 1.2, height: 1.4 },
  { label: '대 (1.8×1.5m)', width: 1.8, height: 1.5 },
  { label: '와이드 (2.4×1.4m)', width: 2.4, height: 1.4 },
];

const DOOR_TYPES = [
  { value: 'swing', label: '여닫이문' },
  { value: 'sliding', label: '미닫이문' },
  { value: 'double', label: '양개문' },
];

const DOOR_SIZES = [
  { label: '일반 (0.9×2.1m)', width: 0.9, height: 2.1 },
  { label: '넓은 (1.2×2.1m)', width: 1.2, height: 2.1 },
  { label: '양개 (1.8×2.1m)', width: 1.8, height: 2.1 },
];

const LIGHT_TYPES = [
  { value: 'panel', label: '패널등' },
  { value: 'pendant', label: '펜던트등' },
  { value: 'spot', label: '스팟등' },
];

const WALL_OPTIONS = [
  { value: 'back', label: '뒷벽' },
  { value: 'left', label: '좌벽' },
  { value: 'right', label: '우벽' },
  { value: 'front', label: '앞벽' },
];

interface ArchitecturalSettingsPanelProps {
  config: ArchitecturalConfig;
  onChange: (config: ArchitecturalConfig) => void;
}

// Generic section for each element type
function ElementSection<T>({ title, icon: Icon, items, onAdd, onRemove, onUpdate, renderItem }: {
  title: string;
  icon: React.ElementType;
  items: T[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, patch: Partial<T>) => void;
  renderItem: (item: T, idx: number, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title} ({items.length})</span>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="mb-2 p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{title} {idx + 1}</span>
            <button onClick={() => onRemove(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
          {renderItem(item, idx, (patch) => onUpdate(idx, patch))}
        </div>
      ))}
    </div>
  );
}

function WallSelect({ value, onChange, label = '벽면' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {WALL_OPTIONS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function PositionSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">위치 (0~100%)</Label>
      <input type="range" min={0.05} max={0.95} step={0.05} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-primary" />
      <span className="text-[10px] text-muted-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}

export const ArchitecturalSettingsPanel = ({ config, onChange }: ArchitecturalSettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const update = <K extends keyof ArchitecturalConfig>(key: K, val: ArchitecturalConfig[K]) =>
    onChange({ ...config, [key]: val });

  return (
    <>
      <Button
        variant={isOpen ? 'default' : 'outline'}
        size="sm" onClick={() => setIsOpen(!isOpen)}
        className="gap-1 text-xs h-7"
      >
        <Settings2 className="h-3.5 w-3.5" />
        건축 요소
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-4 z-20 w-80 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground">건축 요소 설정</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <ScrollArea className="max-h-[65vh]">
              <div className="p-4 space-y-4">
                {/* Windows */}
                <ElementSection
                  title="창문" icon={PanelTop}
                  items={config.windows}
                  onAdd={() => update('windows', [...config.windows, { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.5 }])}
                  onRemove={(i) => update('windows', config.windows.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('windows', config.windows.map((w, j) => j === i ? { ...w, ...p } : w))}
                  renderItem={(win, _idx, upd) => (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">종류</Label>
                          <Select value={win.type} onValueChange={(v) => upd({ type: v as WindowConfig['type'] })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{WINDOW_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <WallSelect value={win.wall} onChange={(v) => upd({ wall: v as WindowConfig['wall'] })} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">크기</Label>
                        <Select value={`${win.width}x${win.height}`} onValueChange={(v) => {
                          const s = WINDOW_SIZES.find(s => `${s.width}x${s.height}` === v);
                          if (s) upd({ width: s.width, height: s.height });
                        }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{WINDOW_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <PositionSlider value={win.positionRatio} onChange={(v) => upd({ positionRatio: v })} />
                    </>
                  )}
                />

                <Separator className="bg-border/30" />

                {/* Doors */}
                <ElementSection
                  title="도어" icon={DoorOpen}
                  items={config.doors}
                  onAdd={() => update('doors', [...config.doors, { type: 'swing', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 }])}
                  onRemove={(i) => update('doors', config.doors.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('doors', config.doors.map((d, j) => j === i ? { ...d, ...p } : d))}
                  renderItem={(door, _idx, upd) => (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">종류</Label>
                          <Select value={door.type} onValueChange={(v) => upd({ type: v as DoorConfig['type'] })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{DOOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <WallSelect value={door.wall} onChange={(v) => upd({ wall: v as DoorConfig['wall'] })} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">크기</Label>
                        <Select value={`${door.width}x${door.height}`} onValueChange={(v) => {
                          const s = DOOR_SIZES.find(s => `${s.width}x${s.height}` === v);
                          if (s) upd({ width: s.width, height: s.height });
                        }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{DOOR_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <PositionSlider value={door.positionRatio} onChange={(v) => upd({ positionRatio: v })} />
                    </>
                  )}
                />

                <Separator className="bg-border/30" />

                {/* Columns */}
                <ElementSection
                  title="기둥" icon={Columns}
                  items={config.columns}
                  onAdd={() => update('columns', [...config.columns, { wall: 'back', positionRatio: 0.5, radius: 0.15 }])}
                  onRemove={(i) => update('columns', config.columns.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('columns', config.columns.map((c, j) => j === i ? { ...c, ...p } : c))}
                  renderItem={(col, _idx, upd) => (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <WallSelect value={col.wall} onChange={(v) => upd({ wall: v as ColumnConfig['wall'] })} />
                        <div>
                          <Label className="text-[10px] text-muted-foreground">반경</Label>
                          <Select value={String(col.radius)} onValueChange={(v) => upd({ radius: parseFloat(v) })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.1">소 (0.1m)</SelectItem>
                              <SelectItem value="0.15">중 (0.15m)</SelectItem>
                              <SelectItem value="0.2">대 (0.2m)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <PositionSlider value={col.positionRatio} onChange={(v) => upd({ positionRatio: v })} />
                    </>
                  )}
                />

                <Separator className="bg-border/30" />

                {/* Partitions */}
                <ElementSection
                  title="파티션" icon={SquareSplitHorizontal}
                  items={config.partitions}
                  onAdd={() => update('partitions', [...config.partitions, { wall: 'back', positionRatio: 0.5, width: 1.5, height: 1.8 }])}
                  onRemove={(i) => update('partitions', config.partitions.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('partitions', config.partitions.map((pt, j) => j === i ? { ...pt, ...p } : pt))}
                  renderItem={(part, _idx, upd) => (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <WallSelect value={part.wall} onChange={(v) => upd({ wall: v as PartitionConfig['wall'] })} />
                        <div>
                          <Label className="text-[10px] text-muted-foreground">폭</Label>
                          <Select value={String(part.width)} onValueChange={(v) => upd({ width: parseFloat(v) })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.0">1.0m</SelectItem>
                              <SelectItem value="1.5">1.5m</SelectItem>
                              <SelectItem value="2.0">2.0m</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">높이</Label>
                        <Select value={String(part.height)} onValueChange={(v) => upd({ height: parseFloat(v) })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.2">1.2m</SelectItem>
                            <SelectItem value="1.5">1.5m</SelectItem>
                            <SelectItem value="1.8">1.8m</SelectItem>
                            <SelectItem value="2.1">2.1m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <PositionSlider value={part.positionRatio} onChange={(v) => upd({ positionRatio: v })} />
                    </>
                  )}
                />

                <Separator className="bg-border/30" />

                {/* Outlets */}
                <ElementSection
                  title="콘센트" icon={Plug}
                  items={config.outlets}
                  onAdd={() => update('outlets', [...config.outlets, { wall: 'back', positionRatio: 0.5 }])}
                  onRemove={(i) => update('outlets', config.outlets.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('outlets', config.outlets.map((o, j) => j === i ? { ...o, ...p } : o))}
                  renderItem={(outlet, _idx, upd) => (
                    <>
                      <WallSelect value={outlet.wall} onChange={(v) => upd({ wall: v as OutletConfig['wall'] })} />
                      <PositionSlider value={outlet.positionRatio} onChange={(v) => upd({ positionRatio: v })} />
                    </>
                  )}
                />

                <Separator className="bg-border/30" />

                {/* Ceiling Lights */}
                <ElementSection
                  title="천장 조명" icon={Lamp}
                  items={config.ceilingLights}
                  onAdd={() => update('ceilingLights', [...config.ceilingLights, { type: 'panel', xRatio: 0.5, zRatio: 0.5 }])}
                  onRemove={(i) => update('ceilingLights', config.ceilingLights.filter((_, j) => j !== i))}
                  onUpdate={(i, p) => update('ceilingLights', config.ceilingLights.map((l, j) => j === i ? { ...l, ...p } : l))}
                  renderItem={(light, _idx, upd) => (
                    <>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">종류</Label>
                        <Select value={light.type} onValueChange={(v) => upd({ type: v as CeilingLightConfig['type'] })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{LIGHT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">X 위치</Label>
                          <input type="range" min={0.1} max={0.9} step={0.05} value={light.xRatio}
                            onChange={(e) => upd({ xRatio: parseFloat(e.target.value) })}
                            className="w-full h-1.5 accent-primary" />
                          <span className="text-[10px] text-muted-foreground">{Math.round(light.xRatio * 100)}%</span>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Z 위치</Label>
                          <input type="range" min={0.1} max={0.9} step={0.05} value={light.zRatio}
                            onChange={(e) => upd({ zRatio: parseFloat(e.target.value) })}
                            className="w-full h-1.5 accent-primary" />
                          <span className="text-[10px] text-muted-foreground">{Math.round(light.zRatio * 100)}%</span>
                        </div>
                      </div>
                    </>
                  )}
                />
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const DEFAULT_ARCHITECTURAL_CONFIG: ArchitecturalConfig = {
  windows: [
    { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.3 },
    { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.7 },
  ],
  doors: [
    { type: 'swing', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 },
  ],
  columns: [],
  partitions: [],
  outlets: [
    { wall: 'back', positionRatio: 0.15 },
    { wall: 'back', positionRatio: 0.85 },
    { wall: 'left', positionRatio: 0.3 },
  ],
  ceilingLights: [
    { type: 'panel', xRatio: 0.5, zRatio: 0.5 },
  ],
};
