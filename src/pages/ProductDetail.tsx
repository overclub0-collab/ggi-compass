import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', productId)
        .maybeSingle();

      if (!error && data) {
        setProduct(data);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
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
          <Link to="/#products">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              제품 목록으로 돌아가기
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const specs = product.specs as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/#products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            제품 목록으로 돌아가기
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop'}
                alt={product.title}
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {product.badges?.map((badge) => (
                  <Badge
                    key={badge}
                    variant="secondary"
                    className="bg-accent/10 text-accent border-0 font-medium"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-4xl font-black text-primary mb-4">{product.title}</h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-primary mb-4">주요 특징</h2>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs */}
              {specs && Object.keys(specs).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-primary mb-4">제품 사양</h2>
                  <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium text-primary w-24">{key}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact CTA */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-3">견적 및 문의</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  제품에 대한 자세한 견적이나 문의사항이 있으시면 연락주세요.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Phone className="mr-2 h-4 w-4" />
                    전화 문의
                  </Button>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    이메일 문의
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
