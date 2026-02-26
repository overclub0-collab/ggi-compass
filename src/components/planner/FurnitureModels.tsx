import { useRef, useMemo } from 'react';
import { Edges, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types/planner';
import { ThreeEvent } from '@react-three/fiber';

const EDGE_COLOR = '#1a1a1a';
const SELECTED_EDGE = '#0066cc';

// Material helpers
function woodMat(color: string, isSelected = false) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.75}
      metalness={0.02}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
    />
  );
}

function metalMat(color: string, isSelected = false) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.35}
      metalness={0.85}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
    />
  );
}

function plasticMat(color: string, isSelected = false) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.55}
      metalness={0.05}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
    />
  );
}

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

// Textured front face component - applies product thumbnail to front
function TexturedFrontFace({ w, h, d, thumbnail, isSelected }: {
  w: number; h: number; d: number; thumbnail: string; isSelected: boolean;
}) {
  const texture = useTexture(thumbnail);

  // Fit texture proportionally
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  return (
    <mesh position={[0, h / 2, d / 2 + 0.003]} castShadow>
      <planeGeometry args={[w * 0.95, h * 0.95]} />
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.6}
        metalness={0.05}
        emissive={isSelected ? '#001133' : '#000000'}
        emissiveIntensity={isSelected ? 0.1 : 0}
      />
    </mesh>
  );
}

// ========== Desk / Table ==========
function DeskModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const topH = 0.035;
  const legR = 0.025;
  const legH = h - topH;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;

  return (
    <group>
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {[
        [-(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [-(w / 2 - 0.04), 0, (d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, (d / 2 - 0.04)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legR, legH, 12]} />
          {metalMat(darken(color, 0.4), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
        </mesh>
      ))}
      <mesh position={[0, legH * 0.15, 0]} castShadow>
        <boxGeometry args={[w * 0.7, 0.015, 0.015]} />
        {metalMat(darken(color, 0.5), isSelected)}
      </mesh>
    </group>
  );
}

// ========== Chair ==========
function ChairModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const seatH = 0.045;
  const seatY = h * 0.52;
  const legR = 0.018;
  const legH = seatY - seatH / 2;
  const backH = h - seatY - seatH / 2;
  const backThick = 0.02;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;

  return (
    <group>
      <mesh position={[0, seatY, d * 0.05]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.95, seatH, d * 0.9]} />
        {plasticMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      <mesh position={[0, seatY + backH * 0.55, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.88, backH * 0.85, backThick]} />
        {plasticMat(lighten(color, 0.05), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[0, seatY + backH, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.92, 0.025, backThick + 0.005]} />
        {metalMat(darken(color, 0.3), isSelected)}
      </mesh>
      {[
        [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legR * 1.2, legH, 10]} />
          {metalMat(darken(color, 0.5), isSelected)}
        </mesh>
      ))}
    </group>
  );
}

// ========== Storage / Locker ==========
function StorageModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const rows = Math.max(2, Math.round(h / 0.35));
  const cols = Math.max(1, Math.round(w / 0.4));

  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {metalMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = (h / rows) * (i + 1);
        return (
          <mesh key={`h${i}`} position={[0, y, d / 2 + 0.002]}>
            <boxGeometry args={[w * 0.97, 0.008, 0.002]} />
            <meshStandardMaterial color={darken(color, 0.4)} roughness={0.5} metalness={0.6} />
          </mesh>
        );
      })}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = -(w / 2) + (w / cols) * (i + 1);
        return (
          <mesh key={`v${i}`} position={[x, h / 2, d / 2 + 0.002]}>
            <boxGeometry args={[0.008, h * 0.97, 0.002]} />
            <meshStandardMaterial color={darken(color, 0.4)} roughness={0.5} metalness={0.6} />
          </mesh>
        );
      })}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cellW = w / cols;
          const cellH = h / rows;
          const cx = -(w / 2) + cellW * c + cellW / 2;
          const cy = cellH * r + cellH / 2;
          return (
            <mesh key={`handle-${r}-${c}`} position={[cx + cellW * 0.3, cy, d / 2 + 0.008]}>
              <boxGeometry args={[0.015, 0.04, 0.008]} />
              <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ========== Blackboard Cabinet ==========
function BlackboardCabinetModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const cabinetH = h * 0.32;
  const boardH = h * 0.62;
  const boardThick = 0.025;
  const frameThick = 0.035;

  return (
    <group>
      <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabinetH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      <mesh position={[0, cabinetH / 2, d / 2 + 0.001]}>
        <boxGeometry args={[0.006, cabinetH * 0.85, 0.001]} />
        <meshStandardMaterial color={darken(color, 0.35)} roughness={0.4} metalness={0.3} />
      </mesh>
      {[-0.04, 0.04].map((xOff, i) => (
        <mesh key={i} position={[xOff, cabinetH / 2, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.05, 8]} />
          <meshStandardMaterial color="#777" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]} castShadow>
        <boxGeometry args={[w - frameThick * 2, boardH - frameThick, boardThick]} />
        <meshStandardMaterial color="#f0ede6" roughness={0.2} metalness={0.05} />
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[0, cabinetH + boardH, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[w + 0.02, frameThick, boardThick + 0.01]} />
        {woodMat(darken(color, 0.15), isSelected)}
      </mesh>
      <mesh position={[-(w / 2), cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[frameThick, boardH, boardThick + 0.01]} />
        {woodMat(darken(color, 0.15), isSelected)}
      </mesh>
      <mesh position={[(w / 2), cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[frameThick, boardH, boardThick + 0.01]} />
        {woodMat(darken(color, 0.15), isSelected)}
      </mesh>
      <mesh position={[0, cabinetH + 0.01, -(d / 2 - 0.04)]}>
        <boxGeometry args={[w * 0.9, 0.02, 0.06]} />
        {woodMat(darken(color, 0.1), isSelected)}
      </mesh>
    </group>
  );
}

// ========== Sofa ==========
function SofaModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const seatH = h * 0.42;
  const backH = h * 0.58;
  const armW = w * 0.09;

  return (
    <group>
      <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d]} />
        {plasticMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      <mesh position={[0, seatH + 0.03, d * 0.05]} castShadow>
        <boxGeometry args={[w * 0.85, 0.06, d * 0.75]} />
        {plasticMat(lighten(color, 0.06), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      <mesh position={[0, seatH + backH * 0.45, -(d / 2 - 0.09)]} castShadow>
        <boxGeometry args={[w * 0.85, backH * 0.7, 0.16]} />
        {plasticMat(lighten(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[-(w / 2 - armW / 2), seatH + backH * 0.28, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
        {plasticMat(darken(color, 0.06), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      <mesh position={[(w / 2 - armW / 2), seatH + backH * 0.28, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
        {plasticMat(darken(color, 0.06), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {[
        [-(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [-(w / 2 - 0.06), 0, (d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, (d / 2 - 0.06)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.02, lz]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.04, 8]} />
          {metalMat('#333', isSelected)}
        </mesh>
      ))}
    </group>
  );
}

// ========== Shelf ==========
function ShelfModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const shelfCount = Math.max(2, Math.round(h / 0.35));
  const shelfThick = 0.022;
  const sideThick = 0.022;

  return (
    <group>
      <mesh position={[-(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        {woodMat(darken(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      <mesh position={[(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        {woodMat(darken(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      <mesh position={[0, h / 2, -(d / 2 - 0.005)]} castShadow>
        <boxGeometry args={[w - sideThick * 2, h, 0.008]} />
        {woodMat(lighten(color, 0.05), isSelected)}
      </mesh>
      {Array.from({ length: shelfCount + 1 }, (_, i) => {
        const y = (h / shelfCount) * i;
        return (
          <mesh key={i} position={[0, y + shelfThick / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - sideThick * 2, shelfThick, d]} />
            {woodMat(color, isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== Generic fallback ==========
function GenericModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      {woodMat(color, isSelected)}
      <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
    </mesh>
  );
}

// ========== Category detection ==========
function detectFurnitureType(item: PlacedFurniture): string {
  const name = (item.furniture.name || '').toLowerCase();
  const cat = (item.furniture.category || '').toLowerCase();

  if (name.includes('칠판') || name.includes('보조장') || name.includes('blackboard')) return 'blackboard';
  if (name.includes('의자') || name.includes('chair') || cat.includes('chair')) return 'chair';
  if (name.includes('소파') || name.includes('sofa') || cat.includes('sofa')) return 'sofa';
  if (name.includes('사물함') || name.includes('수납') || name.includes('서랍') || name.includes('캐비닛') || name.includes('locker') || name.includes('신발장') || cat.includes('storage')) return 'storage';
  if (name.includes('선반') || name.includes('책장') || name.includes('shelf') || cat.includes('shelf')) return 'shelf';
  if (name.includes('책상') || name.includes('탁자') || name.includes('테이블') || name.includes('강연대') || name.includes('desk') || name.includes('table') || cat.includes('desk') || cat.includes('table')) return 'desk';
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
  const d = item.furniture.height / 1000;
  const h = (item.furniture.depth || 750) / 1000;

  const roomScale = 0.1;
  const posX = (item.x / roomScale) / 1000 + w / 2;
  const posZ = (item.y / roomScale) / 1000 + d / 2;

  const baseColor = item.furniture.color || '#c8b89a';
  const furnitureType = useMemo(() => detectFurnitureType(item), [item]);
  const hasThumbnail = !!item.furniture.thumbnail;

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

  // Right-click to select, prevent left-click from selecting (orbit controls)
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Right click (button 2)
    if (e.nativeEvent.button === 2) {
      e.stopPropagation();
      onSelect(item.id);
    }
  };

  return (
    <group
      ref={groupRef}
      position={[posX, 0, posZ]}
      rotation={[0, -(item.rotation * Math.PI) / 180, 0]}
      onPointerDown={handlePointerDown}
    >
      <ModelComponent w={w} d={d} h={h} color={baseColor} isSelected={isSelected} />

      {/* Product thumbnail texture on front face */}
      {hasThumbnail && (
        <TexturedFrontFace
          w={w}
          h={h}
          d={d}
          thumbnail={item.furniture.thumbnail}
          isSelected={isSelected}
        />
      )}

      {/* Name label */}
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
