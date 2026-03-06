import { useState } from 'react';
import { PanelTop, DoorOpen, Plus, Minus, Settings2, X, Columns, SquareSplitHorizontal, Plug, Lamp, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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

// Category definitions for the grid
const ARCH_CATEGORIES = [
  { key: 'windows', label: '창문', icon: PanelTop, description: '단창·이중·미닫이·고정' },
  { key: 'doors', label: '도어', icon: DoorOpen, description: '여닫이·미닫이·양개' },
  { key: 'columns', label: '기둥', icon: Columns, description: '원형 기둥 배치' },
  { key: 'partitions', label: '파티션', icon: SquareSplitHorizontal, description: '공간 분리벽' },
  { key: 'outlets', label: '콘센트', icon: Plug, description: '벽면 전원 콘센트' },
  { key: 'ceilingLights', label: '조명', icon: Lamp, description: '패널·펜던트·스팟' },
] as const;

interface ArchitecturalSettingsPanelProps {
  config: ArchitecturalConfig;
  onChange: (config: ArchitecturalConfig) => void;
}

function WallSelect({ value, onChange, label = '벽면' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const wallLabel = WALL_OPTIONS.find(w => w.value === value)?.label || '벽면 선택';
  const wallColor = value === 'back' ? 'bg-blue-50 border-blue-300' : value === 'left' ? 'bg-green-50 border-green-300' : value === 'right' ? 'bg-orange-50 border-orange-300' : 'bg-purple-50 border-purple-300';
  return (
    <div>
      <Label className="text-[10px] font-bold text-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-9 text-xs font-semibold border-2", wallColor)}>
          <SelectValue placeholder="▼ 벽면을 선택하세요">{wallLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {WALL_OPTIONS.map(w => (
            <SelectItem key={w.value} value={w.value}>
              <span className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", w.value === 'back' ? 'bg-blue-500' : w.value === 'left' ? 'bg-green-500' : w.value === 'right' ? 'bg-orange-500' : 'bg-purple-500')} />
                {w.label}
              </span>
            </SelectItem>
          ))}
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const update = <K extends keyof ArchitecturalConfig>(key: K, val: ArchitecturalConfig[K]) =>
    onChange({ ...config, [key]: val });

  const getCount = (key: string) => {
    return (config[key as keyof ArchitecturalConfig] as unknown[])?.length || 0;
  };

  const handleCategoryClick = (key: string) => {
    setActiveCategory(prev => prev === key ? null : key);
  };

  const renderDetailPanel = () => {
    if (!activeCategory) return null;

    switch (activeCategory) {
      case 'windows':
        return renderWindowsDetail();
      case 'doors':
        return renderDoorsDetail();
      case 'columns':
        return renderColumnsDetail();
      case 'partitions':
        return renderPartitionsDetail();
      case 'outlets':
        return renderOutletsDetail();
      case 'ceilingLights':
        return renderLightsDetail();
      default:
        return null;
    }
  };

  const renderWindowsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">창문 ({config.windows.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('windows', [...config.windows, { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.5 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.windows.map((win, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">창문 {idx + 1}</span>
            <button onClick={() => update('windows', config.windows.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">종류</Label>
              <Select value={win.type} onValueChange={(v) => {
                const updated = [...config.windows]; updated[idx] = { ...win, type: v as WindowConfig['type'] }; update('windows', updated);
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{WINDOW_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <WallSelect value={win.wall} onChange={(v) => {
              const updated = [...config.windows]; updated[idx] = { ...win, wall: v as WindowConfig['wall'] }; update('windows', updated);
            }} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">크기</Label>
            <Select value={`${win.width}x${win.height}`} onValueChange={(v) => {
              const s = WINDOW_SIZES.find(s => `${s.width}x${s.height}` === v);
              if (s) { const updated = [...config.windows]; updated[idx] = { ...win, width: s.width, height: s.height }; update('windows', updated); }
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{WINDOW_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <PositionSlider value={win.positionRatio} onChange={(v) => {
            const updated = [...config.windows]; updated[idx] = { ...win, positionRatio: v }; update('windows', updated);
          }} />
        </div>
      ))}
    </div>
  );

  const renderDoorsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">도어 ({config.doors.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('doors', [...config.doors, { type: 'swing', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.doors.map((door, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">도어 {idx + 1}</span>
            <button onClick={() => update('doors', config.doors.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">종류</Label>
              <Select value={door.type} onValueChange={(v) => {
                const updated = [...config.doors]; updated[idx] = { ...door, type: v as DoorConfig['type'] }; update('doors', updated);
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DOOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <WallSelect value={door.wall} onChange={(v) => {
              const updated = [...config.doors]; updated[idx] = { ...door, wall: v as DoorConfig['wall'] }; update('doors', updated);
            }} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">크기</Label>
            <Select value={`${door.width}x${door.height}`} onValueChange={(v) => {
              const s = DOOR_SIZES.find(s => `${s.width}x${s.height}` === v);
              if (s) { const updated = [...config.doors]; updated[idx] = { ...door, width: s.width, height: s.height }; update('doors', updated); }
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DOOR_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <PositionSlider value={door.positionRatio} onChange={(v) => {
            const updated = [...config.doors]; updated[idx] = { ...door, positionRatio: v }; update('doors', updated);
          }} />
        </div>
      ))}
    </div>
  );

  const renderColumnsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">기둥 ({config.columns.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('columns', [...config.columns, { wall: 'back', positionRatio: 0.5, radius: 0.15 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.columns.map((col, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">기둥 {idx + 1}</span>
            <button onClick={() => update('columns', config.columns.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <WallSelect value={col.wall} onChange={(v) => {
              const updated = [...config.columns]; updated[idx] = { ...col, wall: v as ColumnConfig['wall'] }; update('columns', updated);
            }} />
            <div>
              <Label className="text-[10px] text-muted-foreground">반경</Label>
              <Select value={String(col.radius)} onValueChange={(v) => {
                const updated = [...config.columns]; updated[idx] = { ...col, radius: parseFloat(v) }; update('columns', updated);
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">소 (0.1m)</SelectItem>
                  <SelectItem value="0.15">중 (0.15m)</SelectItem>
                  <SelectItem value="0.2">대 (0.2m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <PositionSlider value={col.positionRatio} onChange={(v) => {
            const updated = [...config.columns]; updated[idx] = { ...col, positionRatio: v }; update('columns', updated);
          }} />
        </div>
      ))}
    </div>
  );

  const renderPartitionsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">파티션 ({config.partitions.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('partitions', [...config.partitions, { wall: 'back', positionRatio: 0.5, width: 1.5, height: 1.8 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.partitions.map((part, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">파티션 {idx + 1}</span>
            <button onClick={() => update('partitions', config.partitions.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <WallSelect value={part.wall} onChange={(v) => {
              const updated = [...config.partitions]; updated[idx] = { ...part, wall: v as PartitionConfig['wall'] }; update('partitions', updated);
            }} />
            <div>
              <Label className="text-[10px] text-muted-foreground">폭</Label>
              <Select value={String(part.width)} onValueChange={(v) => {
                const updated = [...config.partitions]; updated[idx] = { ...part, width: parseFloat(v) }; update('partitions', updated);
              }}>
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
            <Select value={String(part.height)} onValueChange={(v) => {
              const updated = [...config.partitions]; updated[idx] = { ...part, height: parseFloat(v) }; update('partitions', updated);
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">1.2m</SelectItem>
                <SelectItem value="1.5">1.5m</SelectItem>
                <SelectItem value="1.8">1.8m</SelectItem>
                <SelectItem value="2.1">2.1m</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PositionSlider value={part.positionRatio} onChange={(v) => {
            const updated = [...config.partitions]; updated[idx] = { ...part, positionRatio: v }; update('partitions', updated);
          }} />
        </div>
      ))}
    </div>
  );

  const renderOutletsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">콘센트 ({config.outlets.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('outlets', [...config.outlets, { wall: 'back', positionRatio: 0.5 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.outlets.map((outlet, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">콘센트 {idx + 1}</span>
            <button onClick={() => update('outlets', config.outlets.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <WallSelect value={outlet.wall} onChange={(v) => {
            const updated = [...config.outlets]; updated[idx] = { ...outlet, wall: v as OutletConfig['wall'] }; update('outlets', updated);
          }} />
          <PositionSlider value={outlet.positionRatio} onChange={(v) => {
            const updated = [...config.outlets]; updated[idx] = { ...outlet, positionRatio: v }; update('outlets', updated);
          }} />
        </div>
      ))}
    </div>
  );

  const renderLightsDetail = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">천장 조명 ({config.ceilingLights.length})</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
          onClick={() => update('ceilingLights', [...config.ceilingLights, { type: 'panel', xRatio: 0.5, zRatio: 0.5 }])}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>
      {config.ceilingLights.map((light, idx) => (
        <div key={idx} className="p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">조명 {idx + 1}</span>
            <button onClick={() => update('ceilingLights', config.ceilingLights.filter((_, j) => j !== idx))}
              className="p-1 rounded hover:bg-destructive/10 text-destructive"><Minus className="h-3.5 w-3.5" /></button>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">종류</Label>
            <Select value={light.type} onValueChange={(v) => {
              const updated = [...config.ceilingLights]; updated[idx] = { ...light, type: v as CeilingLightConfig['type'] }; update('ceilingLights', updated);
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LIGHT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">X 위치</Label>
              <input type="range" min={0.1} max={0.9} step={0.05} value={light.xRatio}
                onChange={(e) => {
                  const updated = [...config.ceilingLights]; updated[idx] = { ...light, xRatio: parseFloat(e.target.value) }; update('ceilingLights', updated);
                }}
                className="w-full h-1.5 accent-primary" />
              <span className="text-[10px] text-muted-foreground">{Math.round(light.xRatio * 100)}%</span>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Z 위치</Label>
              <input type="range" min={0.1} max={0.9} step={0.05} value={light.zRatio}
                onChange={(e) => {
                  const updated = [...config.ceilingLights]; updated[idx] = { ...light, zRatio: parseFloat(e.target.value) }; update('ceilingLights', updated);
                }}
                className="w-full h-1.5 accent-primary" />
              <span className="text-[10px] text-muted-foreground">{Math.round(light.zRatio * 100)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Prominent Yellow Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-1.5 text-xs h-8 font-bold border-2 shadow-lg transition-all",
          isOpen
            ? "bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300"
            : "bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300"
        )}
      >
        <Settings2 className="h-4 w-4" />
        🏗️ 건축 요소
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-4 z-20 w-[360px] bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-yellow-400/10 border-b border-yellow-400/30">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                🏗️ 건축 요소 설정
              </h3>
              <button onClick={() => { setIsOpen(false); setActiveCategory(null); }} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category Grid — always visible */}
            <div className="p-3 grid grid-cols-3 gap-2 border-b border-border/30">
              {ARCH_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = getCount(cat.key);
                const isActive = activeCategory === cat.key;

                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 relative group",
                      isActive
                        ? "bg-yellow-400 text-gray-900 border-yellow-500 shadow-md scale-[1.02]"
                        : "bg-muted/40 text-foreground border-border/40 hover:border-yellow-400/60 hover:bg-yellow-50"
                    )}
                  >
                    {/* Count badge */}
                    {count > 0 && (
                      <span className={cn(
                        "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                        isActive ? "bg-gray-900 text-yellow-400" : "bg-primary text-primary-foreground"
                      )}>
                        {count}
                      </span>
                    )}

                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isActive ? "bg-gray-900/15" : "bg-background"
                    )}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight">{cat.label}</span>
                    <span className={cn(
                      "text-[9px] leading-tight",
                      isActive ? "text-gray-700" : "text-muted-foreground"
                    )}>
                      {cat.description}
                    </span>

                    {/* Expand indicator arrow */}
                    <ChevronRight className={cn(
                      "absolute top-1/2 -translate-y-1/2 -right-1 h-3 w-3 transition-all opacity-0",
                      isActive && "opacity-100 text-yellow-600"
                    )} />
                  </button>
                );
              })}
            </div>

            {/* Detail Panel — expands below the grid */}
            <AnimatePresence mode="wait">
              {activeCategory && (
                <motion.div
                  key={activeCategory}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ScrollArea className="max-h-[45vh]">
                    <div className="p-4">
                      {renderDetailPanel()}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint when no category selected */}
            {!activeCategory && (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  👆 위 카테고리를 클릭하여 건축 요소를 추가하세요
                </p>
              </div>
            )}
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
