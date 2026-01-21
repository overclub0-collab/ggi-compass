import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Phone, Mail, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductImageCarousel } from '@/components/ProductImageCarousel';
import { ProductInfoTable } from '@/components/ProductInfoTable';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  badges: string[] | null;
  features: string[] | null;
  specs: string | null;
  main_category: string | null;
  subcategory: string | null;
  procurement_id: string | null;
  price: string | null;
}

const ProductDetail = () => {
  const { productId, productSlug } = useParams<{ productId?: string; productSlug?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const slug = productSlug || productId;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        setProduct(data as Product);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">제품을 찾을 수 없습니다</h1>
          <Link to="/product/all">
            <Button variant="outline">
              제품 목록으로 돌아가기
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // specs is plain text (규격 field) - no JSON parsing needed
  const specsString = product.specs || null;
  
  // Use slug as model name for display
  const modelName = product.slug || null;

  // Prepare images array - combine images array and image_url
  const allImages: string[] = [];
  if (product.images && product.images.length > 0) {
    allImages.push(...product.images.filter(img => img && img.trim() !== ''));
  } else if (product.image_url) {
    allImages.push(product.image_url);
  }

  // Get detail images (2nd and 3rd) for bottom section
  const detailImages = allImages.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto">
            <Link to="/" className="hover:text-primary whitespace-nowrap">홈</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/product/all" className="hover:text-primary whitespace-nowrap">제품</Link>
            {product.main_category && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <Link to={`/product/${product.main_category}`} className="hover:text-primary whitespace-nowrap">
                  {product.main_category}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-primary font-medium truncate">{product.title}</span>
          </nav>

          {/* Product Summary Section */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Image Carousel */}
            <ProductImageCarousel 
              images={allImages}
              productTitle={product.title}
            />

            {/* Right: Product Info Table */}
            <div className="space-y-6">
              <ProductInfoTable
                modelName={modelName}
                title={product.title}
                specs={specsString}
                procurementId={product.procurement_id}
                price={product.price}
                badges={product.badges}
              />

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Contact CTA */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-3">견적 및 문의</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  제품에 대한 자세한 견적이나 문의사항이 있으시면 연락주세요.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-primary hover:bg-primary/90 min-h-[44px]">
                    <Phone className="mr-2 h-4 w-4" />
                    전화 문의
                  </Button>
                  <Button variant="outline" className="min-h-[44px]">
                    <Mail className="mr-2 h-4 w-4" />
                    이메일 문의
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Description Section */}
          <div className="mt-12 md:mt-16 space-y-8">
            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-primary mb-6">주요 특징</h2>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detail Images (2nd and 3rd from upload) */}
            {detailImages.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-primary">상세 이미지</h2>
                <div className="grid gap-6">
                  {detailImages.map((image, index) => (
                    <div 
                      key={index} 
                      className="rounded-2xl overflow-hidden bg-white shadow-lg"
                    >
                      <img
                        src={image}
                        alt={`${product.title} 상세 이미지 ${index + 1}`}
                        className="w-full h-auto object-contain"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
