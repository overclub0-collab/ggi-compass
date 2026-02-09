// Planner Types
export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  width: number; // mm
  height: number; // mm (depth for top-view)
  price: number;
  thumbnail: string;
  color?: string;
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  x: number; // px position on canvas
  y: number; // px position on canvas
  rotation: number; // degrees (0, 90, 180, 270)
  furniture: FurnitureItem;
}

export interface RoomDimensions {
  width: number; // mm
  height: number; // mm
}

export interface PlannerState {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  scale: number; // px per mm
}

// Sample furniture data
export const FURNITURE_CATEGORIES = [
  { id: 'desk', name: '책상', icon: 'Monitor' },
  { id: 'chair', name: '의자', icon: 'Armchair' },
  { id: 'storage', name: '수납장', icon: 'Archive' },
  { id: 'table', name: '테이블', icon: 'Square' },
  { id: 'sofa', name: '소파', icon: 'Sofa' },
  { id: 'shelf', name: '선반', icon: 'BookOpen' },
] as const;

export const SAMPLE_FURNITURE: FurnitureItem[] = [
  // Desks
  { id: 'desk-1', name: 'MALM 책상', category: 'desk', width: 1400, height: 650, price: 189000, thumbnail: '', color: 'hsl(45, 30%, 85%)' },
  { id: 'desk-2', name: 'BEKANT 전동책상', category: 'desk', width: 1600, height: 800, price: 599000, thumbnail: '', color: 'hsl(0, 0%, 95%)' },
  { id: 'desk-3', name: 'MICKE 책상', category: 'desk', width: 1050, height: 500, price: 89000, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  
  // Chairs
  { id: 'chair-1', name: 'MARKUS 의자', category: 'chair', width: 620, height: 620, price: 249000, thumbnail: '', color: 'hsl(0, 0%, 20%)' },
  { id: 'chair-2', name: 'JÄRVFJÄLLET 의자', category: 'chair', width: 680, height: 680, price: 399000, thumbnail: '', color: 'hsl(210, 20%, 30%)' },
  { id: 'chair-3', name: 'LÅNGFJÄLL 의자', category: 'chair', width: 680, height: 680, price: 319000, thumbnail: '', color: 'hsl(45, 50%, 90%)' },
  
  // Storage
  { id: 'storage-1', name: 'KALLAX 선반', category: 'storage', width: 770, height: 390, price: 69900, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  { id: 'storage-2', name: 'BILLY 책장', category: 'storage', width: 800, height: 280, price: 59900, thumbnail: '', color: 'hsl(45, 30%, 85%)' },
  { id: 'storage-3', name: 'ALEX 서랍장', category: 'storage', width: 360, height: 580, price: 99900, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  
  // Tables
  { id: 'table-1', name: 'LISABO 테이블', category: 'table', width: 1400, height: 780, price: 249000, thumbnail: '', color: 'hsl(30, 40%, 70%)' },
  { id: 'table-2', name: 'TÄRENDÖ 테이블', category: 'table', width: 1100, height: 670, price: 39900, thumbnail: '', color: 'hsl(0, 0%, 10%)' },
  { id: 'table-3', name: 'EKEDALEN 테이블', category: 'table', width: 1200, height: 800, price: 299000, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  
  // Sofas
  { id: 'sofa-1', name: 'KLIPPAN 소파', category: 'sofa', width: 1800, height: 880, price: 299000, thumbnail: '', color: 'hsl(210, 15%, 60%)' },
  { id: 'sofa-2', name: 'LANDSKRONA 소파', category: 'sofa', width: 2040, height: 890, price: 799000, thumbnail: '', color: 'hsl(30, 20%, 40%)' },
  { id: 'sofa-3', name: 'EKTORP 소파', category: 'sofa', width: 2180, height: 880, price: 599000, thumbnail: '', color: 'hsl(0, 0%, 95%)' },
  
  // Shelves
  { id: 'shelf-1', name: 'LACK 벽선반', category: 'shelf', width: 1100, height: 260, price: 14900, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  { id: 'shelf-2', name: 'EKET 수납장', category: 'shelf', width: 700, height: 350, price: 35000, thumbnail: '', color: 'hsl(0, 0%, 100%)' },
  { id: 'shelf-3', name: 'BERGSHULT 선반', category: 'shelf', width: 800, height: 300, price: 19900, thumbnail: '', color: 'hsl(30, 40%, 65%)' },
];
