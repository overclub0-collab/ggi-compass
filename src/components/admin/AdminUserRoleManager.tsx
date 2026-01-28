import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Trash2, Shield, Users, Search } from 'lucide-react';
import { getErrorMessage, logError } from '@/lib/errorUtils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  user_email?: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: '관리자',
  moderator: '중간관리자',
  user: '일반 사용자',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  moderator: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export const AdminUserRoleManager = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      logError('Fetch user roles', error);
      toast.error('사용자 역할을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleAddUserRole = async () => {
    if (!newUserEmail.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // First, look up the user by email
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error('인증 세션이 만료되었습니다.');
        return;
      }

      // Look up user
      const lookupResponse = await supabase.functions.invoke('manage-user-role', {
        body: { action: 'lookup', email: newUserEmail },
      });

      if (lookupResponse.error) {
        throw new Error(lookupResponse.error.message || '사용자 조회에 실패했습니다.');
      }

      const lookupData = lookupResponse.data;
      
      if (!lookupData.found) {
        toast.error('해당 이메일로 가입된 사용자가 없습니다.');
        setIsSubmitting(false);
        return;
      }

      // Add the role
      const addResponse = await supabase.functions.invoke('manage-user-role', {
        body: { 
          action: 'add', 
          user_id: lookupData.user_id, 
          role: newUserRole 
        },
      });

      if (addResponse.error) {
        throw new Error(addResponse.error.message || '역할 추가에 실패했습니다.');
      }

      const roleLabel = ROLE_LABELS[newUserRole];
      toast.success(`${newUserEmail} 사용자에게 ${roleLabel} 역할이 부여되었습니다.`);
      
      setIsAddDialogOpen(false);
      setNewUserEmail('');
      setNewUserRole('admin');
      fetchUserRoles();
    } catch (error) {
      logError('Add user role', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userRole: UserRole, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', userRole.id);

      if (error) throw error;
      
      toast.success(`역할이 ${ROLE_LABELS[newRole]}(으)로 변경되었습니다.`);
      fetchUserRoles();
    } catch (error) {
      logError('Update user role', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteRole = async (userRole: UserRole) => {
    // Prevent deleting the last admin
    const adminCount = userRoles.filter(ur => ur.role === 'admin').length;
    if (userRole.role === 'admin' && adminCount <= 1) {
      toast.error('마지막 관리자는 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('이 사용자의 역할을 삭제하시겠습니까? 삭제 후 해당 사용자는 관리자 페이지에 접근할 수 없습니다.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRole.id);

      if (error) throw error;
      
      toast.success('사용자 역할이 삭제되었습니다.');
      fetchUserRoles();
    } catch (error) {
      logError('Delete user role', error);
      toast.error(getErrorMessage(error));
    }
  };

  const filteredUserRoles = userRoles.filter(ur => {
    if (!searchQuery) return true;
    return ur.user_id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const adminCount = userRoles.filter(ur => ur.role === 'admin').length;
  const moderatorCount = userRoles.filter(ur => ur.role === 'moderator').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">관리자</p>
              <p className="text-2xl font-bold">{adminCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Users className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">중간관리자</p>
              <p className="text-2xl font-bold">{moderatorCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 역할 수</p>
              <p className="text-2xl font-bold">{userRoles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="사용자 ID로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          역할 추가
        </Button>
      </div>

      {/* User Roles Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자 ID</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredUserRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  등록된 사용자 역할이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredUserRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell className="font-mono text-sm">
                    {userRole.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Select
                      value={userRole.role}
                      onValueChange={(value: AppRole) => handleUpdateRole(userRole, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[userRole.role]}`}>
                            {ROLE_LABELS[userRole.role]}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.admin}`}>
                            {ROLE_LABELS.admin}
                          </span>
                        </SelectItem>
                        <SelectItem value="moderator">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.moderator}`}>
                            {ROLE_LABELS.moderator}
                          </span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.user}`}>
                            {ROLE_LABELS.user}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(userRole.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRole(userRole)}
                      disabled={userRole.role === 'admin' && adminCount <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 관리자 역할 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">사용자 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                해당 이메일로 가입한 사용자가 있어야 합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <Select value={newUserRole} onValueChange={(v: AppRole) => setNewUserRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="moderator">중간관리자</SelectItem>
                  <SelectItem value="user">일반 사용자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddUserRole} disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRoleManager;
