-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  badges TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table for simple admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone" 
  ON public.products 
  FOR SELECT 
  USING (is_active = true);

-- Products can be managed by authenticated users (admins)
CREATE POLICY "Authenticated users can manage products" 
  ON public.products 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin users can only be read by authenticated users
CREATE POLICY "Admin users readable by authenticated" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default products
INSERT INTO public.products (slug, title, description, image_url, badges, features, specs, category, display_order) VALUES
  ('blackboard-cabinet', '칠판보조장', '효율적인 수납과 슬라이딩 시스템으로 교실 정면의 완성도를 높이는 프리미엄 칠판보조장.', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop', ARRAY['MAS 등록', '조달청 식별번호 보유'], ARRAY['슬라이딩 도어 시스템으로 편리한 수납', '내구성 높은 멜라민 마감재', '다양한 사이즈 맞춤 제작 가능', '교실 환경에 최적화된 설계'], '{"재질": "고급 멜라민 합판", "색상": "화이트, 우드톤 등 선택 가능", "인증": "KS 인증, 친환경 인증"}'::jsonb, '교육가구', 1),
  ('workstation', '워크스테이션', '업무 효율성을 극대화하는 모듈형 워크스테이션. 다양한 공간에 맞춤 설치 가능.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop', ARRAY['KS 인증', '모듈형 설계'], ARRAY['모듈형 설계로 공간 맞춤 구성', '케이블 정리 시스템 내장', '인체공학적 작업 환경 제공', '확장 및 재배치 용이'], '{"재질": "스틸 프레임 + 멜라민 상판", "색상": "그레이, 화이트, 우드톤", "인증": "KS 인증"}'::jsonb, '사무가구', 2),
  ('office-chair', '오피스체어', '인체공학적 설계로 장시간 착석에도 편안한 프리미엄 오피스체어.', 'https://images.unsplash.com/photo-1589384267710-7a25bc5b4862?q=80&w=1200&auto=format&fit=crop', ARRAY['인체공학', '높이 조절형'], ARRAY['인체공학적 등받이 설계', '높이 및 팔걸이 조절 기능', '통기성 좋은 메쉬 소재', '360도 회전 및 이동 용이'], '{"재질": "메쉬 + 고밀도 폼", "색상": "블랙, 그레이", "인증": "인체공학 인증"}'::jsonb, '사무가구', 3),
  ('cafeteria-furniture', '식당가구', '공공기관 식당에 최적화된 내구성 높은 식당 테이블 및 의자 세트.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop', ARRAY['친환경 소재', '고강도 내구성'], ARRAY['고강도 내구성 설계', '청소 및 관리 용이', '다양한 배치 구성 가능', '친환경 소재 사용'], '{"재질": "스틸 프레임 + HPL 상판", "색상": "화이트, 그레이, 우드톤", "인증": "친환경 인증"}'::jsonb, '식당가구', 4);