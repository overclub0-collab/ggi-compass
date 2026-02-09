import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlacedFurniture } from '@/types/planner';
import { toast } from 'sonner';

interface ConsultationDialogProps {
  open: boolean;
  onClose: () => void;
  placedFurniture: PlacedFurniture[];
  totalPrice: number;
}

export const ConsultationDialog = ({
  open,
  onClose,
  placedFurniture,
  totalPrice,
}: ConsultationDialogProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const generateFurnitureList = () => {
    return placedFurniture.map(item => 
      `- ${item.furniture.name} (${item.furniture.width}×${item.furniture.height}mm) - ₩${item.furniture.price.toLocaleString()}`
    ).join('\n');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('필수 정보를 모두 입력해주세요');
      return;
    }

    // Build inquiry content
    const content = `
[공간 스타일링 시뮬레이터 상담 요청]

배치된 가구 목록:
${generateFurnitureList()}

총 견적 금액: ₩${totalPrice.toLocaleString()}

추가 메시지:
${formData.message || '없음'}
    `.trim();

    // Navigate to inquiry page with pre-filled data
    navigate('/inquiry', {
      state: {
        prefill: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          title: `[시뮬레이터] 공간 스타일링 상담 요청`,
          content,
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            상담 신청
          </DialogTitle>
          <DialogDescription>
            배치하신 가구 리스트와 함께 상담을 신청합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Furniture Summary */}
        <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
          <h4 className="text-xs font-bold text-muted-foreground mb-2">배치된 가구 목록</h4>
          <ul className="space-y-1">
            {placedFurniture.map((item) => (
              <li key={item.id} className="text-sm flex justify-between">
                <span>{item.furniture.name}</span>
                <span className="text-muted-foreground">₩{item.furniture.price.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
            <span>총 견적</span>
            <span className="text-primary">₩{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">추가 메시지</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="추가로 문의하실 내용이 있으시면 입력해주세요"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
            상담 신청하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
