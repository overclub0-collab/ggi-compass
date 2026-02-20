import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowLeft, Search, X, SlidersHorizontal, ChevronRight, Heart, ShoppingCart, CheckSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  badges: string[] | null;
  features: string[] | null;
  specs: string | null;
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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGE_SIZE = 12;

const ProductListNew = () => {
  const { mainCategory, subCategory } = useParams<{ mainCategory: string; subCategory?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<{ title: string; description?: string }>({ title: '전체 제품' });
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter / pagination state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'order');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Fetch categories once ───────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // ─── Server-side fetch (with pagination) ────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (categories.length === 0) return;
    setIsLoading(true);
    setSelectedIds(new Set());

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Category filter
    if (mainCategory && mainCategory !== 'all') {
      const mainCat = categories.find(c => c.slug === mainCategory && !c.parent_id);
      if (subCategory && mainCat) {
        query = query.eq('subcategory', subCategory);
        const subCat = categories.find(c => c.slug === subCategory && c.parent_id === mainCat.id);
        setCategoryInfo({
          title: subCat?.name || subCategory,
          description: subCat?.description || `${mainCat.name} > ${subCat?.name ?? subCategory}`,
        });
      } else if (mainCat) {
        query = query.eq('main_category', mainCategory);
        setCategoryInfo({ title: mainCat.name, description: mainCat.description });
      }
    } else {
      setCategoryInfo({ title: '전체 제품', description: '모든 제품을 한눈에 확인하세요' });
    }

    // Search filter (server-side ILIKE)
    if (searchQuery.trim()) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,procurement_id.ilike.%${searchQuery}%`
      );
    }

    // Sort
    switch (sortBy) {
      case 'name-asc':
        query = query.order('title', { ascending: true });
        break;
      case 'name-desc':
        query = query.order('title', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('display_order', { ascending: true });
    }

    // Paginate
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (!error && data) {
      setProducts(data as Product[]);
      setTotalCount(count ?? 0);
    }
    setIsLoading(false);
  }, [categories, mainCategory, subCategory, searchQuery, sortBy, currentPage, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page on filter/category change
  useEffect(() => {
    setCurrentPage(1);
  }, [mainCategory, subCategory, searchQuery, sortBy, pageSize]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'order') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [searchQuery, sortBy]);

  const hasActiveFilters = !!(searchQuery || sortBy !== 'order');
  const clearFilters = () => { setSearchQuery(''); setSortBy('order'); };

  // ─── Selection helpers ───────────────────────────────────────────────────
  const allPageIds = products.map(p => p.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => new Set([...prev, ...allPageIds]));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkWishlist = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    toast({ title: `관심상품 등록`, description: `${count}개의 제품이 관심상품에 추가되었습니다.` });
    setSelectedIds(new Set());
  };

  const handleBulkCart = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    toast({ title: `장바구니 담기`, description: `${count}개의 제품이 장바구니에 추가되었습니다.` });
    setSelectedIds(new Set());
  };

  // ─── Pagination helpers ──────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getPageNumbers = () => {
    const delta = 2;
    const pages: (number | 'ellipsis')[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('ellipsis');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // ─── Breadcrumb ──────────────────────────────────────────────────────────
  const getBreadcrumbs = () => {
    const crumbs = [{ label: '홈', to: '/' }, { label: '제품', to: '/product/all' }];
    if (mainCategory && mainCategory !== 'all') {
      const mainCat = categories.find(c => c.slug === mainCategory && !c.parent_id);
      if (mainCat) {
        crumbs.push({ label: mainCat.name, to: `/product/${mainCategory}` });
        if (subCategory) {
          const subCat = categories.find(c => c.slug === subCategory);
          if (subCat) crumbs.push({ label: subCat.name, to: `/product/${mainCategory}/${subCategory}` });
        }
      }
    }
    return crumbs;
  };

  return (
    <PageLayout>
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            {getBreadcrumbs().map((crumb, index, arr) => (
              <span key={crumb.to} className="flex items-center gap-2">
                {index === arr.length - 1 ? (
                  <span className="text-primary font-medium">{crumb.label}</span>
                ) : (
                  <>
                    <Link to={crumb.to} className="hover:text-primary transition-colors">{crumb.label}</Link>
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
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-black text-primary mb-1">{categoryInfo.title}</h1>
                {categoryInfo.description && (
                  <p className="text-muted-foreground text-sm">{categoryInfo.description}</p>
                )}
              </div>

              {/* ── Controls bar ──────────────────────────────────── */}
              <div className="bg-card rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
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

                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {/* Sort */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SlidersHorizontal className="h-4 w-4 mr-2 shrink-0" />
                        <SelectValue placeholder="정렬" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">기본 순서</SelectItem>
                        <SelectItem value="name-asc">이름 (가나다순)</SelectItem>
                        <SelectItem value="name-desc">이름 (역순)</SelectItem>
                        <SelectItem value="newest">최신순</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Page size */}
                    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                      <SelectTrigger className="w-full sm:w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(n => (
                          <SelectItem key={n} value={String(n)}>{n}개씩 보기</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap shrink-0">
                        <X className="h-4 w-4 mr-1" />초기화
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Bulk action toolbar ────────────────────────────── */}
              <div className={`transition-all duration-200 overflow-hidden ${selectedIds.size > 0 ? 'max-h-20 mb-4' : 'max-h-0'}`}>
                <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
                  <CheckSquare className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm font-medium text-accent">{selectedIds.size}개 선택됨</span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={handleBulkWishlist} className="gap-1.5">
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline">관심상품 등록</span>
                      <span className="sm:hidden">찜</span>
                    </Button>
                    <Button size="sm" onClick={handleBulkCart} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">장바구니 담기</span>
                      <span className="sm:hidden">담기</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Product count & select-all row ──────────────────── */}
              {!isLoading && products.length > 0 && (
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all" className="cursor-pointer select-none">
                      현재 페이지 전체 선택
                    </label>
                  </div>
                  <span>
                    전체 <strong className="text-primary">{totalCount.toLocaleString()}</strong>개 제품 중{' '}
                    {((currentPage - 1) * pageSize + 1).toLocaleString()}–
                    {Math.min(currentPage * pageSize, totalCount).toLocaleString()}번째
                  </span>
                </div>
              )}

              {/* ── Products Grid ────────────────────────────────────── */}
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl">
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.'}
                  </p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />필터 초기화
                    </Button>
                  ) : (
                    <Link to="/">
                      <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />홈으로 돌아가기
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {products.map((product) => (
                    <div key={product.id} className="relative group">
                      {/* Checkbox overlay */}
                      <div
                        className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                          selectedIds.has(product.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(product.id); }}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                          selectedIds.has(product.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background/90 border-border hover:border-primary'
                        }`}>
                          {selectedIds.has(product.id) && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Selection highlight border */}
                      <div className={`absolute inset-0 rounded-xl border-2 pointer-events-none z-10 transition-colors ${
                        selectedIds.has(product.id) ? 'border-primary' : 'border-transparent'
                      }`} />

                      <ProductCard
                        id={product.id}
                        slug={product.slug}
                        title={product.title}
                        description={product.description}
                        image_url={product.image_url}
                        specs={product.specs}
                        procurement_id={product.procurement_id}
                        price={product.price}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Pagination ────────────────────────────────────────── */}
              {!isLoading && totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent className="flex-wrap gap-1 justify-center">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => { e.preventDefault(); setCurrentPage(page as number); }}
                              className="cursor-pointer min-w-[40px] justify-center"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  <p className="text-center text-xs text-muted-foreground mt-2">
                    {currentPage} / {totalPages} 페이지
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default ProductListNew;
