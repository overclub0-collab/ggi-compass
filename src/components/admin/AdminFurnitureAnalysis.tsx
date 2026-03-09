import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, RefreshCw, Trash2, Search, Save, ChevronDown, ChevronRight, Eye, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface AnalysisRecord {
  id: string;
  product_id: string;
  image_url: string;
  analysis: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  product_title?: string;
  product_thumbnail?: string;
}

const FURNITURE_TYPES = [
  'desk', 'chair', 'storage', 'shelf', 'sofa', 'lab',
  'dining', 'roundtable', 'blackboard', 'bunkbed', 'pet', 'generic',
];

const LEG_STYLES = [
  '4-legs', 'T-frame', 'pedestal', 'sled', 'star-base', 'panel', 'trestle', 'none',
];

const MATERIALS = ['wood', 'metal', 'fabric', 'plastic', 'glass', 'leather', 'none'];

const SHAPES = ['rectangular', 'round', 'L-shaped', 'curved', 'irregular'];

const SURFACE_FINISHES = ['glossy', 'satin', 'matte', 'textured', 'raw'];
const WOOD_GRAIN_DIRECTIONS = ['horizontal', 'vertical', 'diagonal', 'radial'];
const WOOD_GRAIN_INTENSITIES = ['subtle', 'moderate', 'pronounced'];
const KNOT_FREQUENCIES = ['none', 'few', 'many'];
const FABRIC_TYPES = ['plain', 'twill', 'knit', 'velvet', 'leather-grain', 'mesh', 'woven'];
const METAL_FINISH_TYPES = ['brushed', 'polished', 'powder-coated', 'anodized', 'chrome', 'matte'];
const BRUSH_DIRECTIONS = ['horizontal', 'vertical', 'circular'];

const PART_LABELS: Record<string, string> = {
  top: '상판',
  legs: '다리/프레임',
  body: '본체/캐비닛',
  seat: '좌석',
  back: '등받이',
  arms: '팔걸이',
  drawers: '서랍',
  doors: '문',
  shelves: '선반',
  cushion: '쿠션',
  accent: '악센트',
};

const TEXTURE_PRESETS: Record<string, Record<string, unknown>> = {
  '우드 (밝은)': {
    woodGrain: { direction: 'horizontal', intensity: 'moderate', knotFrequency: 'few', grainColor: '#c8a87c' },
    surfaceFinish: 'satin', roughnessEstimate: 0.6, metalnessEstimate: 0,
  },
  '우드 (어두운)': {
    woodGrain: { direction: 'horizontal', intensity: 'pronounced', knotFrequency: 'few', grainColor: '#5a3a1a' },
    surfaceFinish: 'satin', roughnessEstimate: 0.55, metalnessEstimate: 0,
  },
  '금속 (크롬)': {
    metalFinish: { type: 'chrome', brushDirection: 'vertical' },
    surfaceFinish: 'glossy', roughnessEstimate: 0.15, metalnessEstimate: 0.95,
  },
  '금속 (무광)': {
    metalFinish: { type: 'matte' },
    surfaceFinish: 'matte', roughnessEstimate: 0.7, metalnessEstimate: 0.8,
  },
  '금속 (분체도장)': {
    metalFinish: { type: 'powder-coated' },
    surfaceFinish: 'matte', roughnessEstimate: 0.65, metalnessEstimate: 0.3,
  },
  '패브릭 (일반)': {
    fabricPattern: { type: 'plain', weaveScale: 1 },
    surfaceFinish: 'textured', roughnessEstimate: 0.85, metalnessEstimate: 0,
  },
  '패브릭 (메쉬)': {
    fabricPattern: { type: 'mesh', weaveScale: 0.5 },
    surfaceFinish: 'matte', roughnessEstimate: 0.8, metalnessEstimate: 0,
  },
  '가죽': {
    fabricPattern: { type: 'leather-grain', weaveScale: 0.8 },
    surfaceFinish: 'satin', roughnessEstimate: 0.5, metalnessEstimate: 0.05,
  },
};

export default function AdminFurnitureAnalysis() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      // Fetch analysis cache
      const { data: analyses, error } = await supabase
        .from('furniture_analysis_cache')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch product info for each
      const productIds = (analyses || []).map((a: any) => a.product_id);
      const { data: products } = await supabase
        .from('products')
        .select('id, title, thumbnail_url')
        .in('id', productIds.length > 0 ? productIds : ['__none__']);

      const productMap = new Map((products || []).map((p: any) => [p.id, p]));

      const enriched: AnalysisRecord[] = (analyses || []).map((a: any) => ({
        ...a,
        product_title: (productMap.get(a.product_id) as any)?.title || '(삭제된 제품)',
        product_thumbnail: (productMap.get(a.product_id) as any)?.thumbnail_url || a.image_url,
      }));

      setRecords(enriched);
    } catch (e) {
      console.error('Failed to fetch analysis records:', e);
      toast.error('분석 데이터를 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleReanalyze = async (record: AnalysisRecord) => {
    setReanalyzing((prev) => new Set(prev).add(record.product_id));
    try {
      // Delete cache first
      await supabase
        .from('furniture_analysis_cache')
        .delete()
        .eq('product_id', record.product_id);

      // Re-invoke analysis
      const { data, error } = await supabase.functions.invoke('analyze-furniture', {
        body: {
          product_id: record.product_id,
          image_url: record.image_url,
          product_name: record.product_title,
        },
      });

      if (error) throw error;

      toast.success('AI 재분석이 완료되었습니다');
      fetchRecords();
    } catch (e) {
      console.error('Re-analyze failed:', e);
      toast.error('재분석에 실패했습니다');
    } finally {
      setReanalyzing((prev) => {
        const next = new Set(prev);
        next.delete(record.product_id);
        return next;
      });
    }
  };

  const handleDelete = async (record: AnalysisRecord) => {
    if (!confirm(`"${record.product_title}"의 AI 분석 데이터를 삭제하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from('furniture_analysis_cache')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      toast.success('분석 데이터가 삭제되었습니다');
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
        setEditingAnalysis(null);
      }
    } catch (e) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleEdit = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setEditingAnalysis({ ...record.analysis });
  };

  const handleSaveAnalysis = async () => {
    if (!selectedRecord || !editingAnalysis) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('furniture_analysis_cache')
        .update({
          analysis: editingAnalysis as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast.success('분석 데이터가 수정되었습니다');
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id ? { ...r, analysis: editingAnalysis, updated_at: new Date().toISOString() } : r
        )
      );
      setSelectedRecord(null);
      setEditingAnalysis(null);
    } catch (e) {
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: string, value: unknown) => {
    if (!editingAnalysis) return;
    setEditingAnalysis({ ...editingAnalysis, [key]: value });
  };

  const updateNestedField = (parent: string, key: string, value: unknown) => {
    if (!editingAnalysis) return;
    const parentObj = (editingAnalysis[parent] as Record<string, unknown>) || {};
    setEditingAnalysis({ ...editingAnalysis, [parent]: { ...parentObj, [key]: value } });
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.product_title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (r.analysis as any)?.furnitureType === filterType;
    return matchesSearch && matchesType;
  });

  const analysis = editingAnalysis || {};

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 3D 분석 관리
          </h2>
          <p className="text-sm text-muted-foreground">
            총 {records.length}개 제품의 AI 분석 결과 · 수동 수정 가능
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRecords} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제품명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="유형 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {FURNITURE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>AI 분석 데이터가 없습니다</p>
          <p className="text-xs mt-1">3D 인테리어에서 제품을 배치하면 자동으로 분석됩니다</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRecords.map((record) => {
            const a = record.analysis as any;
            return (
              <div
                key={record.id}
                className="border rounded-lg p-3 flex items-center gap-4 hover:bg-muted/30 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {record.product_thumbnail ? (
                    <img
                      src={record.product_thumbnail}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{record.product_title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {a?.furnitureType || '?'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {a?.legStyle || '?'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {a?.primaryMaterial || '?'}
                    </Badge>
                    {a?.primaryColor && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: a.primaryColor }}
                        />
                        <span className="text-[10px] text-muted-foreground">{a.primaryColor}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    분석일: {new Date(record.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(record)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleReanalyze(record)}
                    disabled={reanalyzing.has(record.product_id)}
                  >
                    <RefreshCw className={cn('h-4 w-4', reanalyzing.has(record.product_id) && 'animate-spin')} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(record)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) { setSelectedRecord(null); setEditingAnalysis(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 분석 편집 — {selectedRecord?.product_title}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Preview */}
              {selectedRecord?.product_thumbnail && (
                <div className="flex items-center gap-4">
                  <img
                    src={selectedRecord.product_thumbnail}
                    alt=""
                    className="w-24 h-24 rounded-lg object-contain bg-muted border"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{selectedRecord.product_title}</p>
                    <p className="text-xs text-muted-foreground">분석일: {new Date(selectedRecord.updated_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
              )}

              {/* Type & Shape */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">가구 유형</Label>
                  <Select value={(analysis as any).furnitureType || ''} onValueChange={(v) => updateField('furnitureType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FURNITURE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">전체 형태</Label>
                  <Select value={(analysis as any).shape || ''} onValueChange={(v) => updateField('shape', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SHAPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Leg */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">다리 스타일</Label>
                  <Select value={(analysis as any).legStyle || ''} onValueChange={(v) => updateField('legStyle', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEG_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">다리 개수</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={(analysis as any).legCount || 0}
                    onChange={(e) => updateField('legCount', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Materials */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">1차 소재</Label>
                  <Select value={(analysis as any).primaryMaterial || ''} onValueChange={(v) => updateField('primaryMaterial', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold">2차 소재</Label>
                  <Select value={(analysis as any).secondaryMaterial || ''} onValueChange={(v) => updateField('secondaryMaterial', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold">주요 색상</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(analysis as any).primaryColor || '#c8b89a'}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={(analysis as any).primaryColor || ''}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="flex-1"
                      placeholder="#hex"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold">보조 색상</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(analysis as any).secondaryColor || '#555555'}
                      onChange={(e) => updateField('secondaryColor', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={(analysis as any).secondaryColor || ''}
                      onChange={(e) => updateField('secondaryColor', e.target.value)}
                      className="flex-1"
                      placeholder="#hex"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold">강조 색상</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(analysis as any).accentColor || '#888888'}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={(analysis as any).accentColor || ''}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="flex-1"
                      placeholder="#hex"
                    />
                  </div>
                </div>
              </div>

              {/* Thickness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">상판 두께 비율 (0.01~0.1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.2"
                    className="mt-1"
                    value={(analysis as any).topThickness || 0.04}
                    onChange={(e) => updateField('topThickness', parseFloat(e.target.value) || 0.04)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">다리 두께 비율 (0.02~0.1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.2"
                    className="mt-1"
                    value={(analysis as any).legThickness || 0.04}
                    onChange={(e) => updateField('legThickness', parseFloat(e.target.value) || 0.04)}
                  />
                </div>
              </div>

              {/* Boolean flags */}
              <div>
                <Label className="text-xs font-bold mb-2 block">상세 옵션</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'hasArmrest', label: '팔걸이' },
                    { key: 'hasBackrest', label: '등받이' },
                    { key: 'hasDrawer', label: '서랍' },
                    { key: 'hasDoor', label: '문' },
                    { key: 'hasShelf', label: '선반' },
                    { key: 'hasCushion', label: '쿠션' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={!!(analysis as any)[key]}
                        onCheckedChange={(v) => updateField(key, !!v)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold">서랍 수</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={(analysis as any).drawerCount || 0}
                    onChange={(e) => updateField('drawerCount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">문 수</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={(analysis as any).doorCount || 0}
                    onChange={(e) => updateField('doorCount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">선반 수</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={(analysis as any).shelfCount || 0}
                    onChange={(e) => updateField('shelfCount', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Proportions */}
              <div>
                <Label className="text-xs font-bold mb-2 block">비율</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">W:D 비율</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="mt-1"
                      value={((analysis as any).proportions as any)?.widthToDepthRatio || 1}
                      onChange={(e) => updateNestedField('proportions', 'widthToDepthRatio', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">H:W 비율</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="mt-1"
                      value={((analysis as any).proportions as any)?.heightToWidthRatio || 0.5}
                      onChange={(e) => updateNestedField('proportions', 'heightToWidthRatio', parseFloat(e.target.value) || 0.5)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">좌면 높이 비율</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="mt-1"
                      value={((analysis as any).proportions as any)?.seatHeightRatio || 0.5}
                      onChange={(e) => updateNestedField('proportions', 'seatHeightRatio', parseFloat(e.target.value) || 0.5)}
                    />
                  </div>
                </div>
              </div>

              {/* Details tags */}
              <div>
                <Label className="text-xs font-bold">디테일 태그 (쉼표 구분)</Label>
                <Input
                  className="mt-1"
                  value={((analysis as any).details || []).join(', ')}
                  onChange={(e) => updateField('details', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="crossbar, rounded-edges, metal-frame..."
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setSelectedRecord(null); setEditingAnalysis(null); }}>
              취소
            </Button>
            <Button onClick={handleSaveAnalysis} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
