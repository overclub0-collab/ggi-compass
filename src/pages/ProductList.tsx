import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const ProductList = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'order');

  // Map slug to category info
  const categoryMap: Record<string, { title: string; filter?: string }> = {
    'blackboard-cabinet': { title: '칠판보조장', filter: 'blackboard-cabinet' },
    'workstation': { title: '워크스테이션', filter: 'workstation' },
    'office-chair': { title: '오피스체어', filter: 'office-chair' },
    'cafeteria-furniture': { title: '식당가구', filter: 'cafeteria-furniture' },
    'all': { title: '전체 제품' },
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      const category = categorySlug ? categoryMap[categorySlug] : null;
      setCategoryTitle(category?.title || '전체 제품');

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // If specific category from URL, filter by slug pattern or category field
      if (categorySlug && categorySlug !== 'all' && category?.filter) {
        query = query.or(`slug.ilike.%${category.filter}%,category.ilike.%${category.title}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [categorySlug]);

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
          product.badges?.some(badge => badge.toLowerCase().includes(query))
      );
    }

    // Category filter (only when on "all" page)
    if (categorySlug === 'all' && selectedCategory !== 'all') {
      result = result.filter((product) => product.category === selectedCategory);
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
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'order') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [products, searchQuery, selectedCategory, sortBy, categorySlug]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('order');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || sortBy !== 'order';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/#products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            제품 카테고리로 돌아가기
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-black text-primary mb-4">{categoryTitle}</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length}개의 제품
              {filteredProducts.length !== products.length && ` (전체 ${products.length}개 중)`}
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-card rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제품명, 설명, 뱃지로 검색..."
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

              {/* Category Filter (only show on "all" page) */}
              {categorySlug === 'all' && categories.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 카테고리</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort Select */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
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
                  필터 초기화
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    검색: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    카테고리: {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {sortBy !== 'order' && (
                  <Badge variant="secondary" className="gap-1">
                    정렬: {sortBy === 'name-asc' ? '이름순' : sortBy === 'name-desc' ? '이름역순' : '최신순'}
                    <button onClick={() => setSortBy('order')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="text-center py-12">
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
                <Link to="/#products">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    돌아가기
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/products/detail/${product.slug}`}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {product.category && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.badges?.slice(0, 2).map((badge) => (
                        <Badge
                          key={badge}
                          variant="secondary"
                          className="bg-accent/10 text-accent border-0 font-medium text-xs"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-primary font-medium group-hover:text-accent transition-colors">
                      상세 보기
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductList;
