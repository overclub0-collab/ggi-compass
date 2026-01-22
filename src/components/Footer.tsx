import { Phone, Printer, Mail, MapPin, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
export const Footer = () => {
  return <footer id="contact" className="bg-primary text-primary-foreground overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">G.G.I</h2>
            <div className="text-sm text-primary-foreground/80 leading-relaxed mb-6">
              <span className="text-accent">G</span>lobal Standard<br />
              <span className="text-accent">G</span>reat Design<br />
              <span className="text-accent">I</span>ntelligent Specialist
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer touch-target">
                <span className="text-xs font-bold">G2B</span>
              </div>
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer touch-target">
                <span className="text-xs font-bold">S2B</span>
              </div>
              <Link to="/admin/auth" className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer touch-target" title="관리자">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Business Info
            </h3>
            <div className="space-y-2 sm:space-y-3 text-sm text-primary-foreground/80">
              <p><span className="text-primary-foreground/60">상호:</span> 주식회사 지지아이</p>
              
              <p><span className="text-primary-foreground/60">사업자등록번호:</span> 234-81-05951</p>
              <p className="text-accent font-medium">대표자: 차경희</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Contact Us
            </h3>
            <div className="space-y-2 sm:space-y-3 text-sm">
              <a href="tel:02-1800-7631" className="flex items-center gap-3 text-primary-foreground/80 hover:text-accent transition-colors py-1">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                02-1800-7631
              </a>
              <p className="flex items-center gap-3 text-primary-foreground/80 py-1">
                <Printer className="w-4 h-4 text-accent flex-shrink-0" />
                031-981-4997
              </p>
              <a href="mailto:ggigagu@naver.com" className="flex items-center gap-3 text-primary-foreground/80 hover:text-accent transition-colors py-1">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                ggigagu@naver.com
              </a>
              <p className="flex items-start gap-3 text-primary-foreground/80 py-1">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>경기도 김포시 월곶면 애기봉로 468</span>
              </p>
            </div>
          </div>

          {/* Quick Support - Changed to link to inquiry page */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Quick Support
            </h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              견적 요청 및 제품 문의를 남겨주시면 담당자가 확인 후 연락드리겠습니다.
            </p>
            <Link to="/inquiry">
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground min-h-[48px] font-semibold">
                <MessageSquare className="w-5 h-5 mr-2" />
                견적/문의하기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary-foreground/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-primary-foreground/60 text-xs uppercase tracking-widest">
          © 2024 G.G.I Infrastructure. All Rights Reserved.
        </div>
      </div>
    </footer>;
};