import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { InquiryForm } from '@/components/InquiryForm';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const InquiryPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-4 sm:mb-6 uppercase tracking-widest">
              Contact Us
            </div>
            <h1 className="heading-fluid-lg font-black text-primary mb-4">
              견적/문의
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              제품에 관한 문의사항이나 견적 요청을 남겨주시면<br className="hidden sm:block" />
              담당자가 확인 후 빠르게 연락드리겠습니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-primary rounded-xl p-6 text-primary-foreground">
                <h3 className="font-bold text-lg mb-4">연락처 정보</h3>
                <div className="space-y-4">
                  <a href="tel:02-1800-7631" className="flex items-center gap-3 hover:text-accent transition-colors">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">전화번호</p>
                      <p className="font-medium">02-1800-7631</p>
                    </div>
                  </a>
                  <a href="mailto:ggigagu@naver.com" className="flex items-center gap-3 hover:text-accent transition-colors">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">이메일</p>
                      <p className="font-medium">ggigagu@naver.com</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">주소</p>
                      <p className="font-medium">경기도 김포시 월곶면 애기봉로 468</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">영업시간</p>
                      <p className="font-medium">평일 09:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-bold text-primary mb-3">빠른 견적 안내</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    필요한 제품의 조달번호를 알려주시면 더 빠른 견적이 가능합니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    대량 구매 시 할인 혜택이 적용될 수 있습니다.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    나라장터/학교장터(S2B) 수의계약도 가능합니다.
                  </li>
                </ul>
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-2">
              <InquiryForm />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InquiryPage;
