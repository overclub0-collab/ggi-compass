import { useRef, useMemo } from 'react';
import { Edges, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types/planner';

const EDGE_COLOR = '#2a2a2a';
const SELECTED_EDGE = '#0066cc';

// Watercolor-style matte material
function sketchMat(color: string, opacity = 1) {
  return new THREE.MeshLambertMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
}

// Darken a color slightly for accents
function darken(color: string, amount = 0.15): string {
  const c = new THREE.Color(color);
  c.multiplyScalar(1 - amount);
  return `#${c.getHexString()}`;
}

function lighten(color: string, amount = 0.1): string {
  const c = new THREE.Color(color);
  c.lerp(new THREE.Color('#ffffff'), amount);
  return `#${c.getHexString()}`;
}

// ========== Desk / Table model ==========
// Flat top + 4 cylinder legs
function DeskModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const topH = 0.03;
  const legR = 0.025;
  const legH = h - topH;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;

  return (
    <group>
      {/* Table top */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshLambertMaterial color={color} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* 4 Legs */}
      {[
        [-(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [-(w / 2 - 0.04), 0, (d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, (d / 2 - 0.04)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshLambertMaterial color={darken(color, 0.2)} />
          <Edges threshold={15} color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
    </group>
  );
}

// ========== Chair model ==========
// Seat + 4 legs + backrest
function ChairModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const seatH = 0.04;
  const seatY = h * 0.55;
  const legR = 0.02;
  const legH = seatY - seatH / 2;
  const backH = h - seatY;
  const backThick = 0.025;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;

  return (
    <group>
      {/* Seat */}
      <mesh position={[0, seatY, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d]} />
        <meshLambertMaterial color={color} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, seatY + backH / 2, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.9, backH, backThick]} />
        <meshLambertMaterial color={lighten(color, 0.05)} />
        <Edges threshold={15} color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* 4 Legs */}
      {[
        [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshLambertMaterial color={darken(color, 0.3)} />
          <Edges threshold={15} color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
    </group>
  );
}

// ========== Storage / Locker model ==========
// Main body + grid lines etched as thin boxes
function StorageModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const rows = Math.max(2, Math.round(h / 0.35));
  const cols = Math.max(1, Math.round(w / 0.4));

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={color} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Horizontal grid lines */}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = (h / rows) * (i + 1);
        return (
          <mesh key={`h${i}`} position={[0, y, d / 2 + 0.001]}>
            <boxGeometry args={[w * 0.96, 0.006, 0.001]} />
            <meshBasicMaterial color={darken(color, 0.35)} />
          </mesh>
        );
      })}
      {/* Vertical grid lines */}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = -(w / 2) + (w / cols) * (i + 1);
        return (
          <mesh key={`v${i}`} position={[x, h / 2, d / 2 + 0.001]}>
            <boxGeometry args={[0.006, h * 0.96, 0.001]} />
            <meshBasicMaterial color={darken(color, 0.35)} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== Blackboard cabinet model ==========
// Thin back panel + bottom cabinet + frame
function BlackboardCabinetModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const cabinetH = h * 0.35;
  const boardH = h * 0.6;
  const boardThick = 0.02;

  return (
    <group>
      {/* Bottom cabinet */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabinetH, d]} />
        <meshLambertMaterial color={color} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, cabinetH / 2, d / 2 + 0.001]}>
        <boxGeometry args={[0.005, cabinetH * 0.85, 0.001]} />
        <meshBasicMaterial color={darken(color, 0.3)} />
      </mesh>
      {/* Back board panel (whiteboard/blackboard area) */}
      <mesh position={[0, cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]} castShadow>
        <boxGeometry args={[w, boardH, boardThick]} />
        <meshLambertMaterial color="#e8e5dc" />
        <Edges threshold={15} color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Board frame - top */}
      <mesh position={[0, cabinetH + boardH, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[w + 0.02, 0.03, boardThick + 0.01]} />
        <meshLambertMaterial color={darken(color, 0.15)} />
      </mesh>
      {/* Board frame - bottom (chalk tray) */}
      <mesh position={[0, cabinetH, -(d / 2 - 0.04)]}>
        <boxGeometry args={[w * 0.95, 0.02, 0.06]} />
        <meshLambertMaterial color={darken(color, 0.1)} />
      </mesh>
    </group>
  );
}

// ========== Sofa model ==========
function SofaModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const seatH = h * 0.45;
  const backH = h * 0.55;
  const armW = w * 0.08;
  const cushionD = d * 0.85;

  return (
    <group>
      {/* Seat base */}
      <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d]} />
        <meshLambertMaterial color={color} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Back cushion */}
      <mesh position={[0, seatH + backH / 2, -(d / 2 - 0.08)]} castShadow>
        <boxGeometry args={[w * 0.92, backH, 0.15]} />
        <meshLambertMaterial color={lighten(color, 0.08)} />
        <Edges threshold={15} color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-(w / 2 - armW / 2), seatH + backH * 0.3, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.6, cushionD]} />
        <meshLambertMaterial color={darken(color, 0.08)} />
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Right armrest */}
      <mesh position={[(w / 2 - armW / 2), seatH + backH * 0.3, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.6, cushionD]} />
        <meshLambertMaterial color={darken(color, 0.08)} />
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
    </group>
  );
}

// ========== Shelf model ==========
function ShelfModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const shelfCount = Math.max(2, Math.round(h / 0.35));
  const shelfThick = 0.02;
  const sideThick = 0.02;

  return (
    <group>
      {/* Left side panel */}
      <mesh position={[-(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        <meshLambertMaterial color={darken(color, 0.1)} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        <meshLambertMaterial color={darken(color, 0.1)} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, h / 2, -(d / 2 - 0.005)]} castShadow>
        <boxGeometry args={[w - sideThick * 2, h, 0.008]} />
        <meshLambertMaterial color={lighten(color, 0.05)} />
      </mesh>
      {/* Shelves */}
      {Array.from({ length: shelfCount + 1 }, (_, i) => {
        const y = (h / shelfCount) * i;
        return (
          <mesh key={i} position={[0, y + shelfThick / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - sideThick * 2, shelfThick, d]} />
            <meshLambertMaterial color={color} />
            <Edges threshold={15} color={edgeColor} lineWidth={1} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== Generic fallback box ==========
function GenericModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshLambertMaterial color={color} />
      <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 3 : 1.5} />
    </mesh>
  );
}

// ========== Category detection ==========
function detectFurnitureType(item: PlacedFurniture): string {
  const name = (item.furniture.name || '').toLowerCase();
  const cat = (item.furniture.category || '').toLowerCase();

  // Blackboard cabinet keywords
  if (name.includes('칠판') || name.includes('보조장') || name.includes('blackboard')) return 'blackboard';
  // Chair
  if (name.includes('의자') || name.includes('chair') || cat.includes('chair')) return 'chair';
  // Sofa
  if (name.includes('소파') || name.includes('sofa') || cat.includes('sofa')) return 'sofa';
  // Storage / Locker
  if (name.includes('사물함') || name.includes('수납') || name.includes('서랍') || name.includes('캐비닛') || name.includes('locker') || cat.includes('storage')) return 'storage';
  // Shelf / Bookcase
  if (name.includes('선반') || name.includes('책장') || name.includes('shelf') || cat.includes('shelf')) return 'shelf';
  // Desk / Table (default for most furniture)
  if (name.includes('책상') || name.includes('테이블') || name.includes('강연대') || name.includes('desk') || name.includes('table') || cat.includes('desk') || cat.includes('table')) return 'desk';
  // Lab bench
  if (name.includes('실험대') || name.includes('lab')) return 'desk';

  return 'generic';
}

// ========== Main exported component ==========
export function FurnitureObject({ item, isSelected, onSelect }: {
  item: PlacedFurniture;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Convert mm to meters
  const w = item.furniture.width / 1000;
  const d = item.furniture.height / 1000;   // "height" in 2D = depth in 3D
  const h = (item.furniture.depth || 750) / 1000;

  const roomScale = 0.1;
  const posX = (item.x / roomScale) / 1000 + w / 2;
  const posZ = (item.y / roomScale) / 1000 + d / 2;

  const baseColor = item.furniture.color || '#c8b89a';
  const furnitureType = useMemo(() => detectFurnitureType(item), [item]);

  const ModelComponent = useMemo(() => {
    switch (furnitureType) {
      case 'desk': return DeskModel;
      case 'chair': return ChairModel;
      case 'storage': return StorageModel;
      case 'blackboard': return BlackboardCabinetModel;
      case 'sofa': return SofaModel;
      case 'shelf': return ShelfModel;
      default: return GenericModel;
    }
  }, [furnitureType]);

  return (
    <group
      ref={groupRef}
      position={[posX, 0, posZ]}
      rotation={[0, -(item.rotation * Math.PI) / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      <ModelComponent w={w} d={d} h={h} color={baseColor} isSelected={isSelected} />

      {/* Name label above */}
      <Text
        position={[0, h + 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="#222"
        anchorX="center"
        anchorY="middle"
        maxWidth={w * 1.5}
        font={undefined}
      >
        {item.furniture.name}
      </Text>
      {/* Dimension label */}
      <Text
        position={[0, h + 0.06, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.065}
        color="#777"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {item.furniture.width}×{item.furniture.height}×{item.furniture.depth || 750}
      </Text>
    </group>
  );
}
