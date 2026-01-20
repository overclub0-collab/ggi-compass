import { Button } from '@/components/ui/button';
import { Edit2, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  title: string;
  image_url: string | null;
  images?: string[] | null;
  main_category: string | null;
  subcategory: string | null;
  procurement_id: string | null;
  price: string | null;
  display_order: number | null;
}

interface DraggableProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

const DraggableProductCard = ({
  product,
  onEdit,
  onDelete,
  isDragging,
}: DraggableProductCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('productId', product.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getImageCount = () => {
    if (product.images && product.images.length > 0) {
      return product.images.length;
    }
    return product.image_url ? 1 : 0;
  };

  const primaryImage = product.images?.[0] || product.image_url;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div className="flex gap-3">
        {/* Drag Handle */}
        <div className="flex items-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Product Image */}
        <div className="relative flex-shrink-0">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              className="w-16 h-16 object-cover rounded-md"
              draggable={false}
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {getImageCount() > 1 && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {getImageCount()}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{product.title}</h4>
          <div className="mt-1 space-y-0.5">
            {product.procurement_id && (
              <p className="text-xs text-muted-foreground font-mono">
                조달: {product.procurement_id}
              </p>
            )}
            {product.price && (
              <p className="text-xs text-muted-foreground">
                가격: {product.price}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {product.main_category || '미분류'}
              {product.subcategory && ` > ${product.subcategory}`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraggableProductCard;
