import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, Eye, EyeOff, Search, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LookupResult {
  id: string;
  title: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export const InquiryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    title: '',
    content: '',
    password: '',
  });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupPassword, setLookupPassword] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null);
  const [lookupDialogOpen, setLookupDialogOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privacyAgreed) {
      toast.error('개인정보 수집에 동의해 주세요.');
      return;
    }

    if (formData.password.length < 4) {
      toast.error('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-inquiry', {
        body: {
          ...formData,
          privacyAgreed,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setIsSuccess(true);
      toast.success('문의가 성공적으로 접수되었습니다.');
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        title: '',
        content: '',
        password: '',
      });
      setPrivacyAgreed(false);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || '문의 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupPhone || !lookupPassword) {
      toast.error('연락처와 비밀번호를 입력해 주세요.');
      return;
    }

    setIsLookingUp(true);
    setLookupResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('lookup-inquiry', {
        body: {
          phone: lookupPhone,
          password: lookupPassword,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setLookupResults(data.inquiries);
    } catch (error: any) {
      console.error('Lookup error:', error);
      toast.error(error.message || '조회에 실패했습니다.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">
            문의가 접수되었습니다
          </h3>
          <p className="text-muted-foreground mb-8">
            담당자가 확인 후 빠른 시일 내에 연락드리겠습니다.<br />
            문의 내용은 연락처와 비밀번호로 조회하실 수 있습니다.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline">
            새 문의 작성하기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lookup Dialog Trigger */}
      <div className="flex justify-end">
        <Dialog open={lookupDialogOpen} onOpenChange={setLookupDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              내 문의 조회하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>문의 내역 조회</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  placeholder="문의 시 입력한 연락처"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>비밀번호</Label>
                <Input
                  type="password"
                  placeholder="문의 시 설정한 비밀번호"
                  value={lookupPassword}
                  onChange={(e) => setLookupPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleLookup} 
                className="w-full"
                disabled={isLookingUp}
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                조회하기
              </Button>

              {/* Lookup Results */}
              {lookupResults && lookupResults.length > 0 && (
                <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                  {lookupResults.map((inquiry) => (
                    <Card key={inquiry.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">{inquiry.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                          inquiry.status === 'answered' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatDate(inquiry.created_at)}
                      </p>
                      {inquiry.admin_reply && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-primary mb-1">관리자 답변</p>
                          <p className="text-sm whitespace-pre-wrap">{inquiry.admin_reply}</p>
                          {inquiry.replied_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(inquiry.replied_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inquiry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            견적/문의하기
          </CardTitle>
          <CardDescription>
            문의사항을 남겨주시면 담당자가 확인 후 빠르게 연락드리겠습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  작성자명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  연락처 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="문의 조회 시 필요"
                    required
                    minLength={4}
                    className="min-h-[44px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  문의 내역 조회 시 사용됩니다 (4자 이상)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="문의 제목을 입력해 주세요"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                문의 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="문의하실 내용을 자세히 작성해 주세요.&#10;&#10;- 필요한 제품명 또는 조달번호&#10;- 예상 수량&#10;- 납품 희망일&#10;- 기타 요청사항"
                required
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Privacy Agreement */}
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="privacy"
                checked={privacyAgreed}
                onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                  개인정보 수집 및 이용 동의 <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  수집항목: 성명, 연락처, 이메일 | 수집목적: 문의 접수 및 답변 | 보유기간: 문의 처리 완료 후 1년
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full min-h-[48px] text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  접수 중...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  문의 접수하기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
