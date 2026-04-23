import { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, ContactShadows, Edges, Environment } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import { FurnitureObject } from './FurnitureModels';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as THREE from 'three';
import { ArchitecturalConfig, DEFAULT_ARCHITECTURAL_CONFIG, FloorMaterialType, WallMaterialType } from './ArchitecturalSettingsPanel';

export type HdriPresetType = 'apartment' | 'studio' | 'warehouse' | 'city' | 'sunset' | 'forest';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onRightClickSelect?: (id: string) => void;
  architecturalConfig?: ArchitecturalConfig;
  hdriPreset?: HdriPresetType;
  fpsMode?: boolean;
  onExitFps?: () => void;
}

const EDGE_COLOR = '#2a2a2a';

// ===== Material Configs =====
const FLOOR_MATERIALS: Record<FloorMaterialType, { color: string; roughness: number; metalness: number; pattern: 'plank' | 'tile' | 'none' | 'herringbone' | 'hex' }> = {
  'wood-light': { color: '#c8b89a', roughness: 0.75, metalness: 0.02, pattern: 'plank' },
  'wood-dark': { color: '#6b5340', roughness: 0.7, metalness: 0.02, pattern: 'plank' },
  'wood-walnut': { color: '#8b6f55', roughness: 0.65, metalness: 0.03, pattern: 'plank' },
  'wood-herringbone': { color: '#b09878', roughness: 0.7, metalness: 0.02, pattern: 'herringbone' },
  'marble-white': { color: '#eae8e3', roughness: 0.15, metalness: 0.05, pattern: 'tile' },
  'marble-gray': { color: '#b5b0a8', roughness: 0.18, metalness: 0.05, pattern: 'tile' },
  'marble-calacatta': { color: '#f0ece5', roughness: 0.12, metalness: 0.06, pattern: 'tile' },
  'tile-white': { color: '#f0ede8', roughness: 0.4, metalness: 0.02, pattern: 'tile' },
  'tile-gray': { color: '#a8a5a0', roughness: 0.45, metalness: 0.02, pattern: 'tile' },
  'tile-hex': { color: '#e5e0d8', roughness: 0.4, metalness: 0.03, pattern: 'hex' },
  'concrete': { color: '#b8b5b0', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'carpet-gray': { color: '#9a9590', roughness: 0.95, metalness: 0.0, pattern: 'none' },
  'carpet-blue': { color: '#6878a0', roughness: 0.95, metalness: 0.0, pattern: 'none' },
  'carpet-beige': { color: '#c5b8a5', roughness: 0.95, metalness: 0.0, pattern: 'none' },
};

const WALL_MATERIALS: Record<WallMaterialType, { color: string; roughness: number; metalness: number; pattern: 'none' | 'stripe' | 'texture' | 'brick' | 'plank' | 'damask' | 'grasscloth' | 'stone' | 'venetian' }> = {
  'paint-white': { color: '#f5f2ec', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'paint-cream': { color: '#f0e8d8', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'paint-gray': { color: '#d0cdc8', roughness: 0.88, metalness: 0.01, pattern: 'none' },
  'paint-sage': { color: '#c5cfbe', roughness: 0.88, metalness: 0.01, pattern: 'none' },
  'paint-navy': { color: '#2c3e50', roughness: 0.85, metalness: 0.02, pattern: 'none' },
  'paint-terracotta': { color: '#c0694a', roughness: 0.88, metalness: 0.01, pattern: 'none' },
  'wallpaper-stripe': { color: '#e8e4db', roughness: 0.85, metalness: 0.01, pattern: 'stripe' },
  'wallpaper-texture': { color: '#e5e0d5', roughness: 0.82, metalness: 0.01, pattern: 'texture' },
  'wallpaper-damask': { color: '#e0dbd2', roughness: 0.78, metalness: 0.02, pattern: 'damask' },
  'wallpaper-grasscloth': { color: '#d8d0c0', roughness: 0.92, metalness: 0.01, pattern: 'grasscloth' },
  'brick-white': { color: '#e8e0d5', roughness: 0.92, metalness: 0.02, pattern: 'brick' },
  'brick-red': { color: '#a05030', roughness: 0.92, metalness: 0.02, pattern: 'brick' },
  'concrete': { color: '#c0bdb8', roughness: 0.95, metalness: 0.01, pattern: 'texture' },
  'wood-panel': { color: '#b09878', roughness: 0.7, metalness: 0.03, pattern: 'plank' },
  'stone-natural': { color: '#c8c0b5', roughness: 0.88, metalness: 0.03, pattern: 'stone' },
  'plaster-venetian': { color: '#e8e2d8', roughness: 0.4, metalness: 0.06, pattern: 'venetian' },
};

// ===== Curtain Components =====

/** Procedural draped geometry: displaces vertices with sine waves to simulate fabric folds */
function useDrapedGeometry(width: number, height: number, segments: number = 40, foldDepth: number = 0.025, foldFreq: number = 12) {
  const geom = new THREE.PlaneGeometry(width, height, segments, segments);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Vertical drape folds — stronger toward the bottom
    const bottomFactor = 1 - (y / (height / 2) + 1) * 0.3; // stronger at bottom
    const fold = Math.sin(x * foldFreq * Math.PI) * foldDepth * bottomFactor;
    // Slight random variation for realism
    const micro = Math.sin(x * 37 + y * 19) * 0.002;
    pos.setZ(i, fold + micro);
    // Slight Y displacement for gravity sag at the bottom
    const sag = Math.max(0, -y - height * 0.3) * 0.015 * Math.sin(x * foldFreq * Math.PI);
    pos.setY(i, y + sag);
  }
  geom.computeVertexNormals();
  return geom;
}

function CurtainRod({ width, yPos }: { width: number; yPos: number }) {
  return (
    <group position={[0, yPos, 0]}>
      {/* Rod */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, width + 0.25, 12]} />
        <meshStandardMaterial color="#8a8580" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Finials */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (width / 2 + 0.14), 0, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#8a8580" roughness={0.2} metalness={0.85} />
        </mesh>
      ))}
      {/* Rings */}
      {Array.from({ length: Math.floor(width / 0.08) }, (_, i) => {
        const xPos = -width / 2 + 0.06 + i * (width / Math.floor(width / 0.08));
        return (
          <mesh key={i} position={[xPos, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.012, 0.002, 6, 12]} />
            <meshStandardMaterial color="#999" roughness={0.25} metalness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function SheerCurtain({ width, height, color, openRatio = 0 }: { width: number; height: number; color: string; openRatio?: number }) {
  const curtainH = height + 0.15;
  // openRatio: 0=closed (panels cover window), 1=open (panels bunched at sides)
  const closedPanelW = width * 0.5;
  const panelW = closedPanelW * (1 - openRatio * 0.7); // shrink width when open
  const panelOffset = width * 0.27 + openRatio * (width * 0.22); // move outward when open
  const foldFreq = 14 + openRatio * 20; // more folds when bunched
  const foldDepth = 0.018 + openRatio * 0.025;
  const leftGeom = useDrapedGeometry(panelW, curtainH, 48, foldDepth, foldFreq);
  const rightGeom = useDrapedGeometry(panelW, curtainH, 48, foldDepth, foldFreq);
  const baseColor = new THREE.Color(color);

  return (
    <group position={[0, 0, 0.07]}>
      <mesh geometry={leftGeom} position={[-panelOffset, 0, 0]}>
        <meshPhysicalMaterial
          color={baseColor} transparent opacity={0.28}
          roughness={0.98} metalness={0.0} side={THREE.DoubleSide}
          transmission={0.4} thickness={0.5}
          sheen={0.3} sheenColor={baseColor.clone().multiplyScalar(1.2)}
        />
      </mesh>
      <mesh geometry={rightGeom} position={[panelOffset, 0, 0]}>
        <meshPhysicalMaterial
          color={baseColor} transparent opacity={0.28}
          roughness={0.98} metalness={0.0} side={THREE.DoubleSide}
          transmission={0.4} thickness={0.5}
          sheen={0.3} sheenColor={baseColor.clone().multiplyScalar(1.2)}
        />
      </mesh>
      {/* Tiebacks — visible when partially open */}
      {openRatio > 0.3 && [-1, 1].map(side => (
        <mesh key={side} position={[side * (panelOffset + panelW * 0.3), -height * 0.15, 0.015]} rotation={[0, 0, side * 0.15]}>
          <torusGeometry args={[0.03, 0.004, 6, 16, Math.PI]} />
          <meshStandardMaterial color={baseColor.clone().multiplyScalar(0.7)} roughness={0.8} />
        </mesh>
      ))}
      <CurtainRod width={width} yPos={height / 2 + 0.08} />
    </group>
  );
}

function BlackoutCurtain({ width, height, color, openRatio = 0 }: { width: number; height: number; color: string; openRatio?: number }) {
  const curtainH = height + 0.2;
  const closedPanelW = width * 0.55;
  const panelW = closedPanelW * (1 - openRatio * 0.7);
  const panelOffset = width * 0.28 + openRatio * (width * 0.22);
  const foldFreq = 10 + openRatio * 18;
  const foldDepth = 0.035 + openRatio * 0.03;
  const leftGeom = useDrapedGeometry(panelW, curtainH, 50, foldDepth, foldFreq);
  const rightGeom = useDrapedGeometry(panelW, curtainH, 50, foldDepth, foldFreq);
  const baseColor = new THREE.Color(color);
  const darkerColor = baseColor.clone().multiplyScalar(0.8);

  return (
    <group position={[0, 0, 0.07]}>
      {[-1, 1].map((side, idx) => (
        <group key={side}>
          <mesh geometry={idx === 0 ? leftGeom : rightGeom} position={[side * panelOffset, 0, 0]}>
            <meshStandardMaterial
              color={baseColor} roughness={0.88} metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={idx === 0 ? leftGeom : rightGeom} position={[side * panelOffset, 0, -0.008]}>
            <meshStandardMaterial
              color={darkerColor} roughness={0.95} metalness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      {[-1, 1].map(side => (
        <mesh key={`hem-${side}`} position={[side * panelOffset, -curtainH / 2 + 0.01, 0]}>
          <boxGeometry args={[panelW, 0.025, 0.012]} />
          <meshStandardMaterial color={darkerColor} roughness={0.9} />
        </mesh>
      ))}
      <CurtainRod width={width} yPos={height / 2 + 0.1} />
    </group>
  );
}

function RomanShade({ width, height, color, openRatio = 0 }: { width: number; height: number; color: string; openRatio?: number }) {
  const shadeW = width - 0.04;
  // When open, shade pulls up: fewer visible folds, smaller height
  const shadeH = height * (0.4 - openRatio * 0.3); // shrinks as it opens
  const foldCount = Math.max(2, Math.round(4 * (1 - openRatio * 0.5)));
  const foldH = shadeH / foldCount;
  const baseColor = new THREE.Color(color);
  const shadowColor = baseColor.clone().multiplyScalar(0.78);
  // Shade moves up when opened
  const yOffset = height * 0.1 + openRatio * height * 0.25;

  return (
    <group position={[0, yOffset, 0.055]}>
      {Array.from({ length: foldCount }, (_, i) => {
        const yPos = shadeH / 2 - i * foldH - foldH / 2;
        const depth = 0.008 + (i / foldCount) * 0.018 + openRatio * 0.01;
        return (
          <group key={i} position={[0, yPos, 0]}>
            <mesh>
              <boxGeometry args={[shadeW, foldH - 0.004, 0.004]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? baseColor : baseColor.clone().multiplyScalar(0.92)}
                roughness={0.85} metalness={0.01} side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -foldH / 2 + 0.002, depth]}>
              <boxGeometry args={[shadeW - 0.01, 0.006, 0.006]} />
              <meshStandardMaterial color={shadowColor} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, shadeH / 2 + 0.015, 0]}>
        <boxGeometry args={[shadeW + 0.02, 0.03, 0.025]} />
        <meshStandardMaterial color="#e0dbd5" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[shadeW / 2 - 0.03, -shadeH / 2 - 0.06, 0.01]}>
        <cylinderGeometry args={[0.002, 0.002, 0.12, 4]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.9} />
      </mesh>
      <mesh position={[shadeW / 2 - 0.03, -shadeH / 2 - 0.13, 0.01]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#c0b8a8" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}

function VenetianBlinds({ width, height, color, openRatio = 0 }: { width: number; height: number; color: string; openRatio?: number }) {
  // When open, slats tilt flat and pull up
  const visibleHeight = height * (1 - openRatio * 0.8);
  const slatCount = Math.max(3, Math.floor(visibleHeight / 0.045));
  const slatW = width - 0.04;
  const baseColor = new THREE.Color(color);
  const tiltAngle = 0.18 * (1 - openRatio); // slats go flat when open
  const yStart = height / 2 - (height - visibleHeight); // pull up from bottom

  return (
    <group position={[0, (height - visibleHeight) / 2, 0.045]}>
      {/* Top headrail */}
      <mesh position={[0, yStart + 0.025, 0]}>
        <boxGeometry args={[slatW + 0.03, 0.045, 0.035]} />
        <meshStandardMaterial color="#e0dbd5" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Slats */}
      {Array.from({ length: slatCount }, (_, i) => {
        const yPos = yStart - i * (visibleHeight / slatCount) - 0.02;
        const tilt = tiltAngle + Math.sin(i * 0.5) * 0.04 * (1 - openRatio);
        return (
          <mesh key={i} position={[0, yPos, 0]} rotation={[tilt, 0, 0]}>
            <boxGeometry args={[slatW, 0.002, 0.024]} />
            <meshPhysicalMaterial
              color={baseColor} roughness={0.35} metalness={0.35}
              side={THREE.DoubleSide} clearcoat={0.3} clearcoatRoughness={0.4}
            />
          </mesh>
        );
      })}
      {/* Lift cords */}
      {[-0.35, 0, 0.35].map((xRatio, i) => (
        <mesh key={i} position={[xRatio * slatW, (yStart - visibleHeight / 2), 0.002]}>
          <cylinderGeometry args={[0.001, 0.001, visibleHeight, 4]} />
          <meshStandardMaterial color="#d5d0c5" roughness={0.9} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Bottom rail */}
      <mesh position={[0, yStart - visibleHeight + 0.01, 0]}>
        <boxGeometry args={[slatW, 0.015, 0.025]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

// ===== Architectural Elements =====

function WindowElement({ position, rotation, width = 1.2, height = 1.4, type = 'double', frameColor = 'white', curtain = 'none', curtainColor = '#f5f0e8', curtainOpenRatio = 0 }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number; type?: string;
  frameColor?: string; curtain?: string; curtainColor?: string; curtainOpenRatio?: number;
}) {
  const FRAME_COLORS: Record<string, { color: string; roughness: number; metalness: number }> = {
    'white': { color: '#e8e4db', roughness: 0.5, metalness: 0.05 },
    'wood': { color: '#a08060', roughness: 0.7, metalness: 0.03 },
    'black': { color: '#2a2a2a', roughness: 0.4, metalness: 0.15 },
    'silver': { color: '#c0c0c0', roughness: 0.25, metalness: 0.8 },
  };
  const frame = FRAME_COLORS[frameColor] || FRAME_COLORS['white'];
  const frameThick = 0.04;
  const hasDivider = type === 'double' || type === 'single';
  const hasHorizontalDivider = type === 'double';

  return (
    <group position={position} rotation={rotation}>
      {/* Glass pane with proper PBR */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#b8d4e8"
          transparent opacity={0.25}
          roughness={0.02} metalness={0.1}
          transmission={0.85} thickness={0.006}
          ior={1.52}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Glass reflection layer */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width - 0.02, height - 0.02]} />
        <meshPhysicalMaterial
          color="#e0f0ff" transparent opacity={0.08}
          roughness={0.0} metalness={0.3}
          envMapIntensity={2.0}
        />
      </mesh>
      {/* Frame - top */}
      <mesh position={[0, height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.04]} />
        <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
      </mesh>
      {/* Frame - bottom */}
      <mesh position={[0, -height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.04]} />
        <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
      </mesh>
      {/* Frame - left */}
      <mesh position={[-width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.04]} />
        <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
      </mesh>
      {/* Frame - right */}
      <mesh position={[width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.04]} />
        <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
      </mesh>
      {/* Center divider */}
      {hasDivider && (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, height, 0.03]} />
          <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
        </mesh>
      )}
      {/* Horizontal divider */}
      {hasHorizontalDivider && (
        <mesh position={[0, 0.05, 0.01]}>
          <boxGeometry args={[width, 0.02, 0.03]} />
          <meshStandardMaterial color={frame.color} roughness={frame.roughness} metalness={frame.metalness} />
        </mesh>
      )}
      {/* Sliding rails */}
      {type === 'sliding' && (
        <>
          <mesh position={[0, height / 2 + 0.03, 0.01]}>
            <boxGeometry args={[width + 0.1, 0.02, 0.04]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, -height / 2 - 0.02, 0.01]}>
            <boxGeometry args={[width + 0.1, 0.015, 0.04]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
          </mesh>
        </>
      )}
      {/* Window sill */}
      <mesh position={[0, -height / 2 - 0.02, 0.04]}>
        <boxGeometry args={[width + 0.08, 0.03, 0.1]} />
        <meshStandardMaterial color={frame.color} roughness={frame.roughness + 0.1} metalness={frame.metalness} />
      </mesh>
      {/* Window light */}
      <pointLight position={[0, 0, -0.5]} intensity={0.4} color="#fffbe6" distance={5} />

      {/* Curtains */}
      {curtain === 'sheer' && <SheerCurtain width={width} height={height} color={curtainColor} openRatio={curtainOpenRatio} />}
      {curtain === 'blackout' && <BlackoutCurtain width={width} height={height} color={curtainColor} openRatio={curtainOpenRatio} />}
      {curtain === 'roman' && <RomanShade width={width} height={height} color={curtainColor} openRatio={curtainOpenRatio} />}
      {curtain === 'venetian' && <VenetianBlinds width={width} height={height} color={curtainColor} openRatio={curtainOpenRatio} />}
    </group>
  );
}

function DoorElement({ position, rotation, width = 0.9, height = 2.1, type = 'swing', material = 'wood' }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number; type?: string; material?: string;
}) {
  const isDouble = type === 'double';
  const panelW = isDouble ? width / 2 : width;
  const isGlass = material === 'glass';
  const isMetal = material === 'metal';

  // Frame material — metal doors use aluminum, others use painted wood
  const frameProps = isMetal
    ? { color: '#7a7a7a', roughness: 0.25, metalness: 0.85 }
    : { color: '#d5d0c5', roughness: 0.6, metalness: 0.05 };

  return (
    <group position={position} rotation={rotation}>
      {(isDouble ? [-(panelW / 2 + 0.002), (panelW / 2 + 0.002)] : [0]).map((xOff, i) => (
        <group key={i}>
          {/* === METAL DOOR (샷시문) — Aluminum frame with glass center === */}
          {isMetal && (
            <>
              {/* Outer aluminum panel */}
              <mesh position={[xOff, height / 2, 0]}>
                <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.045]} />
                <meshPhysicalMaterial color="#888" roughness={0.2} metalness={0.9} clearcoat={0.3} />
                <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
              </mesh>
              {/* Inner glass pane — large center window */}
              <mesh position={[xOff, height * 0.55, 0.001]}>
                <boxGeometry args={[panelW * 0.75, height * 0.55, 0.006]} />
                <meshPhysicalMaterial
                  color="#c8dce8" transparent opacity={0.3}
                  roughness={0.02} metalness={0.05}
                  transmission={0.7} thickness={0.006} ior={1.5}
                  clearcoat={1} clearcoatRoughness={0.05}
                />
              </mesh>
              {/* Horizontal divider bar */}
              <mesh position={[xOff, height * 0.28, 0.024]}>
                <boxGeometry args={[panelW * 0.78, 0.03, 0.005]} />
                <meshStandardMaterial color="#777" roughness={0.2} metalness={0.9} />
              </mesh>
              {/* Lower kick plate — solid aluminum */}
              <mesh position={[xOff, height * 0.12, 0.024]}>
                <boxGeometry args={[panelW * 0.75, height * 0.2, 0.004]} />
                <meshStandardMaterial color="#999" roughness={0.3} metalness={0.85} />
              </mesh>
              {/* Door handle — lever type */}
              <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.04]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
                <meshStandardMaterial color="#aaa" roughness={0.15} metalness={0.95} />
              </mesh>
              {/* Handle base plate */}
              <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.03]}>
                <boxGeometry args={[0.03, 0.08, 0.005]} />
                <meshStandardMaterial color="#999" roughness={0.2} metalness={0.9} />
              </mesh>
            </>
          )}
          {/* === GLASS DOOR — Full glass with thin frame === */}
          {isGlass && (
            <>
              {/* Glass panel */}
              <mesh position={[xOff, height / 2, 0]}>
                <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.012]} />
                <meshPhysicalMaterial
                  color="#b8dae8" transparent opacity={0.2}
                  roughness={0.01} metalness={0.05}
                  transmission={0.85} thickness={0.012} ior={1.52}
                  clearcoat={1} clearcoatRoughness={0.02}
                  envMapIntensity={2}
                />
                <Edges threshold={15} color="#666" lineWidth={0.8} />
              </mesh>
              {/* Glass edge highlight */}
              <mesh position={[xOff, height / 2, 0.007]}>
                <planeGeometry args={[panelW * 0.9, height * 0.9]} />
                <meshPhysicalMaterial color="#e8f0ff" transparent opacity={0.05} roughness={0} metalness={0.2} envMapIntensity={3} />
              </mesh>
              {/* Handle — tubular stainless */}
              <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.02]}>
                <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
                <meshStandardMaterial color="#c0c0c0" roughness={0.1} metalness={0.95} />
              </mesh>
              {/* Handle mounts */}
              {[-0.08, 0.08].map((yOff, j) => (
                <mesh key={j} position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47 + yOff, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.016, 6]} />
                  <meshStandardMaterial color="#b0b0b0" roughness={0.15} metalness={0.9} />
                </mesh>
              ))}
            </>
          )}
          {/* === WOOD DOOR — Paneled wood with grain === */}
          {!isMetal && !isGlass && (
            <>
              {/* Main wood panel */}
              <mesh position={[xOff, height / 2, 0]}>
                <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.04]} />
                <meshStandardMaterial color="#b8a590" roughness={0.72} metalness={0.02} />
                <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
              </mesh>
              {/* Upper raised panel */}
              <mesh position={[xOff, height * 0.68, 0.022]}>
                <boxGeometry args={[panelW * 0.65, height * 0.32, 0.006]} />
                <meshStandardMaterial color="#c4b5a0" roughness={0.65} metalness={0.02} />
              </mesh>
              {/* Lower raised panel */}
              <mesh position={[xOff, height * 0.28, 0.022]}>
                <boxGeometry args={[panelW * 0.65, height * 0.28, 0.006]} />
                <meshStandardMaterial color="#c4b5a0" roughness={0.65} metalness={0.02} />
              </mesh>
              {/* Panel molding edges (top panel) */}
              {[
                [0, height * 0.52, panelW * 0.65, 0.008],
                [0, height * 0.84, panelW * 0.65, 0.008],
                [-panelW * 0.325, height * 0.68, 0.008, height * 0.32],
                [panelW * 0.325, height * 0.68, 0.008, height * 0.32],
              ].map(([x, y, w2, h2], j) => (
                <mesh key={`mold-t-${j}`} position={[xOff + (x as number), y as number, 0.026]}>
                  <boxGeometry args={[w2 as number, h2 as number, 0.003]} />
                  <meshStandardMaterial color="#a89880" roughness={0.7} metalness={0.02} />
                </mesh>
              ))}
              {/* Handle — round knob */}
              <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.035]}>
                <sphereGeometry args={[0.018, 12, 12]} />
                <meshStandardMaterial color="#8b7355" roughness={0.4} metalness={0.3} />
              </mesh>
              {/* Handle base */}
              <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.025]}>
                <cylinderGeometry args={[0.012, 0.014, 0.01, 8]} />
                <meshStandardMaterial color="#7a6345" roughness={0.5} metalness={0.2} />
              </mesh>
            </>
          )}
        </group>
      ))}
      {/* Frame */}
      <mesh position={[-width / 2 - 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={frameProps.color} roughness={frameProps.roughness} metalness={frameProps.metalness} />
      </mesh>
      <mesh position={[width / 2 + 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={frameProps.color} roughness={frameProps.roughness} metalness={frameProps.metalness} />
      </mesh>
      <mesh position={[0, height + 0.03, 0]}>
        <boxGeometry args={[width + 0.12, 0.06, 0.08]} />
        <meshStandardMaterial color={frameProps.color} roughness={frameProps.roughness} metalness={frameProps.metalness} />
      </mesh>
      {/* Threshold / bottom sill */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[width + 0.04, 0.01, 0.06]} />
        <meshStandardMaterial color={isMetal ? '#666' : '#a09585'} roughness={isMetal ? 0.3 : 0.7} metalness={isMetal ? 0.6 : 0.03} />
      </mesh>
      {type === 'sliding' && (
        <>
          <mesh position={[0, height + 0.06, 0]}>
            <boxGeometry args={[width + 0.2, 0.03, 0.06]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[width + 0.2, 0.015, 0.04]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ===== New Architectural Elements =====

function ColumnElement({ position, radius = 0.15, height = 2.8 }: {
  position: [number, number, number]; radius?: number; height?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial color="#e8e4db" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.04, 16]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, height - 0.02, 0]}>
        <cylinderGeometry args={[radius * 1.3, radius, 0.04, 16]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  );
}

function PartitionElement({ position, rotation, width = 1.5, height = 1.8 }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main panel */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#e0ddd5" roughness={0.85} metalness={0.02} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Frame top */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + 0.02, 0.03, 0.06]} />
        <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Feet */}
      {[-width / 2 + 0.1, width / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.01, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.2]} />
          <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function OutletElement({ position, rotation }: {
  position: [number, number, number]; rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Plate */}
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[0.08, 0.12, 0.005]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Socket holes */}
      {[-0.025, 0.025].map((y, i) => (
        <mesh key={i} position={[0, y, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.003, 12]} />
          <meshStandardMaterial color="#333" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function CeilingLightElement({ position, lightType = 'panel' }: {
  position: [number, number, number]; lightType?: string;
}) {
  const isPendant = lightType === 'pendant';
  const isSpot = lightType === 'spot';
  const isChandelier = lightType === 'chandelier';
  const isTrack = lightType === 'track';
  const isRecessed = lightType === 'recessed';
  const isWallSconce = lightType === 'wall-sconce';
  const isLinear = lightType === 'linear';

  return (
    <group position={position}>
      {isPendant ? (
        <>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.6, 6]} />
            <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 0.2, 16, 1, true]} />
            <meshStandardMaterial color="#e8e4db" roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, -0.7, 0]} intensity={0.8} color="#fff5e0" distance={6} castShadow />
        </>
      ) : isSpot ? (
        <>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.1, 12]} />
            <meshStandardMaterial color="#ccc" roughness={0.3} metalness={0.7} />
          </mesh>
          <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} intensity={1} color="#fff8ee" distance={5} castShadow />
        </>
      ) : isChandelier ? (
        <>
          {/* Central hub */}
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#c8a870" roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
            <meshStandardMaterial color="#c8a870" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Arms with bulbs */}
          {[0, 1, 2, 3, 4, 5].map(i => {
            const angle = (i * Math.PI * 2) / 6;
            const armLen = 0.2;
            return (
              <group key={i}>
                <mesh position={[Math.cos(angle) * armLen / 2, -0.15, Math.sin(angle) * armLen / 2]} rotation={[0, -angle, Math.PI / 12]}>
                  <cylinderGeometry args={[0.004, 0.004, armLen, 6]} />
                  <meshStandardMaterial color="#c8a870" roughness={0.25} metalness={0.8} />
                </mesh>
                <mesh position={[Math.cos(angle) * armLen, -0.12, Math.sin(angle) * armLen]}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                  <meshStandardMaterial color="#fff8e0" emissive="#fff8e0" emissiveIntensity={0.6} transparent opacity={0.9} />
                </mesh>
              </group>
            );
          })}
          <pointLight position={[0, -0.2, 0]} intensity={1.2} color="#fff0d0" distance={8} castShadow />
        </>
      ) : isTrack ? (
        <>
          {/* Track bar */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[1.2, 0.02, 0.03]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* 3 spot heads on track */}
          {[-0.35, 0, 0.35].map((x, i) => (
            <group key={i}>
              <mesh position={[x, -0.06, 0]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 0.06, 10]} />
                <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
              </mesh>
              <spotLight position={[x, -0.1, 0]} angle={0.4} penumbra={0.6} intensity={0.5} color="#fff8ee" distance={4} />
            </group>
          ))}
        </>
      ) : isRecessed ? (
        <>
          <mesh position={[0, -0.005, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.01, 16]} />
            <meshStandardMaterial color="#f0ede5" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.015, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.005, 16]} />
            <meshStandardMaterial color="#fffef5" emissive="#fffef5" emissiveIntensity={0.6} />
          </mesh>
          <spotLight position={[0, -0.02, 0]} angle={0.7} penumbra={0.4} intensity={0.6} color="#fff8ee" distance={4} />
        </>
      ) : isLinear ? (
        <>
          <mesh position={[0, -0.015, 0]}>
            <boxGeometry args={[1.0, 0.02, 0.06]} />
            <meshStandardMaterial color="#e8e5e0" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.028, 0]}>
            <planeGeometry args={[0.96, 0.04]} />
            <meshStandardMaterial color="#fffef5" emissive="#fffef5" emissiveIntensity={0.5} transparent opacity={0.9} />
          </mesh>
          <pointLight position={[0, -0.05, 0]} intensity={0.5} color="#fff8ee" distance={4} />
        </>
      ) : isWallSconce ? (
        <>
          {/* Wall mount plate */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.08, 0.12, 0.03]} />
            <meshStandardMaterial color="#c8a870" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Shade */}
          <mesh position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.06, 0.08, 0.1, 12, 1, true]} />
            <meshStandardMaterial color="#f0e8d8" roughness={0.7} metalness={0.02} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 0, 0.06]} intensity={0.4} color="#fff5e0" distance={3} />
        </>
      ) : (
        <>
          {/* Panel light */}
          <mesh position={[0, -0.015, 0]}>
            <boxGeometry args={[0.6, 0.03, 0.6]} />
            <meshStandardMaterial color="#f5f3ee" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.032, 0]}>
            <planeGeometry args={[0.56, 0.56]} />
            <meshStandardMaterial color="#fffef5" emissive="#fffef5" emissiveIntensity={0.5} transparent opacity={0.9} />
          </mesh>
          <pointLight position={[0, -0.1, 0]} intensity={0.6} color="#fff8ee" distance={5} />
        </>
      )}
    </group>
  );
}

// ===== Crown Molding =====
function CrownMolding({ w, d, wallH }: { w: number; d: number; wallH: number }) {
  const moldH = 0.06;
  const moldD = 0.04;
  return (
    <group>
      <mesh position={[w / 2, wallH - moldH / 2, moldD / 2]}>
        <boxGeometry args={[w, moldH, moldD]} />
        <meshStandardMaterial color="#e2ded5" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[moldD / 2, wallH - moldH / 2, d / 2]}>
        <boxGeometry args={[moldD, moldH, d]} />
        <meshStandardMaterial color="#e2ded5" roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  );
}

function Room({ dimensions, archConfig }: { dimensions: RoomDimensions; archConfig: ArchitecturalConfig }) {
  const w = dimensions.width / 1000;
  const d = dimensions.height / 1000;
  const wallH = 2.8;
  const wallThickness = 0.06;

  const getWallPosition = (wall: string, posRatio: number, yCenter: number): {
    position: [number, number, number];
    rotation: [number, number, number];
  } => {
    const offset = wallThickness / 2 + 0.002;
    switch (wall) {
      case 'back':
        return { position: [w * posRatio, yCenter, offset], rotation: [0, 0, 0] };
      case 'left':
        return { position: [offset, yCenter, d * posRatio], rotation: [0, Math.PI / 2, 0] };
      case 'right':
        return { position: [w - offset, yCenter, d * posRatio], rotation: [0, -Math.PI / 2, 0] };
      case 'front':
        return { position: [w * posRatio, yCenter, d - offset], rotation: [0, Math.PI, 0] };
      default:
        return { position: [w * posRatio, yCenter, offset], rotation: [0, 0, 0] };
    }
  };

  const floorMat = FLOOR_MATERIALS[archConfig.floorMaterial || 'wood-light'];
  const wallMat = WALL_MATERIALS[archConfig.wallMaterial || 'paint-white'];
  const floorLineColor = new THREE.Color(floorMat.color).offsetHSL(0, 0, -0.08).getStyle();

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorMat.color} roughness={floorMat.roughness} metalness={floorMat.metalness} />
      </mesh>
      {/* Floor pattern lines */}
      {floorMat.pattern === 'plank' && Array.from({ length: Math.ceil(w / 0.15) }, (_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[i * 0.15, 0.001, d / 2]}>
          <planeGeometry args={[0.002, d]} />
          <meshStandardMaterial color={floorLineColor} transparent opacity={0.3} />
        </mesh>
      ))}
      {floorMat.pattern === 'tile' && (
        <>
          {Array.from({ length: Math.ceil(w / 0.6) }, (_, i) => (
            <mesh key={`tile-v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[i * 0.6, 0.001, d / 2]}>
              <planeGeometry args={[0.003, d]} />
              <meshStandardMaterial color={floorLineColor} transparent opacity={0.2} />
            </mesh>
          ))}
          {Array.from({ length: Math.ceil(d / 0.6) }, (_, i) => (
            <mesh key={`tile-h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0.001, i * 0.6]}>
              <planeGeometry args={[w, 0.003]} />
              <meshStandardMaterial color={floorLineColor} transparent opacity={0.2} />
            </mesh>
          ))}
        </>
      )}

      {/* Back wall */}
      <mesh position={[w / 2, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshStandardMaterial color={wallMat.color} roughness={wallMat.roughness} metalness={wallMat.metalness} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>
      {/* Left wall */}
      <mesh position={[0, wallH / 2, d / 2]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshStandardMaterial color={wallMat.color} roughness={wallMat.roughness} metalness={wallMat.metalness} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>
      {/* Right wall (ghost) */}
      <mesh position={[w, wallH / 2, d / 2]}>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshStandardMaterial color={wallMat.color} transparent opacity={0.1} roughness={wallMat.roughness} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.6} />
      </mesh>
      {/* Front wall (ghost) */}
      <mesh position={[w / 2, wallH / 2, d]}>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshStandardMaterial color={wallMat.color} transparent opacity={0.1} roughness={wallMat.roughness} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.6} />
      </mesh>

      {/* Baseboards */}
      <mesh position={[w / 2, 0.04, wallThickness / 2 + 0.005]}>
        <boxGeometry args={[w, 0.08, 0.015]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[wallThickness / 2 + 0.005, 0.04, d / 2]}>
        <boxGeometry args={[0.015, 0.08, d]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>

      <CrownMolding w={w} d={d} wallH={wallH} />

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[w / 2, wallH, d / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.9} metalness={0.01} side={THREE.DoubleSide} />
      </mesh>

      {/* Dynamic Windows — all 4 walls */}
      {archConfig.windows.map((win, idx) => {
        const { position, rotation } = getWallPosition(win.wall, win.positionRatio, wallH * 0.55);
        return (
          <WindowElement key={`win-${idx}`} position={position} rotation={rotation}
            width={win.width} height={win.height} type={win.type}
            frameColor={win.frameColor || 'white'} curtain={win.curtain || 'none'} curtainColor={win.curtainColor || '#f5f0e8'} curtainOpenRatio={win.curtainOpenRatio ?? 0} />
        );
      })}

      {/* Dynamic Doors */}
      {archConfig.doors.map((door, idx) => {
        const { position, rotation } = getWallPosition(door.wall, door.positionRatio, 0);
        return (
          <DoorElement key={`door-${idx}`} position={position} rotation={rotation}
            width={door.width} height={door.height} type={door.type} material={door.material || 'wood'} />
        );
      })}

      {/* Columns */}
      {(archConfig.columns || []).map((col, idx) => {
        const { position } = getWallPosition(col.wall, col.positionRatio, 0);
        return <ColumnElement key={`col-${idx}`} position={position} radius={col.radius} height={wallH} />;
      })}

      {/* Partitions */}
      {(archConfig.partitions || []).map((part, idx) => {
        const { position, rotation } = getWallPosition(part.wall, part.positionRatio, 0);
        return <PartitionElement key={`part-${idx}`} position={[position[0], 0, position[2]]} rotation={rotation}
          width={part.width} height={part.height} />;
      })}

      {/* Outlets */}
      {(archConfig.outlets || []).map((outlet, idx) => {
        const { position, rotation } = getWallPosition(outlet.wall, outlet.positionRatio, 0.25);
        return <OutletElement key={`outlet-${idx}`} position={position} rotation={rotation} />;
      })}

      {/* Ceiling Lights */}
      {(archConfig.ceilingLights || []).map((light, idx) => {
        const px = w * light.xRatio;
        const pz = d * light.zRatio;
        return <CeilingLightElement key={`light-${idx}`} position={[px, wallH, pz]} lightType={light.type} />;
      })}

      {/* Grid */}
      <Grid
        position={[w / 2, 0.001, d / 2]}
        args={[w, d]}
        cellSize={0.5} cellThickness={0.4} cellColor="#ccc"
        sectionSize={1} sectionThickness={0.8} sectionColor="#999"
        fadeDistance={25} infiniteGrid={false}
      />

      {/* Dimension labels — static, no animation */}
      <Text position={[w / 2, 0.02, d + 0.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#555" anchorX="center">
        {w.toFixed(1)}m
      </Text>
      <Text position={[-0.3, 0.02, d / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.18} color="#555" anchorX="center">
        {d.toFixed(1)}m
      </Text>
    </group>
  );
}

// ===== Snapshot Helper — uses useThree inside Canvas =====
function SnapshotHelper({ onCapture }: { onCapture: (fn: () => void) => void }) {
  const { gl, scene, camera } = useThree();
  
  useCallback(() => {
    onCapture(() => {
      try {
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `GGI-렌더링샷-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('렌더링 샷이 저장되었습니다!');
      } catch (err) {
        console.error('Snapshot error:', err);
        toast.error('스냅샷 저장에 실패했습니다');
      }
    });
  }, [gl, scene, camera, onCapture]);

  // Register the capture function
  const captureRef = useRef<() => void>();
  captureRef.current = () => {
    try {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `GGI-렌더링샷-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('렌더링 샷이 저장되었습니다!');
    } catch (err) {
      console.error('Snapshot error:', err);
      toast.error('스냅샷 저장에 실패했습니다');
    }
  };

  onCapture(() => captureRef.current?.());

  return null;
}

// ===== Keyboard Camera Controls (WASD + QE + RF, orbit only) =====
function KeyboardCameraControls() {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      keys.current.add(e.key.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (keys.current.size === 0) return;
    const speed = 4 * delta;
    const rotSpeed = 1.5 * delta;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current.has('w')) camera.position.addScaledVector(forward, speed);
    if (keys.current.has('s')) camera.position.addScaledVector(forward, -speed);
    if (keys.current.has('a')) camera.position.addScaledVector(right, -speed);
    if (keys.current.has('d')) camera.position.addScaledVector(right, speed);

    if (keys.current.has('r')) camera.position.y += speed;
    if (keys.current.has('f')) camera.position.y = Math.max(0.2, camera.position.y - speed);
    if (keys.current.has('q')) camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
    if (keys.current.has('e')) camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
  });

  return null;
}

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect, onRightClickSelect, archConfig, hdriPreset, onCaptureReady }:
  Omit<PlannerCanvas3DProps, 'scale' | 'architecturalConfig' | 'fpsMode' | 'onExitFps'> & { archConfig: ArchitecturalConfig; hdriPreset: HdriPresetType; onCaptureReady: (fn: () => void) => void }) {
  const w = roomDimensions.width / 1000;
  const d = roomDimensions.height / 1000;

  const handleFurnitureSelect = useCallback((id: string | null) => {
    onSelect(id);
  }, [onSelect]);

  const handleContextMenu = useCallback((id: string) => {
    if (onRightClickSelect) onRightClickSelect(id);
  }, [onRightClickSelect]);

  return (
    <>
      {/* Soft ambient fill — dominant ambient lighting (cheaper than many point lights) */}
      <ambientLight intensity={0.55} />

      {/* HDRI Environment Map for reflections only (no background) */}
      <Environment preset={hdriPreset} background={false} environmentIntensity={0.45} />

      {/* Single key directional light with low-res shadows */}
      <directionalLight
        position={[w + 4, 12, d + 4]} intensity={0.55} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
        shadow-normalBias={0.04}
        shadow-camera-near={0.5} shadow-camera-far={40}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={10} shadow-camera-bottom={-10}
      />

      {/* Soft hemisphere bounce */}
      <hemisphereLight args={['#dde4f0', '#8b7355', 0.35]} />
      <color attach="background" args={['#f0eee8']} />

      {/* Lightweight contact shadow (single-frame bake) */}
      <ContactShadows
        position={[w / 2, 0, d / 2]} opacity={0.4}
        scale={Math.max(w, d) * 1.5} blur={2.5} far={3}
        color="#1a1410"
        resolution={256}
        frames={1}
      />

      <Room dimensions={roomDimensions} archConfig={archConfig} />

      {placedFurniture.map(item => (
        <FurnitureObject
          key={item.id} item={item} isSelected={selectedId === item.id}
          onSelect={handleFurnitureSelect} onContextSelect={handleContextMenu}
        />
      ))}

      <SnapshotHelper onCapture={onCaptureReady} />

      <KeyboardCameraControls />
      <OrbitControls
        target={[w / 2, 0.5, d / 2]}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI * 0.95}
        minDistance={0.5} maxDistance={30}
        enableDamping dampingFactor={0.06}
        enablePan panSpeed={0.8}
        rotateSpeed={0.7}
        zoomSpeed={1.2}
      />
    </>
  );
}

export const PlannerCanvas3D = ({
  roomDimensions, placedFurniture, selectedId,
  onSelect, onRightClickSelect, architecturalConfig, hdriPreset = 'apartment',
}: PlannerCanvas3DProps) => {
  const captureRef = useRef<(() => void) | null>(null);
  const archConfig = architecturalConfig || DEFAULT_ARCHITECTURAL_CONFIG;

  const handleSnapshot = useCallback(() => {
    if (captureRef.current) {
      captureRef.current();
    } else {
      toast.error('렌더러를 찾을 수 없습니다');
    }
  }, []);

  const handleCaptureReady = useCallback((fn: () => void) => {
    captureRef.current = fn;
  }, []);

  return (
    <div className="w-full h-full bg-muted/30 relative" onContextMenu={(e) => e.preventDefault()}>
      {/* Tooltip */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        WASD: 이동 | QE: 회전 | RF: 상하 | 마우스 드래그: 궤도 회전 | 좌클릭: 선택 | 우클릭: 정보 고정
      </div>

      <Button
        variant="outline" size="sm" onClick={handleSnapshot}
        className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-primary hover:text-primary-foreground gap-2"
      >
        <Camera className="h-4 w-4" />
        렌더링 샷 찍기
      </Button>

      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [8, 6, 8], fov: 45 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.25]}
        frameloop="demand"
        onContextMenu={(e) => e.preventDefault()}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          // Ensure frustum culling enabled (default true) on all scene objects
          scene.traverse((obj) => { obj.frustumCulled = true; });
        }}
      >
        <Scene
          roomDimensions={roomDimensions}
          placedFurniture={placedFurniture}
          selectedId={selectedId}
          onSelect={onSelect}
          onRightClickSelect={onRightClickSelect}
          archConfig={archConfig}
          hdriPreset={hdriPreset}
          onCaptureReady={handleCaptureReady}
        />
      </Canvas>
    </div>
  );
};
