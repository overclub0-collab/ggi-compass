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
  FolderTree,
  Menu
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getErrorMessage, logError } from '@/lib/errorUtils';
import { parseProductCSV, exportProductsToCSV, downloadProductTemplate } from '@/lib/excelUtils';
import CategoryFilter from '@/components/admin/CategoryFilter';
import ProductForm from '@/components/admin/ProductForm';
import ProductTable from '@/components/admin/ProductTable';
import type { User } from '@supabase/supabase-js';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images?: string[] | null;
  badges: string[] | null;
  features: string[] | null;
  specs: Record<string, any> | null;
  category: string | null;
  main_category: string | null;
  subcategory: string | null;
  display_order: number | null;
  is_active: boolean | null;
  procurement_id: string | null;
  price: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  description?: string;
  image_url?: string;
}

const initialFormData = {
  slug: '',
  title: '',
  description: '',
  images: [] as string[],
  image_url: '',
  badges: '',
  features: '',
  specs: '',
  main_category: '',
  subcategory: '',
  display_order: 0,
  procurement_id: '',
  price: '',
};

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Category filter state
  const [filterMainCategory, setFilterMainCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    parent_id: '',
    display_order: 0,
    description: '',
    image_url: '',
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
      logError('Admin role check', error);
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
      fetchCategories();
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
      setProducts((data || []) as Product[]);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      logError('Fetch categories', error);
    } else {
      setCategories((data || []) as Category[]);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Filtered products based on category selection
  const filteredProducts = products.filter(product => {
    if (filterMainCategory && filterMainCategory !== 'all') {
      if (product.main_category !== filterMainCategory) return false;
    }
    if (filterSubcategory && filterSubcategory !== 'all') {
      if (product.subcategory !== filterSubcategory) return false;
    }
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/auth');
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      slug: '',
      parent_id: '',
      display_order: 0,
      description: '',
      image_url: '',
    });
    setEditingCategory(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      title: product.title,
      description: product.description || '',
      images: product.images || (product.image_url ? [product.image_url] : []),
      image_url: product.image_url || '',
      badges: product.badges?.join(', ') || '',
      features: product.features?.join('\n') || '',
      specs: product.specs ? JSON.stringify(product.specs, null, 2) : '',
      main_category: product.main_category || '',
      subcategory: product.subcategory || '',
      display_order: product.display_order || 0,
      procurement_id: product.procurement_id || '',
      price: product.price || '',
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id || '',
      display_order: category.display_order,
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setIsCategoryDialogOpen(true);
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    // Validate JSON specs before proceeding
    let parsedSpecs = {};
    if (formData.specs) {
      try {
        parsedSpecs = JSON.parse(formData.specs);
      } catch (e) {
        toast.error('사양(specs) 필드의 JSON 형식이 올바르지 않습니다. 예: {"키": "값"}');
        return;
      }
    }

    if (!formData.title.trim()) {
      toast.error('품명은 필수 입력 항목입니다.');
      return;
    }

    try {
      const productData = {
        slug: formData.slug || `product-${Date.now()}`,
        title: formData.title,
        description: formData.description || null,
        images: formData.images,
        image_url: formData.images[0] || formData.image_url || null,
        badges: formData.badges ? formData.badges.split(',').map(b => b.trim()) : [],
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
        specs: parsedSpecs,
        main_category: formData.main_category || null,
        subcategory: formData.subcategory || null,
        display_order: formData.display_order,
        procurement_id: formData.procurement_id || null,
        price: formData.price || null,
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
      logError('Save product', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveCategory = async () => {
    try {
      const categoryData = {
        name: categoryFormData.name,
        slug: categoryFormData.slug,
        parent_id: categoryFormData.parent_id || null,
        display_order: categoryFormData.display_order,
        description: categoryFormData.description || null,
        image_url: categoryFormData.image_url || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('카테고리가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        toast.success('카테고리가 추가되었습니다.');
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      fetchCategories();
    } catch (error: any) {
      logError('Save category', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      logError('Delete product', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success('제품이 삭제되었습니다.');
      fetchProducts();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      logError('Delete category', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success('카테고리가 삭제되었습니다.');
      fetchCategories();
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const { products: parsedProducts, errors } = await parseProductCSV(file);

      if (parsedProducts.length === 0) {
        throw new Error('업로드할 유효한 제품이 없습니다.');
      }

      const { error } = await supabase
        .from('products')
        .insert(parsedProducts);

      if (error) throw error;

      let successMessage = `${parsedProducts.length}개의 제품이 업로드되었습니다.`;
      if (errors.length > 0) {
        successMessage += ` (${errors.length}개 오류 건너뜀)`;
      }
      toast.success(successMessage);
      fetchProducts();
    } catch (error: any) {
      logError('CSV upload', error);
      if (error.message?.includes('CSV') || error.message?.includes('행') || error.message?.includes('유효성')) {
        toast.error(error.message);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportProducts = () => {
    const dataToExport = filteredProducts.length > 0 ? filteredProducts : products;
    const filename = filterMainCategory && filterMainCategory !== 'all' 
      ? `제품_목록_${filterMainCategory}.csv`
      : '제품_전체_목록.csv';
    exportProductsToCSV(dataToExport, filename);
    toast.success(`${dataToExport.length}개 제품을 내보냈습니다.`);
  };

  const clearFilters = () => {
    setFilterMainCategory('');
    setFilterSubcategory('');
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
      {/* Header - Mobile Responsive */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>관리자 메뉴</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Button 
                      variant={activeTab === 'products' ? 'default' : 'ghost'}
                      className="w-full justify-start min-h-[44px]"
                      onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      제품 관리
                    </Button>
                    <Button 
                      variant={activeTab === 'categories' ? 'default' : 'ghost'}
                      className="w-full justify-start min-h-[44px]"
                      onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }}
                    >
                      <FolderTree className="mr-2 h-4 w-4" />
                      카테고리 관리
                    </Button>
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full min-h-[44px]" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-primary">관리자 대시보드</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{user.email}</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleLogout} className="hidden md:flex min-h-[44px]">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'products' ? 'default' : 'outline'}
            onClick={() => setActiveTab('products')}
            className="min-h-[44px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            제품 관리
          </Button>
          <Button 
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('categories')}
            className="min-h-[44px]"
          >
            <FolderTree className="mr-2 h-4 w-4" />
            카테고리 관리
          </Button>
        </div>

        {/* Mobile Tab Pills */}
        <div className="flex md:hidden gap-2 mb-4 overflow-x-auto pb-2">
          <Button 
            size="sm"
            variant={activeTab === 'products' ? 'default' : 'outline'}
            onClick={() => setActiveTab('products')}
            className="min-h-[44px] whitespace-nowrap"
          >
            제품 관리
          </Button>
          <Button 
            size="sm"
            variant={activeTab === 'categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('categories')}
            className="min-h-[44px] whitespace-nowrap"
          >
            카테고리 관리
          </Button>
        </div>

        {activeTab === 'products' && (
          <>
            {/* Product Actions */}
            <div className="space-y-4 mb-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="min-h-[44px]">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">새 제품 추가</span>
                      <span className="sm:hidden">추가</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? '제품 수정' : '새 제품 추가'}
                      </DialogTitle>
                    </DialogHeader>
                    <ProductForm
                      formData={formData}
                      categories={categories}
                      isEditing={!!editingProduct}
                      onFormChange={handleFormChange}
                      onSave={handleSave}
                      onCancel={() => { setIsDialogOpen(false); resetForm(); }}
                    />
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="min-h-[44px]"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{isUploading ? '업로드 중...' : 'CSV 대량 업로드'}</span>
                    <span className="sm:hidden">{isUploading ? '...' : '업로드'}</span>
                  </Button>
                  <Button variant="outline" onClick={downloadProductTemplate} className="min-h-[44px]">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">템플릿</span>
                  </Button>
                  <Button variant="outline" onClick={handleExportProducts} className="min-h-[44px]">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">내보내기</span>
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <CategoryFilter
                categories={categories}
                selectedMainCategory={filterMainCategory}
                selectedSubcategory={filterSubcategory}
                onMainCategoryChange={(value) => {
                  setFilterMainCategory(value);
                  setFilterSubcategory('');
                }}
                onSubcategoryChange={setFilterSubcategory}
                onClear={clearFilters}
              />

              {/* Filter Result Info */}
              {(filterMainCategory || filterSubcategory) && (
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length}개 제품 표시 (전체 {products.length}개)
                </p>
              )}
            </div>

            {/* Products Table */}
            <ProductTable
              products={filteredProducts}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {activeTab === 'categories' && (
          <>
            {/* Category Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
                setIsCategoryDialogOpen(open);
                if (!open) resetCategoryForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px]">
                    <Plus className="mr-2 h-4 w-4" />
                    새 카테고리 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="cat_name">카테고리명</Label>
                      <Input
                        id="cat_name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        placeholder="카테고리 이름"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat_slug">슬러그 (URL)</Label>
                      <Input
                        id="cat_slug"
                        value={categoryFormData.slug}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                        placeholder="category-slug"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat_description">설명</Label>
                      <Textarea
                        id="cat_description"
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        placeholder="카테고리 설명"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat_image_url">썸네일 이미지 URL</Label>
                      <Input
                        id="cat_image_url"
                        value={categoryFormData.image_url}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parent_id">상위 카테고리 (대분류)</Label>
                      <select
                        id="parent_id"
                        value={categoryFormData.parent_id}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, parent_id: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-base"
                      >
                        <option value="">없음 (대분류)</option>
                        {mainCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="cat_order">표시 순서</Label>
                      <Input
                        id="cat_order"
                        type="number"
                        value={categoryFormData.display_order}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, display_order: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => {
                        setIsCategoryDialogOpen(false);
                        resetCategoryForm();
                      }} className="min-h-[44px]">
                        <X className="mr-2 h-4 w-4" />
                        취소
                      </Button>
                      <Button onClick={handleSaveCategory} className="min-h-[44px]">
                        <Save className="mr-2 h-4 w-4" />
                        저장
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Categories Display */}
            <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-4">카테고리 구조</h3>
              <div className="space-y-4">
                {mainCategories.length === 0 ? (
                  <p className="text-muted-foreground">등록된 대분류 카테고리가 없습니다.</p>
                ) : (
                  mainCategories.map((mainCat) => (
                    <div key={mainCat.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-sm text-muted-foreground">#{mainCat.display_order}</span>
                          <h4 className="font-bold text-primary">{mainCat.name}</h4>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {mainCat.slug}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCategory(mainCat)} className="min-h-[44px] min-w-[44px]">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(mainCat.id)} className="min-h-[44px] min-w-[44px]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Subcategories */}
                      <div className="ml-0 sm:ml-6 mt-3 space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">소분류:</p>
                        {getSubcategories(mainCat.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">소분류 없음</p>
                        ) : (
                          getSubcategories(mainCat.id).map((subCat) => (
                            <div key={subCat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/50 p-3 rounded">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">#{subCat.display_order}</span>
                                <span className="text-base">{subCat.name}</span>
                                <span className="text-xs text-muted-foreground">({subCat.slug})</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditCategory(subCat)} className="min-h-[44px] min-w-[44px]">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(subCat.id)} className="min-h-[44px] min-w-[44px]">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
