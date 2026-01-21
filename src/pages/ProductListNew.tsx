import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  badges: string[] | null;
  features: string[] | null;
  specs: Record<string, any> | null;
  main_category: string | null;
  subcategory: string | null;
  category: string | null;
  display_order: number | null;
  procurement_id: string | null;
  price: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  description?: string;
}

const ProductListNew = () => {
  const { mainCategory, subCategory } = useParams<{ mainCategory: string; subCategory?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<{ title: string; description?: string }>({ title: '전체 제품' });
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'order');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [mainCategory, subCategory, categories]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Determine category info and filter
    if (mainCategory === 'all' || !mainCategory) {
      setCategoryInfo({ title: '전체 제품', description: '모든 제품을 한눈에 확인하세요' });
    } else {
      const mainCat = categories.find(c => c.slug === mainCategory && !c.parent_id);
      
      if (subCategory) {
        const subCat = categories.find(c => c.slug === subCategory && c.parent_id === mainCat?.id);
        if (subCat) {
          setCategoryInfo({ 
            title: subCat.name, 
            description: subCat.description || `${mainCat?.name} > ${subCat.name}` 
          });
          query = query.eq('subcategory', subCategory);
        }
      } else if (mainCat) {
        setCategoryInfo({ 
          title: mainCat.name, 
          description: mainCat.description 
        });
        query = query.eq('main_category', mainCategory);
      }
    }

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.badges?.some(badge => badge.toLowerCase().includes(query)) ||
          product.procurement_id?.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'order':
      default:
        result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        break;
    }

    setFilteredProducts(result);

    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'order') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [products, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('order');
  };

  const hasActiveFilters = searchQuery || sortBy !== 'order';

  // Breadcrumb
  const getBreadcrumbs = () => {
    const crumbs = [{ label: '홈', to: '/' }, { label: '제품', to: '/product/all' }];
    
    if (mainCategory && mainCategory !== 'all') {
      const mainCat = categories.find(c => c.slug === mainCategory && !c.parent_id);
      if (mainCat) {
        crumbs.push({ label: mainCat.name, to: `/product/${mainCategory}` });
        
        if (subCategory) {
          const subCat = categories.find(c => c.slug === subCategory);
          if (subCat) {
            crumbs.push({ label: subCat.name, to: `/product/${mainCategory}/${subCategory}` });
          }
        }
      }
    }
    
    return crumbs;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            {getBreadcrumbs().map((crumb, index, arr) => (
              <span key={crumb.to} className="flex items-center gap-2">
                {index === arr.length - 1 ? (
                  <span className="text-primary font-medium">{crumb.label}</span>
                ) : (
                  <>
                    <Link to={crumb.to} className="hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </span>
            ))}
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <CategorySidebar className="w-full lg:w-64 flex-shrink-0" />

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-3xl font-black text-primary mb-2">{categoryInfo.title}</h1>
                {categoryInfo.description && (
                  <p className="text-muted-foreground">{categoryInfo.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredProducts.length}개의 제품
                  {filteredProducts.length !== products.length && ` (전체 ${products.length}개 중)`}
                </p>
              </div>

              {/* Search and Filter Section */}
              <div className="bg-card rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="제품명, 설명, 조달식별번호로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort Select */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="정렬" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">기본 순서</SelectItem>
                      <SelectItem value="name-asc">이름 (가나다순)</SelectItem>
                      <SelectItem value="name-desc">이름 (역순)</SelectItem>
                      <SelectItem value="newest">최신순</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
                      <X className="h-4 w-4 mr-2" />
                      초기화
                    </Button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl">
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.'}
                  </p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      필터 초기화
                    </Button>
                  ) : (
                    <Link to="/">
                      <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        홈으로 돌아가기
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      slug={product.slug}
                      title={product.title}
                      description={product.description}
                      image_url={product.image_url}
                      specs={product.specs}
                      procurement_id={product.procurement_id}
                      price={product.price}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListNew;
