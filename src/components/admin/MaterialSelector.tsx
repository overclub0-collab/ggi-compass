import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WOOD_SUBTYPES, METAL_PARTS, EDGE_TREATMENTS, SURFACE_TREATMENTS } from '@/lib/furnitureMaterialDB';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface MaterialSelectorProps {
  analysis: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
}

export default function MaterialSelector({ analysis, onUpdate }: MaterialSelectorProps) {
  const materialDetail = (analysis.materialDetail as Record<string, unknown>) || {};

  const updateMaterialDetail = (key: string, value: unknown) => {
    onUpdate('materialDetail', { ...materialDetail, [key]: value });
  };

  return (
    <div className="space-y-4">
      <Label className="text-xs font-bold mb-2 block">🏭 소재/부품 상세 설정 (Material DB)</Label>
      <p className="text-[10px] text-muted-foreground -mt-2">
        퍼맥스 가구부품 카탈로그 기반 상세 소재 및 부품을 선택합니다.
      </p>

      <Accordion type="multiple" className="space-y-1">
        {/* Wood Subtype */}
        <AccordionItem value="wood" className="border rounded-md px-3">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">🪵 목재 상세</span>
              {(materialDetail.woodSubtype as string) && (
                <Badge variant="secondary" className="text-[9px]">
                  {WOOD_SUBTYPES.find(w => w.id === materialDetail.woodSubtype)?.name || ''}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">목재 종류 (상판/본체)</Label>
              <Select
                value={(materialDetail.woodSubtype as string) || ''}
                onValueChange={(v) => updateMaterialDetail('woodSubtype', v)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {WOOD_SUBTYPES.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      <span>{w.name}</span>
                      <span className="text-muted-foreground ml-1 text-[10px]">({w.thickness}mm)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(materialDetail.woodSubtype as string) && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {WOOD_SUBTYPES.find(w => w.id === materialDetail.woodSubtype)?.description}
                </p>
              )}
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">표면 처리</Label>
              <Select
                value={(materialDetail.surfaceTreatment as string) || ''}
                onValueChange={(v) => updateMaterialDetail('surfaceTreatment', v)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {SURFACE_TREATMENTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">엣지 처리</Label>
              <Select
                value={(materialDetail.edgeTreatment as string) || ''}
                onValueChange={(v) => updateMaterialDetail('edgeTreatment', v)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {EDGE_TREATMENTS.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      <span>{e.name}</span>
                      <span className="text-muted-foreground ml-1 text-[10px]">— {e.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Metal/Frame Parts */}
        <AccordionItem value="metal" className="border rounded-md px-3">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">🔩 철재/프레임 부품</span>
              {(materialDetail.legPart as string) && (
                <Badge variant="secondary" className="text-[9px]">
                  {METAL_PARTS.legs.find(l => l.id === materialDetail.legPart)?.name || ''}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 space-y-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">다리 부품</Label>
              <Select
                value={(materialDetail.legPart as string) || ''}
                onValueChange={(v) => updateMaterialDetail('legPart', v)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {METAL_PARTS.legs.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      <span>{l.name}</span>
                      <span className="text-muted-foreground ml-1 text-[10px]">({l.size})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">프레임 부품</Label>
              <Select
                value={(materialDetail.framePart as string) || ''}
                onValueChange={(v) => updateMaterialDetail('framePart', v)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {METAL_PARTS.frames.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span>{f.name}</span>
                      <span className="text-muted-foreground ml-1 text-[10px]">({f.size})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Hardware & Accessories */}
        <AccordionItem value="hardware" className="border rounded-md px-3">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">⚙️ 하드웨어/부속</span>
              {((materialDetail.selectedHardware as string[]) || []).length > 0 && (
                <Badge variant="secondary" className="text-[9px]">
                  {((materialDetail.selectedHardware as string[]) || []).length}개 선택
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="grid grid-cols-2 gap-1">
              {METAL_PARTS.hardware.map(hw => {
                const selected = ((materialDetail.selectedHardware as string[]) || []).includes(hw.id);
                return (
                  <button
                    key={hw.id}
                    className={`text-left p-2 rounded border text-[10px] transition-colors ${
                      selected 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'hover:bg-muted border-border'
                    }`}
                    onClick={() => {
                      const current = (materialDetail.selectedHardware as string[]) || [];
                      const updated = selected
                        ? current.filter(id => id !== hw.id)
                        : [...current, hw.id];
                      updateMaterialDetail('selectedHardware', updated);
                    }}
                  >
                    <span className="font-medium">{hw.name}</span>
                    <span className="text-muted-foreground block">{hw.size}</span>
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Chair Parts (conditional) */}
        {((analysis.furnitureType as string) === 'chair') && (
          <AccordionItem value="chair" className="border rounded-md px-3">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold">💺 의자 부품</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-2 gap-1">
                {METAL_PARTS.chair_parts.map(cp => {
                  const selected = ((materialDetail.selectedChairParts as string[]) || []).includes(cp.id);
                  return (
                    <button
                      key={cp.id}
                      className={`text-left p-2 rounded border text-[10px] transition-colors ${
                        selected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-muted border-border'
                      }`}
                      onClick={() => {
                        const current = (materialDetail.selectedChairParts as string[]) || [];
                        const updated = selected
                          ? current.filter(id => id !== cp.id)
                          : [...current, cp.id];
                        updateMaterialDetail('selectedChairParts', updated);
                      }}
                    >
                      <span className="font-medium">{cp.name}</span>
                      <span className="text-muted-foreground block">{cp.size}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
