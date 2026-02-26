import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { downloadProductTemplate } from '@/lib/excelUtils';
import { downloadExcelTemplateWithImageGuide } from '@/lib/excelTemplateGenerator';

interface ProductBulkUploadProps {
  onComplete?: () => void;
}

const ProductBulkUpload = ({ onComplete }: ProductBulkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, progress, pendingFile, preParseFile, confirmUpload, cancelUpload } = useExcelUpload({ onComplete });
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    await preParseFile(file);
    setIsParsing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    await confirmUpload();
  };

  const getStatusText = () => {
    if (!progress) return '';
    switch (progress.status) {
      case 'parsing': return '파일 분석 중...';
      case 'uploading-images': return `이미지 업로드 중 (${progress.current}/${progress.total}): ${progress.currentProduct}`;
      case 'inserting': return `데이터베이스 저장 중 (${progress.current}/${progress.total})`;
      case 'done': return '완료!';
      default: return '';
    }
  };

  const getProgressPercent = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isParsing}
          className="min-h-[44px]"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isParsing ? '파일 분석 중...' : isUploading ? '업로드 중...' : '대용량 업로드'}
        </Button>

        <Button variant="outline" onClick={downloadProductTemplate} className="min-h-[44px]" disabled={isUploading}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV 템플릿
        </Button>

        <Button variant="outline" onClick={downloadExcelTemplateWithImageGuide} className="min-h-[44px]" disabled={isUploading}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 템플릿 (이미지 가이드)
        </Button>
      </div>

      {isUploading && progress && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getStatusText()}</span>
            <span className="font-medium">{getProgressPercent()}%</span>
          </div>
          <Progress value={getProgressPercent()} className="h-2" />
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <strong>CSV</strong>: 기존 방식, 이미지 URL만 지원</p>
        <p>• <strong>Excel (.xlsx)</strong>: 엑셀 내 삽입된 이미지 자동 추출 및 업로드</p>
        <p>• 이미지는 해당 행(Row)에 삽입하면 자동으로 매핑됩니다.</p>
        <p>• 행당 최대 3개 이미지, 각 이미지 최대 5MB까지 지원</p>
      </div>

      <AlertDialog open={!!pendingFile} onOpenChange={(open) => { if (!open) cancelUpload(); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>업로드 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  <strong>{pendingFile?.rowCount}개</strong>의 품목을 업로드하는 것이 맞습니까?
                </p>
                {pendingFile?.duplicates && pendingFile.duplicates.length > 0 && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                    <p className="font-semibold text-destructive mb-1">
                      ⚠️ 중복 품목 {pendingFile.duplicates.length}개 발견
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto text-muted-foreground">
                      {pendingFile.duplicates.slice(0, 20).map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                      {pendingFile.duplicates.length > 20 && (
                        <li>...외 {pendingFile.duplicates.length - 20}개</li>
                      )}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      중복 품목은 새로운 슬러그로 등록됩니다.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>예</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductBulkUpload;
