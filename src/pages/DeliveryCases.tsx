import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Building2, Package, Tag, ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DeliveryCase {
  id: string;
  client_name: string;
  product_name: string | null;
  model_name: string | null;
  identifier: string | null;
  images: string[];
  thumbnail_index: number;
  created_at: string;
}

const DeliveryCases = () => {
  const [cases, setCases] = useState<DeliveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<DeliveryCase | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_cases_public' as any)
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCases(data.map((item: any) => ({
        ...item,
        client_name: item.client_name || '납품 사례',
      })));
    }
    setLoading(false);
  };

  const openGallery = (caseItem: DeliveryCase, imageUrl: string) => {
    setSelectedCase(caseItem);
    setSelectedImage(imageUrl);
  };

  const closeGallery = () => {
    setSelectedCase(null);
    setSelectedImage(null);
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            납품사례
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            GGI가 성공적으로 납품한 다양한 프로젝트들을 확인해 보세요.
          </p>
        </div>
      </section>

      {/* Cases Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                등록된 납품사례가 없습니다
              </h3>
              <p className="text-muted-foreground/70">
                곧 다양한 납품사례가 등록될 예정입니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Image Gallery Preview */}
                  {caseItem.images.length > 0 ? (
                    <div 
                      className="aspect-[4/3] relative overflow-hidden cursor-pointer"
                      onClick={() => openGallery(caseItem, caseItem.images[caseItem.thumbnail_index] || caseItem.images[0])}
                    >
                      <img
                        src={caseItem.images[caseItem.thumbnail_index] || caseItem.images[0]}
                        alt={caseItem.client_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {caseItem.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                          +{caseItem.images.length - 1} 사진
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-xl font-extrabold text-primary flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {caseItem.client_name}
                    </h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {caseItem.product_name && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>{caseItem.product_name}</span>
                        </div>
                      )}
                      {caseItem.model_name && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>{caseItem.model_name}</span>
                        </div>
                      )}
                    </div>

                    {caseItem.images.length > 1 && (
                      <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-hide">
                        {caseItem.images.slice(0, 5).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => openGallery(caseItem, img)}
                            className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                          >
                            <img
                              src={img}
                              alt={`${caseItem.client_name} ${idx + 1}`}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                        {caseItem.images.length > 5 && (
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                            +{caseItem.images.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Image Gallery Modal */}
      <Dialog open={!!selectedImage} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {selectedImage && selectedCase && (
            <div className="relative">
              <img
                src={selectedImage}
                alt={selectedCase.client_name}
                className="w-full max-h-[80vh] object-contain"
              />
              
              {selectedCase.images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex justify-center gap-2 overflow-x-auto">
                    {selectedCase.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === img 
                            ? 'border-primary ring-2 ring-primary/50' 
                            : 'border-transparent hover:border-white/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${selectedCase.client_name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default DeliveryCases;
