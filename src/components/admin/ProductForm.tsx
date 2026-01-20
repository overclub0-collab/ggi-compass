import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageDropzone from './ImageDropzone';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface ProductFormData {
  slug: string;
  title: string;
  description: string;
  images: string[];
  image_url: string;
  badges: string;
  features: string;
  specs: string;
  main_category: string;
  subcategory: string;
  display_order: number;
  procurement_id: string;
  price: string;
}

interface ProductFormProps {
  formData: ProductFormData;
  categories: Category[];
  isEditing: boolean;
  onFormChange: (data: Partial<ProductFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm = ({
  formData,
  categories,
  isEditing,
  onFormChange,
  onSave,
  onCancel,
}: ProductFormProps) => {
  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (mainSlug: string) => {
    const main = mainCategories.find(c => c.slug === mainSlug);
    if (!main) return [];
    return categories.filter(c => c.parent_id === main.id);
  };

  const handleImagesChange = (images: string[]) => {
    onFormChange({ 
      images, 
      image_url: images[0] || '' 
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slug">슬러그 (URL)</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => onFormChange({ slug: e.target.value })}
            placeholder="product-name"
          />
        </div>
        <div>
          <Label htmlFor="title">품명 *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormChange({ title: e.target.value })}
            placeholder="제품명"
            required
          />
        </div>
      </div>

      {/* Procurement & Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="procurement_id">조달식별번호</Label>
          <Input
            id="procurement_id"
            value={formData.procurement_id}
            onChange={(e) => onFormChange({ procurement_id: e.target.value })}
            placeholder="12345678"
          />
        </div>
        <div>
          <Label htmlFor="price">가격</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => onFormChange({ price: e.target.value })}
            placeholder="500,000"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">제품설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder="제품의 주요 장점과 특징을 설명해주세요"
          rows={3}
        />
      </div>

      {/* Multi-Image Upload */}
      <div>
        <Label>제품 이미지 (최대 3장)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          첫 번째 이미지가 목록용 대표 썸네일로 사용됩니다
        </p>
        <ImageDropzone
          images={formData.images}
          onChange={handleImagesChange}
          maxImages={3}
        />
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="main_category">대분류</Label>
          <Select
            value={formData.main_category}
            onValueChange={(value) => onFormChange({ main_category: value, subcategory: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="대분류 선택" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subcategory">소분류</Label>
          <Select
            value={formData.subcategory}
            onValueChange={(value) => onFormChange({ subcategory: value })}
            disabled={!formData.main_category}
          >
            <SelectTrigger>
              <SelectValue placeholder="소분류 선택" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategories(formData.main_category).map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Display Order */}
      <div className="w-full sm:w-1/2">
        <Label htmlFor="display_order">표시 순서</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) => onFormChange({ display_order: Number(e.target.value) })}
        />
      </div>

      {/* Badges */}
      <div>
        <Label htmlFor="badges">뱃지 (쉼표로 구분)</Label>
        <Input
          id="badges"
          value={formData.badges}
          onChange={(e) => onFormChange({ badges: e.target.value })}
          placeholder="MAS 등록, KS 인증, 친환경"
        />
      </div>

      {/* Features */}
      <div>
        <Label htmlFor="features">주요 특징 (줄바꿈으로 구분)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => onFormChange({ features: e.target.value })}
          placeholder="특징 1&#10;특징 2&#10;특징 3"
          rows={4}
        />
      </div>

      {/* Specs */}
      <div>
        <Label htmlFor="specs">규격/사양 (JSON 형식)</Label>
        <Textarea
          id="specs"
          value={formData.specs}
          onChange={(e) => onFormChange({ specs: e.target.value })}
          placeholder='{"규격": "W1200 x D600 x H750", "재질": "스틸", "색상": "화이트"}'
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          예: {`{"규격": "W1200 x D600 x H750", "재질": "스틸"}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto min-h-[44px]">
          <X className="mr-2 h-4 w-4" />
          취소
        </Button>
        <Button onClick={onSave} className="w-full sm:w-auto min-h-[44px]">
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? '수정 저장' : '제품 추가'}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
