import { FileText, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlacedFurniture } from '@/types/planner';
import { toast } from 'sonner';

interface QuoteSummaryProps {
  placedFurniture: PlacedFurniture[];
  totalPrice: number;
  onClearAll: () => void;
  onConsultation: () => void;
}

export const QuoteSummary = ({
  placedFurniture,
  totalPrice,
  onClearAll,
  onConsultation,
}: QuoteSummaryProps) => {
  const handleExportPDF = () => {
    // Generate a simple text summary for now
    const summary = placedFurniture.map(item => 
      `${item.furniture.name} - ₩${item.furniture.price.toLocaleString()}`
    ).join('\n');
    
    const fullText = `
GGI 공간 스타일링 견적서
========================
배치된 가구 목록:
${summary}

------------------------
총 견적 금액: ₩${totalPrice.toLocaleString()}
========================
    `.trim();

    // Create a blob and download
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GGI_견적서_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('견적서가 다운로드되었습니다');
  };

  return (
    <div className="h-16 bg-card border-t border-border px-4 flex items-center justify-between gap-4">
      {/* Item count and total */}
      <div className="flex items-center gap-6">
        <div>
          <span className="text-xs text-muted-foreground">배치된 가구</span>
          <p className="font-bold text-foreground">{placedFurniture.length}개</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">총 견적</span>
          <p className="font-bold text-xl text-primary">
            ₩{totalPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={placedFurniture.length === 0}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          전체 삭제
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={placedFurniture.length === 0}
          className="gap-1"
        >
          <FileText className="h-4 w-4" />
          견적서 저장
        </Button>
        <Button
          size="sm"
          onClick={onConsultation}
          disabled={placedFurniture.length === 0}
          className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <MessageSquare className="h-4 w-4" />
          상담 신청
        </Button>
      </div>
    </div>
  );
};
