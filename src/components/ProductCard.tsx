import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  specs: string | null;
  procurement_id: string | null;
  price: string | null;
}

// Format price with commas and 원 suffix
const formatPrice = (priceStr: string | null): string | null => {
  if (!priceStr) return null;
  // Remove non-numeric characters
  const numericPrice = priceStr.replace(/[^0-9]/g, '');
  if (!numericPrice) return priceStr;
  return Number(numericPrice).toLocaleString('ko-KR') + '원';
};

export const ProductCard = ({
  slug,
  title,
  image_url,
  specs,
  procurement_id,
  price,
}: ProductCardProps) => {
  // specs is plain text (규격 field) - no parsing needed
  const dimensions = specs || null;

  return (
    <Link
      to={`/product/detail/${slug}`}
      className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex flex-col"
    >
      {/* 1. Product Image - Square ratio with white background */}
      <div className="aspect-square overflow-hidden bg-white flex items-center justify-center p-4">
        <img
          src={image_url || '/placeholder.svg'}
          alt={title}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* 2. Model Name (slug) - Most prominent, top position */}
        <p className="text-lg md:text-xl font-extrabold text-primary group-hover:underline mb-1 line-clamp-1 uppercase tracking-wide">
          {slug}
        </p>

        {/* 3. Product Name (품명) */}
        <p className="font-semibold text-sm md:text-base text-foreground mb-1 line-clamp-1">
          {title}
        </p>

        {/* 4. Specifications (규격) - plain text display */}
        {dimensions && (
          <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2 whitespace-pre-line">
            {dimensions}
          </p>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-1 min-h-2" />

        {/* Bottom Section: Procurement ID & Price */}
        <div className="mt-auto pt-3 border-t border-border/50 space-y-1">
          {/* 5. Procurement ID (조달식별번호) */}
          {procurement_id && (
            <p className="text-xs text-muted-foreground/80 font-mono truncate">
              조달번호: {procurement_id}
            </p>
          )}

          {/* 6. Price (가격) - Accent Color, emphasized */}
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
