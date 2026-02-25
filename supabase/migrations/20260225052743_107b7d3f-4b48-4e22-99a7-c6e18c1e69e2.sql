
CREATE TABLE public.company_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active company info"
  ON public.company_info FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage company info"
  ON public.company_info FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.company_info (section_key, title, content, display_order) VALUES
  ('hero', '주식회사 지지아이', '안녕하세요, 주식회사 지지아이입니다.
교육용 가구, 사무용 가구, 병영 가구 등 다양한 분야의 가구를 전문적으로 제조·공급하는 여성기업입니다.', 1),
  ('greeting', '대표이사 인사말', '저희 지지아이는 고객의 공간에 최적화된 가구 솔루션을 제공하기 위해 끊임없이 노력하고 있습니다.
품질과 신뢰를 바탕으로 나라장터 조달 등록 업체로서 공공기관, 학교, 군부대 등에 안정적인 납품 실적을 쌓아왔습니다.
앞으로도 고객 만족을 최우선으로 생각하며, 더 나은 제품과 서비스를 제공하겠습니다.', 2),
  ('vision', '비전 및 핵심가치', '고객의 공간을 가치있게 만드는 가구 전문 기업
- 품질 우선: 엄격한 품질 관리를 통한 제품 신뢰성 확보
- 고객 만족: 맞춤형 솔루션과 신속한 대응
- 지속 성장: 끊임없는 혁신과 기술 개발', 3),
  ('history', '회사 연혁', '주식회사 지지아이의 주요 연혁을 소개합니다.', 4),
  ('certifications', '인증 및 자격', '여성기업 인증, 조달청 등록 업체, 각종 품질 인증을 보유하고 있습니다.', 5);

CREATE TRIGGER update_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
