import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Award, History, Eye, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CompanySection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  display_order: number;
}

const sectionIcons: Record<string, React.ReactNode> = {
  hero: <Building2 className="h-6 w-6" />,
  greeting: <MessageSquare className="h-6 w-6" />,
  vision: <Eye className="h-6 w-6" />,
  history: <History className="h-6 w-6" />,
  certifications: <Award className="h-6 w-6" />,
};

const About = () => {
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('company_info')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data) setSections(data as CompanySection[]);
      setIsLoading(false);
    };
    fetchSections();
  }, []);

  const heroSection = sections.find(s => s.section_key === 'hero');
  const otherSections = sections.filter(s => s.section_key !== 'hero');

  if (isLoading) {
    return (
      <PageLayout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {heroSection?.image_url && (
              <img
                src={heroSection.image_url}
                alt="회사 대표 이미지"
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl mx-auto mb-8 shadow-lg border-4 border-background"
              />
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary mb-4">
              {heroSection?.title || '주식회사 지지아이'}
            </h1>
            {heroSection?.content && (
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                {heroSection.content}
              </p>
            )}
          </div>
        </section>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
          {otherSections.map((section, idx) => (
            <section
              key={section.id}
              className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}
            >
              {section.image_url && (
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <img
                    src={section.image_url}
                    alt={section.title || ''}
                    className="w-full rounded-xl shadow-md object-cover aspect-[4/3]"
                  />
                </div>
              )}
              <div className={`flex-1 ${!section.image_url ? 'w-full' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {sectionIcons[section.section_key] || <Building2 className="h-5 w-5" />}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {section.content}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="bg-primary/5 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-3">문의 및 견적 요청</h3>
            <p className="text-muted-foreground mb-6">제품에 대한 궁금한 점이나 견적이 필요하시면 언제든지 연락해 주세요.</p>
            <Link to="/inquiry">
              <Button size="lg" className="font-bold">견적/문의하기</Button>
            </Link>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};

export default About;
