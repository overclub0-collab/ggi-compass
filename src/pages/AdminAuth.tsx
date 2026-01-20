import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';
import { getErrorMessage, logError } from '@/lib/errorUtils';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Don't auto-redirect, let user choose to logout or go to admin
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if admin already exists - if so, disable signup
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const { count, error } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        
        if (!error && count && count > 0) {
          setSignupDisabled(true);
        }
      } catch (error) {
        logError('Check admin exists', error);
      }
    };
    
    checkAdminExists();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('로그아웃 되었습니다.');
  };

  const [currentSession, setCurrentSession] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentSession(session);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Double-check if signup should be disabled
        if (signupDisabled) {
          toast.error('새로운 계정 등록이 비활성화되었습니다. 관리자에게 문의하세요.');
          setIsLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`
          }
        });
        if (error) throw error;
        toast.success('회원가입이 완료되었습니다!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('로그인 성공!');
        navigate('/admin');
      }
    } catch (error: any) {
      logError('Auth', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {currentSession ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-primary mb-2">이미 로그인됨</h1>
              <p className="text-muted-foreground mb-2">{currentSession.user?.email}</p>
              <p className="text-sm text-muted-foreground mb-6">
                다른 계정으로 로그인하려면 먼저 로그아웃하세요.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/admin')} className="w-full">
                  관리자 페이지로 이동
                </Button>
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  로그아웃
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-primary">관리자 로그인</h1>
                <p className="text-muted-foreground mt-2">
                  제품 관리 시스템에 접근하려면 로그인하세요
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || (isSignUp && signupDisabled)}>
                  {isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
                </Button>
              </form>

              {!signupDisabled && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
