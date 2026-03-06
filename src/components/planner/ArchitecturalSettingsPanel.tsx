import { useState } from 'react';
import { PanelTop, DoorOpen, Plus, Minus, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

export interface WindowConfig {
  type: 'single' | 'double' | 'sliding' | 'fixed';
  width: number; // meters
  height: number; // meters
  wall: 'back' | 'left';
  positionRatio: number; // 0~1
}

export interface DoorConfig {
  type: 'swing' | 'sliding' | 'double';
  width: number; // meters
  height: number; // meters
  wall: 'back' | 'left' | 'right' | 'front';
  positionRatio: number; // 0~1
}

export interface ArchitecturalConfig {
  windows: WindowConfig[];
  doors: DoorConfig[];
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

export const ArchitecturalSettingsPanel = ({ config, onChange }: ArchitecturalSettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const addWindow = () => {
    onChange({
      ...config,
      windows: [...config.windows, { type: 'double', width: 1.2, height: 1.4, wall: 'back', positionRatio: 0.3 + config.windows.length * 0.3 }],
    });
  };

  const removeWindow = (idx: number) => {
    onChange({ ...config, windows: config.windows.filter((_, i) => i !== idx) });
  };

  const updateWindow = (idx: number, patch: Partial<WindowConfig>) => {
    const updated = config.windows.map((w, i) => i === idx ? { ...w, ...patch } : w);
    onChange({ ...config, windows: updated });
  };

  const addDoor = () => {
    onChange({
      ...config,
      doors: [...config.doors, { type: 'swing', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 }],
    });
  };

  const removeDoor = (idx: number) => {
    onChange({ ...config, doors: config.doors.filter((_, i) => i !== idx) });
  };

  const updateDoor = (idx: number, patch: Partial<DoorConfig>) => {
    const updated = config.doors.map((d, i) => i === idx ? { ...d, ...patch } : d);
    onChange({ ...config, doors: updated });
  };

  return (
    <>
      <Button
        variant={isOpen ? 'default' : 'outline'}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground">건축 요소 설정</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
              {/* ===== WINDOWS ===== */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PanelTop className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">창문 ({config.windows.length})</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={addWindow} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> 추가
                  </Button>
                </div>

                {config.windows.map((win, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">창문 {idx + 1}</span>
                      <button onClick={() => removeWindow(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">종류</Label>
                        <Select value={win.type} onValueChange={(v) => updateWindow(idx, { type: v as WindowConfig['type'] })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WINDOW_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">벽면</Label>
                        <Select value={win.wall} onValueChange={(v) => updateWindow(idx, { wall: v as WindowConfig['wall'] })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WALL_OPTIONS.filter(w => w.value === 'back' || w.value === 'left').map(w => (
                              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">크기</Label>
                      <Select
                        value={`${win.width}x${win.height}`}
                        onValueChange={(v) => {
                          const s = WINDOW_SIZES.find(s => `${s.width}x${s.height}` === v);
                          if (s) updateWindow(idx, { width: s.width, height: s.height });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WINDOW_SIZES.map(s => (
                            <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">위치 (0~100%)</Label>
                      <input
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.05}
                        value={win.positionRatio}
                        onChange={(e) => updateWindow(idx, { positionRatio: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-[#0A1931]"
                      />
                      <span className="text-[10px] text-muted-foreground">{Math.round(win.positionRatio * 100)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Separator className="bg-border/30" />

              {/* ===== DOORS ===== */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">도어 ({config.doors.length})</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={addDoor} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> 추가
                  </Button>
                </div>

                {config.doors.map((door, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">도어 {idx + 1}</span>
                      <button onClick={() => removeDoor(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">종류</Label>
                        <Select value={door.type} onValueChange={(v) => updateDoor(idx, { type: v as DoorConfig['type'] })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">벽면</Label>
                        <Select value={door.wall} onValueChange={(v) => updateDoor(idx, { wall: v as DoorConfig['wall'] })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WALL_OPTIONS.map(w => (
                              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">크기</Label>
                      <Select
                        value={`${door.width}x${door.height}`}
                        onValueChange={(v) => {
                          const s = DOOR_SIZES.find(s => `${s.width}x${s.height}` === v);
                          if (s) updateDoor(idx, { width: s.width, height: s.height });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DOOR_SIZES.map(s => (
                            <SelectItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[10px] text-muted-foreground">위치 (0~100%)</Label>
                      <input
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.05}
                        value={door.positionRatio}
                        onChange={(e) => updateDoor(idx, { positionRatio: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-[#0A1931]"
                      />
                      <span className="text-[10px] text-muted-foreground">{Math.round(door.positionRatio * 100)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
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
};
