import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  specs: Record<string, any> | null;
  procurement_id: string | null;
  price: string | null;
}

export const ProductCard = ({
  slug,
  title,
  description,
  image_url,
  specs,
  procurement_id,
  price,
}: ProductCardProps) => {
  // Extract model name and specifications from specs or title
  const modelName = specs?.model || specs?.modelName || specs?.['모델명'] || null;
  const dimensions = specs?.dimensions || specs?.size || specs?.['규격'] || null;

  // Format price with commas
  const formatPrice = (priceStr: string | null) => {
    if (!priceStr) return null;
    // Remove non-numeric characters except for the number itself
    const numericPrice = priceStr.replace(/[^0-9]/g, '');
    if (!numericPrice) return priceStr;
    return Number(numericPrice).toLocaleString('ko-KR') + '원';
  };

  return (
    <Link
      to={`/product/detail/${slug}`}
      className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex flex-col"
    >
      {/* Product Image - Square ratio with white background */}
      <div className="aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
        <img
          src={image_url || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Model Name - Most Prominent */}
        {modelName && (
          <h3 className="text-lg md:text-xl font-black text-primary mb-1 group-hover:underline decoration-2 underline-offset-2 transition-all line-clamp-1">
            {modelName}
          </h3>
        )}

        {/* Product Name */}
        <p className={`font-semibold text-foreground mb-1 line-clamp-1 ${modelName ? 'text-sm md:text-base' : 'text-base md:text-lg font-bold text-primary group-hover:underline'}`}>
          {title}
        </p>

        {/* Dimensions/Specs */}
        {dimensions && (
          <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-1">
            {dimensions}
          </p>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-1 min-h-2" />

        {/* Bottom Section: Procurement ID & Price */}
        <div className="mt-auto pt-3 border-t border-border/50">
          {/* Procurement ID */}
          {procurement_id && (
            <p className="text-xs text-muted-foreground/70 mb-2 font-mono">
              조달식별번호: {procurement_id}
            </p>
          )}

          {/* Price - Accent Color */}
          {price && (
            <p className="text-right text-base md:text-lg font-bold text-accent">
              {formatPrice(price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
