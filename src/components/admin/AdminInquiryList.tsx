import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  MessageSquare, 
  Search, 
  Eye, 
  Check, 
  Clock, 
  Send, 
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

interface AdminInquiryListProps {
  onInquiryUpdate?: () => void;
}

export const AdminInquiryList = ({ onInquiryUpdate }: AdminInquiryListProps) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      toast.error('문의 목록을 불러오는데 실패했습니다.');
    } else {
      setInquiries(data as Inquiry[] || []);
    }
    setIsLoading(false);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch = 
      inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.phone.includes(searchQuery) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.admin_reply || '');
  };

  const handleSaveReply = async () => {
    if (!selectedInquiry) return;

    setIsSaving(true);
    
    const updateData: any = {
      admin_reply: replyText.trim() || null,
      status: replyText.trim() ? 'answered' : 'pending',
    };

    if (replyText.trim()) {
      updateData.replied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('inquiries')
      .update(updateData)
      .eq('id', selectedInquiry.id);

    if (error) {
      console.error('Update error:', error);
      toast.error('저장에 실패했습니다.');
    } else {
      // 답변이 있으면 이메일 발송
      if (replyText.trim()) {
        try {
          const emailResponse = await supabase.functions.invoke('send-reply-email', {
            body: {
              customerName: selectedInquiry.name,
              customerEmail: selectedInquiry.email,
              inquiryTitle: selectedInquiry.title,
              inquiryContent: selectedInquiry.content,
              adminReply: replyText.trim(),
            },
          });
          
          if (emailResponse.error) {
            console.error('Email send error:', emailResponse.error);
            toast.success('답변이 저장되었습니다. (이메일 발송 실패)');
          } else {
            toast.success('답변이 저장되고 이메일이 발송되었습니다.');
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
          toast.success('답변이 저장되었습니다. (이메일 발송 실패)');
        }
      } else {
        toast.success('답변이 저장되었습니다.');
      }
      setSelectedInquiry(null);
      fetchInquiries();
      onInquiryUpdate?.();
    }
    setIsSaving(false);
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('이 문의를 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      toast.error('삭제에 실패했습니다.');
    } else {
      toast.success('문의가 삭제되었습니다.');
      fetchInquiries();
      onInquiryUpdate?.();
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

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">문의 관리</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount}건 답변 대기
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchInquiries}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름, 연락처, 이메일, 제목으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            <Clock className="w-4 h-4 mr-1" />
            답변대기
          </Button>
          <Button
            variant={statusFilter === 'answered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('answered')}
          >
            <Check className="w-4 h-4 mr-1" />
            답변완료
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              로딩 중...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? '검색 결과가 없습니다.' 
                : '접수된 문의가 없습니다.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">상태</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead className="hidden sm:table-cell">작성자</TableHead>
                      <TableHead className="hidden md:table-cell">연락처</TableHead>
                      <TableHead className="hidden lg:table-cell">접수일</TableHead>
                      <TableHead className="w-[100px]">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <Badge variant={inquiry.status === 'answered' ? 'default' : 'secondary'}>
                            {inquiry.status === 'answered' ? (
                              <><Check className="w-3 h-3 mr-1" />완료</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" />대기</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleViewInquiry(inquiry)}
                            className="text-left hover:text-primary hover:underline"
                          >
                            {inquiry.title}
                          </button>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{inquiry.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{inquiry.phone}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {formatDate(inquiry.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewInquiry(inquiry)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 py-4">
              {/* Inquiry Info */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedInquiry.title}</CardTitle>
                    <Badge variant={selectedInquiry.status === 'answered' ? 'default' : 'secondary'}>
                      {selectedInquiry.status === 'answered' ? '답변완료' : '답변대기'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">작성자:</span>{' '}
                      <span className="font-medium">{selectedInquiry.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">연락처:</span>{' '}
                      <span className="font-medium">{selectedInquiry.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">이메일:</span>{' '}
                      <span className="font-medium">{selectedInquiry.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">접수일:</span>{' '}
                      <span className="font-medium">{formatDate(selectedInquiry.created_at)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm mb-2">문의 내용</p>
                    <p className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                      {selectedInquiry.content}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Reply Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">관리자 답변</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  답변을 작성하면 자동으로 '답변완료' 상태로 변경됩니다.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                  닫기
                </Button>
                <Button onClick={handleSaveReply} disabled={isSaving}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSaving ? '저장 중...' : '답변 저장'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
