import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Image as ImageIcon, Images } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images?: string[] | null;
  main_category: string | null;
  subcategory: string | null;
  procurement_id: string | null;
  price: string | null;
  display_order: number | null;
}

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductTable = ({
  products,
  isLoading,
  onEdit,
  onDelete,
}: ProductTableProps) => {
  const getImageCount = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images.length;
    }
    return product.image_url ? 1 : 0;
  };

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">순서</TableHead>
              <TableHead className="w-24">이미지</TableHead>
              <TableHead>품명</TableHead>
              <TableHead>대분류</TableHead>
              <TableHead>소분류</TableHead>
              <TableHead>조달번호</TableHead>
              <TableHead>가격</TableHead>
              <TableHead className="w-28">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    <span>로딩 중...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  등록된 제품이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.display_order}</TableCell>
                  <TableCell>
                    <div className="relative">
                      {product.image_url || (product.images && product.images[0]) ? (
                        <img
                          src={product.images?.[0] || product.image_url || ''}
                          alt={product.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      {getImageCount(product) > 1 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {getImageCount(product)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {product.title}
                  </TableCell>
                  <TableCell className="text-sm">{product.main_category || '-'}</TableCell>
                  <TableCell className="text-sm">{product.subcategory || '-'}</TableCell>
                  <TableCell className="text-sm font-mono">{product.procurement_id || '-'}</TableCell>
                  <TableCell className="text-sm">{product.price || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(product)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(product.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              <span>로딩 중...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            등록된 제품이 없습니다.
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-shrink-0">
                  {product.image_url || (product.images && product.images[0]) ? (
                    <img
                      src={product.images?.[0] || product.image_url || ''}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {getImageCount(product) > 1 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {getImageCount(product)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate">{product.title}</h3>
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>{product.main_category || '미분류'} {product.subcategory && `> ${product.subcategory}`}</p>
                    {product.procurement_id && (
                      <p className="font-mono text-xs">조달번호: {product.procurement_id}</p>
                    )}
                    {product.price && <p>가격: {product.price}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                  className="flex-1 min-h-[44px]"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(product.id)}
                  className="min-h-[44px] px-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductTable;
