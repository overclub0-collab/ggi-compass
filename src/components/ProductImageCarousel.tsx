import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface ProductImageCarouselProps {
  images: string[];
  productTitle: string;
}

export const ProductImageCarousel = ({ images, productTitle }: ProductImageCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Filter out empty/null images and ensure at least placeholder
  const validImages = images.filter(img => img && img.trim() !== '');
  const displayImages = validImages.length > 0 ? validImages : ['/placeholder.svg'];

  return (
    <div className="space-y-4 w-full max-w-[800px] mx-auto">
      {/* Main Image Carousel */}
      <Carousel 
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent>
          {displayImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="rounded-2xl overflow-hidden bg-white shadow-xl aspect-[4/3] flex items-center justify-center p-4 md:p-6">
                <img
                  src={image}
                  alt={`${productTitle} - 이미지 ${index + 1}`}
                  className="w-full h-auto max-h-[500px] object-contain"
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {displayImages.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>

      {/* Thumbnail Navigation */}
      {displayImages.length > 1 && (
        <div className="flex justify-center gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all bg-white p-1",
                selectedIndex === index 
                  ? "border-primary ring-2 ring-primary/30" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={image}
                alt={`썸네일 ${index + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
