import { Badge } from '@/components/ui/badge';

interface ProductInfoTableProps {
  modelName: string | null;
  title: string;
  specs: string | null;
  procurementId: string | null;
  price: string | null;
  badges?: string[] | null;
}

// Format price with commas and 원 suffix
const formatPrice = (priceStr: string | null): string => {
  if (!priceStr) return '가격 문의';
  const numericPrice = priceStr.replace(/[^0-9]/g, '');
  if (!numericPrice) return priceStr;
  return Number(numericPrice).toLocaleString('ko-KR') + '원';
};

export const ProductInfoTable = ({
  modelName,
  title,
  specs,
  procurementId,
  price,
  badges,
}: ProductInfoTableProps) => {
  return (
    <div className="space-y-4">
      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge 
              key={badge} 
              variant="secondary" 
              className="bg-accent/10 text-accent border-0 font-medium"
            >
              {badge}
            </Badge>
          ))}
        </div>
      )}

      {/* Model Name - Most Prominent (모델명 최상단 강조) */}
      {modelName && (
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-primary leading-tight uppercase tracking-wide">
          {modelName}
        </h1>
      )}

      {/* Product Title (품명) */}
      <h2 className={`font-bold text-foreground ${modelName ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl text-primary'}`}>
        {title}
      </h2>

      {/* Info Table - 6 key fields displayed clearly */}
      <div className="bg-muted/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm md:text-base">
          <tbody>
            {/* 모델명 row */}
            {modelName && (
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-semibold text-primary bg-muted/50 w-28 md:w-36 whitespace-nowrap">
                  모델명
                </td>
                <td className="py-3 px-4 text-foreground font-bold uppercase">
                  {modelName}
                </td>
              </tr>
            )}
            {/* 품명 row */}
            <tr className="border-b border-border/50">
              <td className="py-3 px-4 font-semibold text-primary bg-muted/50 w-28 md:w-36 whitespace-nowrap">
                품명
              </td>
              <td className="py-3 px-4 text-foreground">
                {title}
              </td>
            </tr>
            {/* 규격 row - plain text, no parsing */}
            {specs && (
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-semibold text-primary bg-muted/50 whitespace-nowrap align-top">
                  규격
                </td>
                <td className="py-3 px-4 text-foreground whitespace-pre-line">
                  {specs}
                </td>
              </tr>
            )}
            {/* 조달식별번호 row */}
            {procurementId && (
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-semibold text-primary bg-muted/50 whitespace-nowrap">
                  조달식별번호
                </td>
                <td className="py-3 px-4 text-muted-foreground font-mono">
                  {procurementId}
                </td>
              </tr>
            )}
            {/* 가격 row */}
            <tr>
              <td className="py-3 px-4 font-semibold text-primary bg-muted/50 whitespace-nowrap">
                조달가격
              </td>
              <td className="py-3 px-4">
                <span className="text-lg md:text-xl font-bold text-accent">
                  {formatPrice(price)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
