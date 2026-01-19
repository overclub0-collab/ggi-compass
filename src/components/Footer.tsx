import { useState } from 'react';
import { Phone, Printer, Mail, MapPin, Send, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
export const Footer = () => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.');
      setEmail('');
    }
  };
  return <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-black mb-4">G.G.I</h2>
            <div className="text-sm text-primary-foreground/80 leading-relaxed mb-6">​Global Standard
Great Design
Intelligent Specialist<span className="text-accent">G</span>lobal Standard<br />
              <span className="text-accent">G</span>reat Design<br />
              <span className="text-accent">I</span>nfrastructure Specialist
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer">
                <span className="text-xs font-bold">G2B</span>
              </div>
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer">
                <span className="text-xs font-bold">S2B</span>
              </div>
              <Link to="/admin/auth" className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-accent transition-colors cursor-pointer" title="관리자">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Business Info
            </h3>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <p><span className="text-primary-foreground/60">상호:</span> 주식회사 지지아이</p>
              <p className=""><span className="text-primary-foreground/60">대표자:</span>차경희  </p>
              <p><span className="text-primary-foreground/60">사업자등록번호:</span> 000-00-00000</p>
              <p className="text-accent font-medium">대표자: 차경희</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Contact Us
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-3 text-primary-foreground/80">
                <Phone className="w-4 h-4 text-accent" />
                02-1800-7631
              </p>
              <p className="flex items-center gap-3 text-primary-foreground/80">
                <Printer className="w-4 h-4 text-accent" />
                031-981-4997
              </p>
              <p className="flex items-center gap-3 text-primary-foreground/80">
                <Mail className="w-4 h-4 text-accent" />
                ggigagu@naver.com
              </p>
              <p className="flex items-center gap-3 text-primary-foreground/80">
                <MapPin className="w-4 h-4 text-accent" />
                경기도 김포시 월곶면 애기봉로 468     
              </p>
            </div>
          </div>

          {/* Quick Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full"></span>
              Quick Support
            </h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              견적 요청 및 제품 카탈로그 신청을 위해 연락처를 남겨주세요.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input type="email" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-accent" />
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground px-4">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary-foreground/20">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-primary-foreground/60 text-xs uppercase tracking-widest">
          © 2024 G.G.I Infrastructure. All Rights Reserved.
        </div>
      </div>
    </footer>;
};