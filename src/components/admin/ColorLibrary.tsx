import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ALL_STANDARD_COLORS, STANDARD_COLORS } from '@/lib/furnitureMaterialDB';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorLibraryProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  onColorChange: (field: string, hex: string) => void;
  activeField: string;
  onFieldSelect: (field: string) => void;
}

export default function ColorLibrary({
  primaryColor,
  secondaryColor,
  accentColor,
  onColorChange,
  activeField,
  onFieldSelect,
}: ColorLibraryProps) {
  const colorGroups = [
    { key: 'wood_tones', label: '목재톤', colors: STANDARD_COLORS.wood_tones },
    { key: 'solid_colors', label: '솔리드', colors: STANDARD_COLORS.solid_colors },
    { key: 'metal_colors', label: '금속', colors: STANDARD_COLORS.metal_colors },
    { key: 'fabric_colors', label: '패브릭', colors: STANDARD_COLORS.fabric_colors },
  ];

  const fields = [
    { key: 'primaryColor', label: '주요', color: primaryColor },
    { key: 'secondaryColor', label: '보조', color: secondaryColor },
    { key: 'accentColor', label: '강조', color: accentColor },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-xs font-bold flex items-center gap-1">
        🎨 표준 색상 라이브러리
      </Label>
      <p className="text-[10px] text-muted-foreground -mt-1">
        적용할 색상 슬롯을 선택한 후 아래 색상을 클릭하세요.
      </p>

      {/* Color slot selector */}
      <div className="flex gap-2">
        {fields.map(f => (
          <button
            key={f.key}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors',
              activeField === f.key
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-border hover:bg-muted'
            )}
            onClick={() => onFieldSelect(f.key)}
          >
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: f.color }}
            />
            <span className="font-medium">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Color palette */}
      <Tabs defaultValue="wood_tones" className="w-full">
        <TabsList className="h-7 w-full">
          {colorGroups.map(g => (
            <TabsTrigger key={g.key} value={g.key} className="text-[10px] h-6 px-2">
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {colorGroups.map(g => (
          <TabsContent key={g.key} value={g.key} className="mt-2">
            <div className="grid grid-cols-7 gap-1.5">
              {g.colors.map(c => {
                const isSelected =
                  (activeField === 'primaryColor' && primaryColor === c.hex) ||
                  (activeField === 'secondaryColor' && secondaryColor === c.hex) ||
                  (activeField === 'accentColor' && accentColor === c.hex);
                return (
                  <button
                    key={c.id}
                    className={cn(
                      'flex flex-col items-center gap-0.5 p-1 rounded transition-all',
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted'
                    )}
                    onClick={() => onColorChange(activeField, c.hex)}
                    title={`${c.name} (${c.hex})`}
                  >
                    <div
                      className="w-7 h-7 rounded-md border border-border shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
