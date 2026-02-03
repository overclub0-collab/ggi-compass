import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface Catalog {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  pdf_url: string;
  thumbnail_url: string | null;
  priority: number;
  download_count: number;
}

const Catalogs = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('catalogs')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch catalogs:', error);
      toast.error('카탈로그를 불러오는데 실패했습니다.');
    } else {
      setCatalogs(data || []);
    }
    setIsLoading(false);
  };

  const handleDownload = async (catalog: Catalog) => {
    try {
      // Track the download
      await supabase.from('catalog_downloads').insert({
        catalog_id: catalog.id,
        user_agent: navigator.userAgent,
      });

      // Increment download count
      await supabase
        .from('catalogs')
        .update({ download_count: catalog.download_count + 1 })
        .eq('id', catalog.id);

      // Update local state
      setCatalogs(prev => 
        prev.map(c => 
          c.id === catalog.id 
            ? { ...c, download_count: c.download_count + 1 }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to track download:', error);
    }

    // Open PDF in new tab
    window.open(catalog.pdf_url, '_blank');
    toast.success(`${catalog.title} 카탈로그가 새 탭에서 열립니다.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="py-8 sm:py-12">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              메인으로 돌아가기
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              카탈로그 다운로드
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              지지아이의 전문 가구 제품 카탈로그를 다운로드하세요. 
              학교, 관공서, 기업에 최적화된 다양한 제품군을 확인하실 수 있습니다.
            </p>
          </div>

          {/* Catalogs Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : catalogs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                등록된 카탈로그가 없습니다
              </h3>
              <p className="text-muted-foreground">
                곧 새로운 카탈로그가 업로드될 예정입니다.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalogs.map((catalog) => (
                <Card 
                  key={catalog.id} 
                  className="overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {catalog.thumbnail_url ? (
                      <img
                        src={catalog.thumbnail_url}
                        alt={catalog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <FileText className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    {/* Year Badge */}
                    {catalog.year && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        {catalog.year}
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-4">
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      {catalog.title}
                    </h3>
                    {catalog.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {catalog.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {catalog.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {catalog.year}년
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {catalog.download_count.toLocaleString()}회
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button 
                      onClick={() => handleDownload(catalog)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalogs;
