import { useState } from 'react';
import { PanelTop, DoorOpen, Plus, Minus, Columns, SquareSplitHorizontal, Plug, Lamp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ArchitecturalConfig,
  WindowConfig, DoorConfig, ColumnConfig, PartitionConfig, OutletConfig, CeilingLightConfig,
} from './ArchitecturalSettingsPanel';

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
const DOOR_MATERIALS = [
  { value: 'wood', label: '🪵 목재문' },
  { value: 'glass', label: '🪟 유리문' },
  { value: 'metal', label: '🔩 샷시문' },
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
  { value: 'back', label: '뒷벽', color: 'bg-blue-500' },
  { value: 'left', label: '좌벽', color: 'bg-green-500' },
  { value: 'right', label: '우벽', color: 'bg-orange-500' },
  { value: 'front', label: '앞벽', color: 'bg-purple-500' },
];

const ARCH_CATEGORIES = [
  { key: 'windows', label: '창문', icon: PanelTop, count: (c: ArchitecturalConfig) => c.windows.length },
  { key: 'doors', label: '도어', icon: DoorOpen, count: (c: ArchitecturalConfig) => c.doors.length },
  { key: 'columns', label: '기둥', icon: Columns, count: (c: ArchitecturalConfig) => c.columns.length },
  { key: 'partitions', label: '파티션', icon: SquareSplitHorizontal, count: (c: ArchitecturalConfig) => c.partitions.length },
  { key: 'outlets', label: '콘센트', icon: Plug, count: (c: ArchitecturalConfig) => c.outlets.length },
  { key: 'ceilingLights', label: '조명', icon: Lamp, count: (c: ArchitecturalConfig) => c.ceilingLights.length },
] as const;

function WallSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const wall = WALL_OPTIONS.find(w => w.value === value);
  return (
    <div>
      <Label className="text-[10px] font-bold text-[#000]">벽면</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs font-semibold border-2">
          <SelectValue placeholder="벽면 선택">{wall?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {WALL_OPTIONS.map(w => (
            <SelectItem key={w.value} value={w.value}>
              <span className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", w.color)} />
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
      <Label className="text-[10px] text-[#000]/60">위치 {Math.round(value * 100)}%</Label>
      <input type="range" min={0.05} max={0.95} step={0.05} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-primary" />
    </div>
  );
}

interface Props {
  config: ArchitecturalConfig;
  onChange: (config: ArchitecturalConfig) => void;
}

export const ArchitecturalSettingsInline = ({ config, onChange }: Props) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const update = <K extends keyof ArchitecturalConfig>(key: K, val: ArchitecturalConfig[K]) =>
    onChange({ ...config, [key]: val });

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  return (
    <div className="p-3 space-y-1">
      <h3 className="text-sm font-bold text-[#000] px-1 pb-2">🏗️ 건축 요소</h3>

      {ARCH_CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const count = cat.count(config);
        const isOpen = openSection === cat.key;

        return (
          <div key={cat.key} className="border border-border rounded-lg overflow-hidden">
            {/* Section header - no hover effect */}
            <button
              onClick={() => toggle(cat.key)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[#000] bg-muted/30"
            >
              <Icon className="h-4 w-4 text-[#000]" />
              <span className="text-xs font-bold text-[#000] flex-1 text-left">{cat.label}</span>
              {count > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
              <ChevronDown className={cn("h-3.5 w-3.5 text-[#000] transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Section content */}
            {isOpen && (
              <div className="p-3 space-y-3 border-t border-border">
                {cat.key === 'windows' && <WindowsSection config={config} update={update} />}
                {cat.key === 'doors' && <DoorsSection config={config} update={update} />}
                {cat.key === 'columns' && <ColumnsSection config={config} update={update} />}
                {cat.key === 'partitions' && <PartitionsSection config={config} update={update} />}
                {cat.key === 'outlets' && <OutletsSection config={config} update={update} />}
                {cat.key === 'ceilingLights' && <LightsSection config={config} update={update} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Section components ---

function WindowsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('windows', [...config.windows, { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.5 }])}>
        <Plus className="h-3 w-3" /> 창문 추가
      </Button>
      {config.windows.map((win, idx) => (
        <ItemCard key={idx} label={`창문 ${idx + 1}`} onDelete={() => update('windows', config.windows.filter((_, j) => j !== idx))}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[#000]/60">종류</Label>
              <Select value={win.type} onValueChange={(v) => {
                const u = [...config.windows]; u[idx] = { ...win, type: v as WindowConfig['type'] }; update('windows', u);
              }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{WINDOW_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <WallSelect value={win.wall} onChange={(v) => {
              const u = [...config.windows]; u[idx] = { ...win, wall: v as WindowConfig['wall'] }; update('windows', u);
            }} />
          </div>
          <div>
            <Label className="text-[10px] text-[#000]/60">크기</Label>
            <Select value={`${win.width}x${win.height}`} onValueChange={(v) => {
              const s = WINDOW_SIZES.find(s => `${s.width}x${s.height}` === v);
              if (s) { const u = [...config.windows]; u[idx] = { ...win, width: s.width, height: s.height }; update('windows', u); }
            }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{WINDOW_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <PositionSlider value={win.positionRatio} onChange={(v) => {
            const u = [...config.windows]; u[idx] = { ...win, positionRatio: v }; update('windows', u);
          }} />
        </ItemCard>
      ))}
    </>
  );
}

function DoorsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('doors', [...config.doors, { type: 'swing', material: 'wood', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 }])}>
        <Plus className="h-3 w-3" /> 도어 추가
      </Button>
      {config.doors.map((door, idx) => (
        <ItemCard key={idx} label={`도어 ${idx + 1}`} onDelete={() => update('doors', config.doors.filter((_, j) => j !== idx))}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[#000]/60">종류</Label>
              <Select value={door.type} onValueChange={(v) => {
                const u = [...config.doors]; u[idx] = { ...door, type: v as DoorConfig['type'] }; update('doors', u);
              }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DOOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-[#000]/60">재질</Label>
              <Select value={door.material || 'wood'} onValueChange={(v) => {
                const u = [...config.doors]; u[idx] = { ...door, material: v as DoorConfig['material'] }; update('doors', u);
              }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DOOR_MATERIALS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <WallSelect value={door.wall} onChange={(v) => {
            const u = [...config.doors]; u[idx] = { ...door, wall: v as DoorConfig['wall'] }; update('doors', u);
          }} />
          <div>
            <Label className="text-[10px] text-[#000]/60">크기</Label>
            <Select value={`${door.width}x${door.height}`} onValueChange={(v) => {
              const s = DOOR_SIZES.find(s => `${s.width}x${s.height}` === v);
              if (s) { const u = [...config.doors]; u[idx] = { ...door, width: s.width, height: s.height }; update('doors', u); }
            }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DOOR_SIZES.map(s => <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <PositionSlider value={door.positionRatio} onChange={(v) => {
            const u = [...config.doors]; u[idx] = { ...door, positionRatio: v }; update('doors', u);
          }} />
        </ItemCard>
      ))}
    </>
  );
}

function ColumnsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('columns', [...config.columns, { wall: 'back', positionRatio: 0.5, radius: 0.15 }])}>
        <Plus className="h-3 w-3" /> 기둥 추가
      </Button>
      {config.columns.map((col, idx) => (
        <ItemCard key={idx} label={`기둥 ${idx + 1}`} onDelete={() => update('columns', config.columns.filter((_, j) => j !== idx))}>
          <div className="grid grid-cols-2 gap-2">
            <WallSelect value={col.wall} onChange={(v) => {
              const u = [...config.columns]; u[idx] = { ...col, wall: v as ColumnConfig['wall'] }; update('columns', u);
            }} />
            <div>
              <Label className="text-[10px] text-[#000]/60">반경</Label>
              <Select value={String(col.radius)} onValueChange={(v) => {
                const u = [...config.columns]; u[idx] = { ...col, radius: parseFloat(v) }; update('columns', u);
              }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">소 (0.1m)</SelectItem>
                  <SelectItem value="0.15">중 (0.15m)</SelectItem>
                  <SelectItem value="0.2">대 (0.2m)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <PositionSlider value={col.positionRatio} onChange={(v) => {
            const u = [...config.columns]; u[idx] = { ...col, positionRatio: v }; update('columns', u);
          }} />
        </ItemCard>
      ))}
    </>
  );
}

function PartitionsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('partitions', [...config.partitions, { wall: 'back', positionRatio: 0.5, width: 1.5, height: 1.8 }])}>
        <Plus className="h-3 w-3" /> 파티션 추가
      </Button>
      {config.partitions.map((part, idx) => (
        <ItemCard key={idx} label={`파티션 ${idx + 1}`} onDelete={() => update('partitions', config.partitions.filter((_, j) => j !== idx))}>
          <div className="grid grid-cols-2 gap-2">
            <WallSelect value={part.wall} onChange={(v) => {
              const u = [...config.partitions]; u[idx] = { ...part, wall: v as PartitionConfig['wall'] }; update('partitions', u);
            }} />
            <div>
              <Label className="text-[10px] text-[#000]/60">폭</Label>
              <Select value={String(part.width)} onValueChange={(v) => {
                const u = [...config.partitions]; u[idx] = { ...part, width: parseFloat(v) }; update('partitions', u);
              }}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">1.0m</SelectItem>
                  <SelectItem value="1.5">1.5m</SelectItem>
                  <SelectItem value="2.0">2.0m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-[#000]/60">높이</Label>
            <Select value={String(part.height)} onValueChange={(v) => {
              const u = [...config.partitions]; u[idx] = { ...part, height: parseFloat(v) }; update('partitions', u);
            }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">1.2m</SelectItem>
                <SelectItem value="1.5">1.5m</SelectItem>
                <SelectItem value="1.8">1.8m</SelectItem>
                <SelectItem value="2.1">2.1m</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PositionSlider value={part.positionRatio} onChange={(v) => {
            const u = [...config.partitions]; u[idx] = { ...part, positionRatio: v }; update('partitions', u);
          }} />
        </ItemCard>
      ))}
    </>
  );
}

function OutletsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('outlets', [...config.outlets, { wall: 'back', positionRatio: 0.5 }])}>
        <Plus className="h-3 w-3" /> 콘센트 추가
      </Button>
      {config.outlets.map((outlet, idx) => (
        <ItemCard key={idx} label={`콘센트 ${idx + 1}`} onDelete={() => update('outlets', config.outlets.filter((_, j) => j !== idx))}>
          <WallSelect value={outlet.wall} onChange={(v) => {
            const u = [...config.outlets]; u[idx] = { ...outlet, wall: v as OutletConfig['wall'] }; update('outlets', u);
          }} />
          <PositionSlider value={outlet.positionRatio} onChange={(v) => {
            const u = [...config.outlets]; u[idx] = { ...outlet, positionRatio: v }; update('outlets', u);
          }} />
        </ItemCard>
      ))}
    </>
  );
}

function LightsSection({ config, update }: { config: ArchitecturalConfig; update: <K extends keyof ArchitecturalConfig>(k: K, v: ArchitecturalConfig[K]) => void }) {
  return (
    <>
      <Button size="sm" variant="outline" className="w-full h-7 text-xs gap-1 text-[#000]"
        onClick={() => update('ceilingLights', [...config.ceilingLights, { type: 'panel', xRatio: 0.5, zRatio: 0.5 }])}>
        <Plus className="h-3 w-3" /> 조명 추가
      </Button>
      {config.ceilingLights.map((light, idx) => (
        <ItemCard key={idx} label={`조명 ${idx + 1}`} onDelete={() => update('ceilingLights', config.ceilingLights.filter((_, j) => j !== idx))}>
          <div>
            <Label className="text-[10px] text-[#000]/60">종류</Label>
            <Select value={light.type} onValueChange={(v) => {
              const u = [...config.ceilingLights]; u[idx] = { ...light, type: v as CeilingLightConfig['type'] }; update('ceilingLights', u);
            }}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LIGHT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-[#000]/60">X {Math.round(light.xRatio * 100)}%</Label>
              <input type="range" min={0.1} max={0.9} step={0.05} value={light.xRatio}
                onChange={(e) => {
                  const u = [...config.ceilingLights]; u[idx] = { ...light, xRatio: parseFloat(e.target.value) }; update('ceilingLights', u);
                }} className="w-full h-1.5 accent-primary" />
            </div>
            <div>
              <Label className="text-[10px] text-[#000]/60">Z {Math.round(light.zRatio * 100)}%</Label>
              <input type="range" min={0.1} max={0.9} step={0.05} value={light.zRatio}
                onChange={(e) => {
                  const u = [...config.ceilingLights]; u[idx] = { ...light, zRatio: parseFloat(e.target.value) }; update('ceilingLights', u);
                }} className="w-full h-1.5 accent-primary" />
            </div>
          </div>
        </ItemCard>
      ))}
    </>
  );
}

function ItemCard({ label, onDelete, children }: { label: string; onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className="p-2.5 bg-muted/30 rounded-lg border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#000]">{label}</span>
        <button onClick={onDelete} className="p-1 rounded text-destructive">
          <Minus className="h-3 w-3" />
        </button>
      </div>
      {children}
    </div>
  );
}
