import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  LogOut, 
  Plus, 
  Save, 
  X, 
  Download,
  Menu,
  Package,
  Search,
  MessageSquare,
  Building2,
  Users,
  LayoutDashboard,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getErrorMessage, logError } from '@/lib/errorUtils';
import { exportProductsToCSV } from '@/lib/excelUtils';
import CategoryTree from '@/components/admin/CategoryTree';
import ProductForm from '@/components/admin/ProductForm';
import DraggableProductCard from '@/components/admin/DraggableProductCard';
import { AdminInquiryList } from '@/components/admin/AdminInquiryList';
import AdminDeliveryCaseList from '@/components/admin/AdminDeliveryCaseList';
import AdminUserRoleManager from '@/components/admin/AdminUserRoleManager';
import ProductBulkUpload from '@/components/admin/ProductBulkUpload';
import AdminCatalogManager from '@/components/admin/AdminCatalogManager';
import AdminCompanyInfo from '@/components/admin/AdminCompanyInfo';
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard';
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
  specs: string | null;
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

const ITEMS_PER_PAGE = 20;

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'catalogs' | 'inquiries' | 'delivery-cases' | 'users' | 'company'>('dashboard');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>('');
  
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

  // Filtered products based on selected category and search
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory) {
      const isMainCategory = !selectedCategory.parent_id;
      if (isMainCategory) {
        // Show products in this main category or its subcategories
        if (product.main_category !== selectedCategory.slug) return false;
      } else {
        // Show only products in this specific subcategory
        if (product.subcategory !== selectedCategory.slug) return false;
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.title.toLowerCase().includes(query) ||
        product.procurement_id?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };
  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  // Bulk selection
  const allPageSelected = pagedProducts.length > 0 && pagedProducts.every(p => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pagedProducts.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pagedProducts.forEach(p => next.add(p.id));
        return next;
      });
    }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택된 ${selectedIds.size}개 제품을 삭제하시겠습니까?`)) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('products').delete().in('id', ids);
    if (error) {
      toast.error('일괄 삭제 실패: ' + error.message);
    } else {
      toast.success(`${ids.length}개 제품이 삭제되었습니다.`);
      setSelectedIds(new Set());
      fetchProducts();
    }
  };

  const handleBulkCategoryChange = async () => {
    if (selectedIds.size === 0 || !bulkCategoryTarget) return;
    const targetCat = categories.find(c => c.id === bulkCategoryTarget);
    if (!targetCat) return;
    const isMain = !targetCat.parent_id;
    const parentCat = isMain ? null : categories.find(c => c.id === targetCat.parent_id);
    const updateData = isMain
      ? { main_category: targetCat.slug, subcategory: null }
      : { main_category: parentCat?.slug || '', subcategory: targetCat.slug };
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('products').update(updateData).in('id', ids);
    if (error) {
      toast.error('카테고리 변경 실패: ' + error.message);
    } else {
      toast.success(`${ids.length}개 제품의 카테고리가 변경되었습니다.`);
      setSelectedIds(new Set());
      setBulkCategoryTarget('');
      fetchProducts();
    }
  };

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
    setNewCategoryParentId(null);
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
      specs: product.specs || '',
      main_category: product.main_category || '',
      subcategory: product.subcategory || '',
      display_order: product.display_order || 0,
      procurement_id: product.procurement_id || '',
      price: product.price || '',
    });
    setIsProductDialogOpen(true);
  };

  const handleAddProductToCategory = (category: Category) => {
    resetForm();
    
    // Determine main_category and subcategory based on category hierarchy
    const isMainCategory = !category.parent_id;
    if (isMainCategory) {
      setFormData(prev => ({
        ...prev,
        main_category: category.slug,
        subcategory: '',
      }));
    } else {
      const parentCategory = categories.find(c => c.id === category.parent_id);
      setFormData(prev => ({
        ...prev,
        main_category: parentCategory?.slug || '',
        subcategory: category.slug,
      }));
    }
    
    setIsProductDialogOpen(true);
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

  const handleAddCategory = (parentId: string | null) => {
    resetCategoryForm();
    setNewCategoryParentId(parentId);
    if (parentId) {
      setCategoryFormData(prev => ({ ...prev, parent_id: parentId }));
    }
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.`)) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) {
      logError('Delete category', error);
      toast.error(getErrorMessage(error));
    } else {
      toast.success('카테고리가 삭제되었습니다.');
      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
      }
      fetchCategories();
    }
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    // specs is now stored as plain text, no JSON parsing needed
    const specsText = formData.specs?.trim() || null;

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
        specs: specsText,
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

      setIsProductDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      logError('Save product', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('카테고리명은 필수입니다.');
      return;
    }

    try {
      const categoryData = {
        name: categoryFormData.name,
        slug: categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, '-'),
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

  const handleProductDrop = async (productId: string, targetCategory: Category) => {
    const isMainCategory = !targetCategory.parent_id;
    
    try {
      let updateData: { main_category: string; subcategory: string | null };
      
      if (isMainCategory) {
        updateData = {
          main_category: targetCategory.slug,
          subcategory: null,
        };
      } else {
        const parentCategory = categories.find(c => c.id === targetCategory.parent_id);
        updateData = {
          main_category: parentCategory?.slug || '',
          subcategory: targetCategory.slug,
        };
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
      
      toast.success(`제품이 "${targetCategory.name}" 카테고리로 이동되었습니다.`);
      fetchProducts();
    } catch (error: any) {
      logError('Move product', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleExportProducts = () => {
    const dataToExport = filteredProducts.length > 0 ? filteredProducts : products;
    const filename = selectedCategory 
      ? `제품_${selectedCategory.name}.csv`
      : '제품_전체.csv';
    exportProductsToCSV(dataToExport, filename);
    toast.success(`${dataToExport.length}개 제품을 내보냈습니다.`);
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

  const CategoryTreeSidebar = (
    <CategoryTree
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={handleCategorySelect}
      onAddProduct={handleAddProductToCategory}
      onEditCategory={handleEditCategory}
      onDeleteCategory={handleDeleteCategory}
      onAddCategory={handleAddCategory}
      onProductDrop={handleProductDrop}
    />
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle - Only show for products tab */}
            {activeTab === 'products' && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden min-h-[44px] min-w-[44px]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>카테고리 관리</SheetTitle>
                  </SheetHeader>
                  <div className="p-2 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {CategoryTreeSidebar}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-primary">관리자 대시보드</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">{user.email}</p>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleLogout} className="min-h-[44px]">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
            className="min-h-[40px] flex-shrink-0"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            대시보드
          </Button>
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className="min-h-[40px] flex-shrink-0"
          >
            <Package className="h-4 w-4 mr-2" />
            제품 관리
          </Button>
          <Button
            variant={activeTab === 'catalogs' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('catalogs')}
            className="min-h-[40px] flex-shrink-0"
          >
            <FileText className="h-4 w-4 mr-2" />
            카탈로그
          </Button>
          <Button
            variant={activeTab === 'delivery-cases' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('delivery-cases')}
            className="min-h-[40px] flex-shrink-0"
          >
            <Building2 className="h-4 w-4 mr-2" />
            납품사례
          </Button>
          <Button
            variant={activeTab === 'inquiries' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('inquiries')}
            className="min-h-[40px] flex-shrink-0"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            문의 관리
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="min-h-[40px] flex-shrink-0"
          >
            <Users className="h-4 w-4 mr-2" />
            사용자 관리
          </Button>
          <Button
            variant={activeTab === 'company' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('company')}
            className="min-h-[40px] flex-shrink-0"
          >
            <Building2 className="h-4 w-4 mr-2" />
            기업소개
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar - Only show for products tab */}
        {activeTab === 'products' && (
          <aside className="hidden lg:block w-80 xl:w-96 border-r bg-card overflow-y-auto flex-shrink-0">
            <div className="p-4">
              {CategoryTreeSidebar}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <AdminDashboard onNavigateToInquiries={() => setActiveTab('inquiries')} />
          ) : activeTab === 'products' ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="제품명, 조달번호로 검색..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 min-h-[44px]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      resetForm();
                      if (selectedCategory) {
                        handleAddProductToCategory(selectedCategory);
                      } else {
                        setIsProductDialogOpen(true);
                      }
                    }}
                    className="min-h-[44px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">제품 추가</span>
                    <span className="sm:hidden">추가</span>
                  </Button>
                  <ProductBulkUpload onComplete={fetchProducts} />
                  <Button variant="outline" onClick={handleExportProducts} className="min-h-[44px]">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">내보내기</span>
                  </Button>
                </div>
              </div>

              {/* Category Info + Bulk Toolbar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="현재 페이지 전체 선택"
                      className="h-4 w-4"
                    />
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedCategory ? selectedCategory.name : '전체 제품'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (총 {filteredProducts.length}개 · 페이지 {currentPage}/{Math.max(totalPages, 1)})
                    </span>
                    {selectedIds.size > 0 && (
                      <span className="text-sm font-semibold text-primary">{selectedIds.size}개 선택됨</span>
                    )}
                  </div>
                  {selectedCategory && (
                    <Button variant="ghost" size="sm" onClick={() => handleCategorySelect(null)} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />필터 해제
                    </Button>
                  )}
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <span className="text-sm font-medium text-primary">{selectedIds.size}개 선택</span>
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Select value={bulkCategoryTarget} onValueChange={setBulkCategoryTarget}>
                        <SelectTrigger className="h-8 w-48">
                          <SelectValue placeholder="카테고리 일괄 변경..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.parent_id ? `  └ ${cat.name}` : cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!bulkCategoryTarget}
                        onClick={handleBulkCategoryChange}
                        className="h-8"
                      >
                        <FolderOpen className="h-3.5 w-3.5 mr-1" />
                        카테고리 변경
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkDelete}
                        className="h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        선택 삭제
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIds(new Set())}
                        className="h-8 text-muted-foreground"
                      >
                        선택 해제
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>등록된 제품이 없습니다</p>
                    {selectedCategory && (
                      <Button variant="link" className="mt-2" onClick={() => handleAddProductToCategory(selectedCategory)}>
                        이 카테고리에 제품 추가하기
                      </Button>
                    )}
                  </div>
                ) : (
                  pagedProducts.map((product) => (
                    <DraggableProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isSelected={selectedIds.has(product.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`el-${i}`} className="flex items-center px-2 text-muted-foreground text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                              currentPage === p
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3"
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

          ) : activeTab === 'catalogs' ? (
            <div className="p-4 sm:p-6">
              <AdminCatalogManager />
            </div>
          ) : activeTab === 'delivery-cases' ? (
            <div className="p-4 sm:p-6">
              <AdminDeliveryCaseList />
            </div>
          ) : activeTab === 'inquiries' ? (
            <div className="p-4 sm:p-6">
              <AdminInquiryList />
            </div>
          ) : activeTab === 'users' ? (
            <div className="p-4 sm:p-6">
              <h2 className="text-xl font-bold mb-6">사용자 역할 관리</h2>
              <AdminUserRoleManager />
            </div>
          ) : activeTab === 'company' ? (
            <AdminCompanyInfo />
          ) : null}
        </main>
      </div>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        setIsProductDialogOpen(open);
        if (!open) resetForm();
      }}>
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
            onCancel={() => { setIsProductDialogOpen(false); resetForm(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cat_name">카테고리명 *</Label>
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
                placeholder="category-slug (자동 생성)"
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
              <Label htmlFor="parent_id">상위 카테고리</Label>
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
  );
};

export default Admin;
