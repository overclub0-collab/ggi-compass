import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  FileSpreadsheet,
  Download,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    image_url: '',
    badges: '',
    features: '',
    specs: '',
    category: '',
    display_order: 0,
  });

  // Check if user has admin role
  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    return !!data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/admin/auth');
        } else {
          // Defer the admin check to avoid deadlock
          setTimeout(() => {
            checkAdminRole(session.user.id).then((isAdminUser) => {
              setIsAdmin(isAdminUser);
              if (!isAdminUser) {
                toast.error('관리자 권한이 없습니다.');
                navigate('/');
              }
            });
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/admin/auth');
      } else {
        checkAdminRole(session.user.id).then((isAdminUser) => {
          setIsAdmin(isAdminUser);
          if (!isAdminUser) {
            toast.error('관리자 권한이 없습니다.');
            navigate('/');
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('제품 목록을 불러오는데 실패했습니다.');
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/auth');
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      description: '',
      image_url: '',
      badges: '',
      features: '',
      specs: '',
      category: '',
      display_order: 0,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      title: product.title,
      description: product.description || '',
      image_url: product.image_url || '',
      badges: product.badges?.join(', ') || '',
      features: product.features?.join('\n') || '',
      specs: product.specs ? JSON.stringify(product.specs, null, 2) : '',
      category: product.category || '',
      display_order: product.display_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, WebP, GIF 이미지만 업로드 가능합니다.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsImageUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('이미지가 업로드되었습니다.');
    } catch (error: any) {
      toast.error(error.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    try {
      const productData = {
        slug: formData.slug,
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        badges: formData.badges ? formData.badges.split(',').map(b => b.trim()) : [],
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
        specs: formData.specs ? JSON.parse(formData.specs) : {},
        category: formData.category || null,
        display_order: formData.display_order,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('제품이 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('제품이 추가되었습니다.');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('삭제 중 오류가 발생했습니다.');
    } else {
      toast.success('제품이 삭제되었습니다.');
      fetchProducts();
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const products = jsonData.map((row: any, index: number) => ({
        slug: row['슬러그'] || row['slug'] || `product-${Date.now()}-${index}`,
        title: row['제품명'] || row['title'] || '',
        description: row['설명'] || row['description'] || null,
        image_url: row['이미지URL'] || row['image_url'] || null,
        badges: row['뱃지'] || row['badges'] 
          ? String(row['뱃지'] || row['badges']).split(',').map((b: string) => b.trim())
          : [],
        features: row['특징'] || row['features']
          ? String(row['특징'] || row['features']).split('|').map((f: string) => f.trim())
          : [],
        specs: row['사양'] || row['specs']
          ? (() => {
              try {
                return JSON.parse(row['사양'] || row['specs']);
              } catch {
                return {};
              }
            })()
          : {},
        category: row['카테고리'] || row['category'] || null,
        display_order: Number(row['순서'] || row['display_order']) || index,
        is_active: true,
      }));

      const { error } = await supabase
        .from('products')
        .insert(products);

      if (error) throw error;

      toast.success(`${products.length}개의 제품이 업로드되었습니다.`);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || '엑셀 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        '슬러그': 'example-product',
        '제품명': '예시 제품',
        '설명': '제품 설명을 입력하세요',
        '이미지URL': 'https://example.com/image.jpg',
        '뱃지': 'MAS 등록, KS 인증',
        '특징': '특징1|특징2|특징3',
        '사양': '{"재질": "스틸", "색상": "화이트"}',
        '카테고리': '교육가구',
        '순서': 1,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품목록');
    XLSX.writeFile(wb, '제품_업로드_템플릿.xlsx');
  };

  if (!user || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">관리자 대시보드</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 제품 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? '제품 수정' : '새 제품 추가'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">슬러그 (URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="product-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">제품명</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="제품명"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="제품 설명"
                    rows={3}
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <Label>제품 이미지</Label>
                  <div className="mt-2 space-y-3">
                    {formData.image_url && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isImageUploading}
                        className="flex-1"
                      >
                        {isImageUploading ? (
                          <>업로드 중...</>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            이미지 업로드
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">또는</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div>
                      <Label htmlFor="image_url" className="text-xs text-muted-foreground">
                        이미지 URL 직접 입력
                      </Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="교육가구"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">표시 순서</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="badges">뱃지 (쉼표로 구분)</Label>
                  <Input
                    id="badges"
                    value={formData.badges}
                    onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                    placeholder="MAS 등록, KS 인증"
                  />
                </div>

                <div>
                  <Label htmlFor="features">주요 특징 (줄바꿈으로 구분)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="특징 1&#10;특징 2&#10;특징 3"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="specs">사양 (JSON 형식)</Label>
                  <Textarea
                    id="specs"
                    value={formData.specs}
                    onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                    placeholder='{"재질": "스틸", "색상": "화이트"}'
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                    <X className="mr-2 h-4 w-4" />
                    취소
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    저장
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isUploading ? '업로드 중...' : '엑셀 대량 업로드'}
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              템플릿 다운로드
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">순서</TableHead>
                <TableHead className="w-24">이미지</TableHead>
                <TableHead>제품명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>뱃지</TableHead>
                <TableHead className="w-32">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    등록된 제품이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.display_order}</TableCell>
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.badges?.slice(0, 2).map((badge) => (
                          <span
                            key={badge}
                            className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
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
      </main>
    </div>
  );
};

export default Admin;
