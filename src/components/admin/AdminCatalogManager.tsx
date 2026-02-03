import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Download, 
  FileUp, 
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import { getErrorMessage, logError } from '@/lib/errorUtils';

interface Catalog {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  pdf_url: string;
  thumbnail_url: string | null;
  priority: number;
  is_featured: boolean;
  is_active: boolean;
  download_count: number;
  created_at: string;
}

const initialFormData = {
  title: '',
  description: '',
  year: new Date().getFullYear(),
  pdf_url: '',
  thumbnail_url: '',
  priority: 0,
  is_featured: false,
  is_active: true,
};

const AdminCatalogManager = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ pdf: boolean; thumbnail: boolean }>({
    pdf: false,
    thumbnail: false,
  });

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('catalogs')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logError('Fetch catalogs', error);
      toast.error('카탈로그 목록을 불러오는데 실패했습니다.');
    } else {
      setCatalogs(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCatalog(null);
  };

  const handleEdit = (catalog: Catalog) => {
    setEditingCatalog(catalog);
    setFormData({
      title: catalog.title,
      description: catalog.description || '',
      year: catalog.year || new Date().getFullYear(),
      pdf_url: catalog.pdf_url,
      thumbnail_url: catalog.thumbnail_url || '',
      priority: catalog.priority,
      is_featured: catalog.is_featured,
      is_active: catalog.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (catalog: Catalog) => {
    if (!confirm(`"${catalog.title}" 카탈로그를 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('catalogs')
      .delete()
      .eq('id', catalog.id);

    if (error) {
      logError('Delete catalog', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success('카탈로그가 삭제되었습니다.');
      fetchCatalogs();
    }
  };

  const handleFileUpload = async (
    file: File,
    type: 'pdf' | 'thumbnail'
  ): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    setUploadProgress(prev => ({ ...prev, [type]: true }));

    const { error } = await supabase.storage
      .from('catalogs')
      .upload(filePath, file);

    setUploadProgress(prev => ({ ...prev, [type]: false }));

    if (error) {
      logError(`Upload ${type}`, error);
      toast.error(`${type === 'pdf' ? 'PDF' : '썸네일'} 업로드에 실패했습니다.`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('catalogs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드 가능합니다.');
      return;
    }

    // Check file size (recommend under 10MB for web)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      toast.error('50MB 이하 파일만 업로드 가능합니다.');
      return;
    }

    if (fileSizeMB > 10) {
      toast.warning('파일이 10MB 이상입니다. 웹 최적화를 위해 압축을 권장합니다.', {
        duration: 5000,
      });
    }

    const url = await handleFileUpload(file, 'pdf');
    if (url) {
      setFormData(prev => ({ ...prev, pdf_url: url }));
      toast.success('PDF 파일이 업로드되었습니다.');
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const url = await handleFileUpload(file, 'thumbnail');
    if (url) {
      setFormData(prev => ({ ...prev, thumbnail_url: url }));
      toast.success('썸네일이 업로드되었습니다.');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('카탈로그 제목을 입력해주세요.');
      return;
    }

    if (!formData.pdf_url) {
      toast.error('PDF 파일을 업로드해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const catalogData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        year: formData.year || null,
        pdf_url: formData.pdf_url,
        thumbnail_url: formData.thumbnail_url || null,
        priority: formData.priority,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      if (editingCatalog) {
        const { error } = await supabase
          .from('catalogs')
          .update(catalogData)
          .eq('id', editingCatalog.id);

        if (error) throw error;
        toast.success('카탈로그가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('catalogs')
          .insert([catalogData]);

        if (error) throw error;
        toast.success('카탈로그가 등록되었습니다.');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCatalogs();
    } catch (error: any) {
      logError('Save catalog', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const toggleActive = async (catalog: Catalog) => {
    const { error } = await supabase
      .from('catalogs')
      .update({ is_active: !catalog.is_active })
      .eq('id', catalog.id);

    if (error) {
      logError('Toggle catalog active', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success(catalog.is_active ? '카탈로그가 숨김 처리되었습니다.' : '카탈로그가 공개되었습니다.');
      fetchCatalogs();
    }
  };

  const toggleFeatured = async (catalog: Catalog) => {
    const { error } = await supabase
      .from('catalogs')
      .update({ is_featured: !catalog.is_featured })
      .eq('id', catalog.id);

    if (error) {
      logError('Toggle catalog featured', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success(catalog.is_featured ? '메인 노출이 해제되었습니다.' : '메인에 노출됩니다.');
      fetchCatalogs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">카탈로그 관리</h2>
          <p className="text-muted-foreground">
            PDF 카탈로그를 등록하고 관리합니다.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          새 카탈로그 추가
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary mb-1">최적화 권장</p>
            <p className="text-muted-foreground">
              웹사이트 성능을 위해 PDF 파일은 10MB 이하로 최적화하는 것을 권장합니다.
              우선순위 숫자가 높을수록 상단에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Catalogs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">등록된 카탈로그 ({catalogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : catalogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>등록된 카탈로그가 없습니다</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
              >
                첫 번째 카탈로그 등록하기
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">썸네일</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="text-center">연도</TableHead>
                    <TableHead className="text-center">우선순위</TableHead>
                    <TableHead className="text-center">다운로드</TableHead>
                    <TableHead className="text-center">메인노출</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogs.map((catalog) => (
                    <TableRow key={catalog.id}>
                      <TableCell>
                        {catalog.thumbnail_url ? (
                          <img
                            src={catalog.thumbnail_url}
                            alt={catalog.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{catalog.title}</p>
                          {catalog.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {catalog.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {catalog.year || '-'}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {catalog.priority}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Download className="w-4 h-4" />
                          {catalog.download_count.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(catalog)}
                          className={catalog.is_featured ? 'text-yellow-500' : 'text-muted-foreground'}
                        >
                          <Star className={`w-4 h-4 ${catalog.is_featured ? 'fill-current' : ''}`} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(catalog)}
                          className={catalog.is_active ? 'text-green-500' : 'text-muted-foreground'}
                        >
                          {catalog.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(catalog.pdf_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(catalog)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(catalog)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCatalog ? '카탈로그 수정' : '새 카탈로그 등록'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">카탈로그 제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 2025년 교육가구 종합카탈로그"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="카탈로그 설명을 입력하세요"
                rows={2}
              />
            </div>

            {/* Year */}
            <div>
              <Label htmlFor="year">발행 연도</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                min={2000}
                max={2100}
              />
            </div>

            {/* PDF Upload */}
            <div>
              <Label>PDF 파일 *</Label>
              {formData.pdf_url ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileUp className="w-5 h-5 text-primary" />
                  <span className="text-sm flex-1 truncate">{formData.pdf_url.split('/').pop()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, pdf_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    disabled={uploadProgress.pdf}
                    className="cursor-pointer"
                  />
                  {uploadProgress.pdf && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                최적화된 PDF 권장 (10MB 이하)
              </p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label>썸네일 이미지</Label>
              {formData.thumbnail_url ? (
                <div className="relative w-32 aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={uploadProgress.thumbnail}
                    className="cursor-pointer"
                  />
                  {uploadProgress.thumbnail && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">노출 우선순위</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                placeholder="숫자가 높을수록 상단 표시"
              />
              <p className="text-xs text-muted-foreground mt-1">
                숫자가 높을수록 목록 상단에 표시됩니다
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>메인 노출</Label>
                  <p className="text-xs text-muted-foreground">메인 페이지에 우선 표시</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>공개 상태</Label>
                  <p className="text-xs text-muted-foreground">비공개 시 목록에 표시되지 않음</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => { setIsDialogOpen(false); resetForm(); }}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button onClick={handleSave} disabled={isUploading}>
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCatalogManager;
