import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Building2, RefreshCw, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import DeliveryCaseImageDropzone from './DeliveryCaseImageDropzone';

interface DeliveryCase {
  id: string;
  client_name: string;
  product_name: string | null;
  model_name: string | null;
  identifier: string | null;
  images: string[];
  thumbnail_index: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const initialFormData = {
  client_name: '',
  product_name: '',
  model_name: '',
  identifier: '',
  images: [] as string[],
  thumbnail_index: 0,
};

const AdminDeliveryCaseList = () => {
  const [cases, setCases] = useState<DeliveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<DeliveryCase | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_cases')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCases(data);
    } else if (error) {
      toast.error('납품사례 목록을 불러오는데 실패했습니다.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleAdd = () => {
    setEditingCase(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleEdit = (caseItem: DeliveryCase) => {
    setEditingCase(caseItem);
    setFormData({
      client_name: caseItem.client_name,
      product_name: caseItem.product_name || '',
      model_name: caseItem.model_name || '',
      identifier: caseItem.identifier || '',
      images: caseItem.images || [],
      thumbnail_index: caseItem.thumbnail_index || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 납품사례를 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('delivery_cases')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('삭제에 실패했습니다.');
    } else {
      toast.success('납품사례가 삭제되었습니다.');
      fetchCases();
    }
  };

  const handleSave = async () => {
    if (!formData.client_name.trim()) {
      toast.error('납품처명은 필수 입력 항목입니다.');
      return;
    }

    setSaving(true);

    // Ensure thumbnail_index is within bounds
    const validThumbnailIndex = formData.images.length > 0 
      ? Math.min(formData.thumbnail_index, formData.images.length - 1) 
      : 0;

    const payload = {
      client_name: formData.client_name.trim(),
      product_name: formData.product_name.trim() || null,
      model_name: formData.model_name.trim() || null,
      identifier: formData.identifier.trim() || null,
      images: formData.images,
      thumbnail_index: validThumbnailIndex,
    };

    try {
      if (editingCase) {
        const { error } = await supabase
          .from('delivery_cases')
          .update(payload)
          .eq('id', editingCase.id);

        if (error) throw error;
        toast.success('납품사례가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('delivery_cases')
          .insert(payload);

        if (error) throw error;
        toast.success('납품사례가 등록되었습니다.');
      }

      setDialogOpen(false);
      fetchCases();
    } catch (error: any) {
      toast.error(error.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            납품사례 관리
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {cases.length}건의 납품사례
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCases}>
            <RefreshCw className="h-4 w-4 mr-1" />
            새로고침
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            납품사례 등록
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">사진</TableHead>
              <TableHead>납품처명</TableHead>
              <TableHead className="hidden sm:table-cell">품명</TableHead>
              <TableHead className="hidden md:table-cell">모델명</TableHead>
              <TableHead className="hidden lg:table-cell">식별번호</TableHead>
              <TableHead className="hidden sm:table-cell">등록일</TableHead>
              <TableHead className="w-24">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  등록된 납품사례가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              cases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    {caseItem.images.length > 0 ? (
                      <div className="relative">
                        <img
                          src={caseItem.images[0]}
                          alt={caseItem.client_name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        {caseItem.images.length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {caseItem.images.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{caseItem.client_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {caseItem.product_name || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {caseItem.model_name || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {caseItem.identifier || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(caseItem.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(caseItem)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(caseItem.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? '납품사례 수정' : '납품사례 등록'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Client Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="client_name" className="flex items-center gap-1">
                납품처명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="예: 서울시청, 국방부, 삼성전자"
              />
            </div>

            {/* Product Name - Optional */}
            <div className="space-y-2">
              <Label htmlFor="product_name">품명</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder="예: 사무용 책상, 회의 테이블"
              />
            </div>

            {/* Model Name - Optional */}
            <div className="space-y-2">
              <Label htmlFor="model_name">모델명</Label>
              <Input
                id="model_name"
                value={formData.model_name}
                onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                placeholder="예: GGI-DESK-001"
              />
            </div>

            {/* Identifier - Optional */}
            <div className="space-y-2">
              <Label htmlFor="identifier">식별번호</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="예: 조달번호, 계약번호 등"
              />
            </div>

            {/* Images with Thumbnail Selection */}
            <div className="space-y-2">
              <Label>사진 업로드</Label>
              <DeliveryCaseImageDropzone
                images={formData.images}
                onChange={(images) => {
                  // Reset thumbnail_index if it's out of bounds
                  const newThumbnailIndex = formData.thumbnail_index >= images.length ? 0 : formData.thumbnail_index;
                  setFormData(prev => ({ ...prev, images, thumbnail_index: newThumbnailIndex }));
                }}
                maxImages={20}
              />
              
              {/* Thumbnail Selection */}
              {formData.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">대표 이미지 선택</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    리스트에 표시될 대표 이미지를 선택하세요
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {formData.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, thumbnail_index: idx }))}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          formData.thumbnail_index === idx 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`썸네일 옵션 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {formData.thumbnail_index === idx && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                              대표
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : (editingCase ? '수정' : '등록')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeliveryCaseList;
