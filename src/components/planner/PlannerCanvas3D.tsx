import { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, SoftShadows, ContactShadows, Edges, Environment } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
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
const FLOOR_MATERIALS: Record<FloorMaterialType, { color: string; roughness: number; metalness: number; pattern: 'plank' | 'tile' | 'none' }> = {
  'wood-light': { color: '#c8b89a', roughness: 0.75, metalness: 0.02, pattern: 'plank' },
  'wood-dark': { color: '#6b5340', roughness: 0.7, metalness: 0.02, pattern: 'plank' },
  'wood-walnut': { color: '#8b6f55', roughness: 0.65, metalness: 0.03, pattern: 'plank' },
  'marble-white': { color: '#eae8e3', roughness: 0.15, metalness: 0.05, pattern: 'tile' },
  'marble-gray': { color: '#b5b0a8', roughness: 0.18, metalness: 0.05, pattern: 'tile' },
  'tile-white': { color: '#f0ede8', roughness: 0.4, metalness: 0.02, pattern: 'tile' },
  'tile-gray': { color: '#a8a5a0', roughness: 0.45, metalness: 0.02, pattern: 'tile' },
  'concrete': { color: '#b8b5b0', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'carpet-gray': { color: '#9a9590', roughness: 0.95, metalness: 0.0, pattern: 'none' },
  'carpet-blue': { color: '#6878a0', roughness: 0.95, metalness: 0.0, pattern: 'none' },
};

const WALL_MATERIALS: Record<WallMaterialType, { color: string; roughness: number; metalness: number; pattern: 'none' | 'stripe' | 'texture' | 'brick' | 'plank' }> = {
  'paint-white': { color: '#f5f2ec', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'paint-cream': { color: '#f0e8d8', roughness: 0.9, metalness: 0.01, pattern: 'none' },
  'paint-gray': { color: '#d0cdc8', roughness: 0.88, metalness: 0.01, pattern: 'none' },
  'paint-sage': { color: '#c5cfbe', roughness: 0.88, metalness: 0.01, pattern: 'none' },
  'wallpaper-stripe': { color: '#e8e4db', roughness: 0.85, metalness: 0.01, pattern: 'stripe' },
  'wallpaper-texture': { color: '#e5e0d5', roughness: 0.82, metalness: 0.01, pattern: 'texture' },
  'brick-white': { color: '#e8e0d5', roughness: 0.92, metalness: 0.02, pattern: 'brick' },
  'brick-red': { color: '#a05030', roughness: 0.92, metalness: 0.02, pattern: 'brick' },
  'concrete': { color: '#c0bdb8', roughness: 0.95, metalness: 0.01, pattern: 'texture' },
  'wood-panel': { color: '#b09878', roughness: 0.7, metalness: 0.03, pattern: 'plank' },
};

// ===== Architectural Elements =====

function WindowElement({ position, rotation, width = 1.2, height = 1.4, type = 'double' }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number; type?: string;
}) {
  const frameColor = '#e8e4db';
  const frameThick = 0.04;
  const hasDivider = type === 'double' || type === 'single';
  const hasHorizontalDivider = type === 'double';

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#b8d4e8"
          transparent opacity={0.3}
          roughness={0.05} metalness={0.1}
          transmission={0.6} thickness={0.01}
        />
      </mesh>
      <mesh position={[0, height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, -height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[-width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {hasDivider && (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, height, 0.025]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {hasHorizontalDivider && (
        <mesh position={[0, 0.05, 0.01]}>
          <boxGeometry args={[width, 0.02, 0.025]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
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
      <mesh position={[0, -height / 2 - 0.02, 0.04]}>
        <boxGeometry args={[width + 0.08, 0.03, 0.08]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
      <pointLight position={[0, 0, -0.5]} intensity={0.4} color="#fffbe6" distance={5} />
    </group>
  );
}

function DoorElement({ position, rotation, width = 0.9, height = 2.1, type = 'swing', material = 'wood' }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number; type?: string; material?: string;
}) {
  const frameColor = '#d5d0c5';
  const isDouble = type === 'double';
  const panelW = isDouble ? width / 2 : width;
  const isGlass = material === 'glass';
  const isMetal = material === 'metal';

  const panelColor = isGlass ? '#a8c8d8' : isMetal ? '#b0b0b0' : '#b8a990';
  const panelRough = isGlass ? 0.1 : isMetal ? 0.25 : 0.7;
  const panelMetal = isGlass ? 0.05 : isMetal ? 0.85 : 0.02;
  const panelOpacity = isGlass ? 0.4 : 1;
  const panelTransparent = isGlass;

  return (
    <group position={position} rotation={rotation}>
      {(isDouble ? [-(panelW / 2 + 0.002), (panelW / 2 + 0.002)] : [0]).map((xOff, i) => (
        <group key={i}>
          <mesh position={[xOff, height / 2, 0]}>
            <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.04]} />
            <meshPhysicalMaterial color={panelColor} roughness={panelRough} metalness={panelMetal}
              transparent={panelTransparent} opacity={panelOpacity}
              transmission={isGlass ? 0.5 : 0} thickness={isGlass ? 0.02 : 0} />
            <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
          </mesh>
          {!isGlass && (
            <>
              <mesh position={[xOff, height * 0.65, 0.022]}>
                <boxGeometry args={[panelW * 0.65, height * 0.3, 0.005]} />
                <meshStandardMaterial color={isGlass ? '#c0d8e8' : isMetal ? '#c0c0c0' : '#c4b5a0'} roughness={panelRough} metalness={panelMetal} />
              </mesh>
              <mesh position={[xOff, height * 0.25, 0.022]}>
                <boxGeometry args={[panelW * 0.65, height * 0.25, 0.005]} />
                <meshStandardMaterial color={isMetal ? '#c0c0c0' : '#c4b5a0'} roughness={panelRough} metalness={panelMetal} />
              </mesh>
            </>
          )}
          <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.035]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Frame */}
      <mesh position={[-width / 2 - 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={isMetal ? '#888' : frameColor} roughness={isMetal ? 0.3 : 0.6} metalness={isMetal ? 0.7 : 0.05} />
      </mesh>
      <mesh position={[width / 2 + 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={isMetal ? '#888' : frameColor} roughness={isMetal ? 0.3 : 0.6} metalness={isMetal ? 0.7 : 0.05} />
      </mesh>
      <mesh position={[0, height + 0.03, 0]}>
        <boxGeometry args={[width + 0.12, 0.06, 0.08]} />
        <meshStandardMaterial color={isMetal ? '#888' : frameColor} roughness={isMetal ? 0.3 : 0.6} metalness={isMetal ? 0.7 : 0.05} />
      </mesh>
      {type === 'sliding' && (
        <mesh position={[0, height + 0.06, 0]}>
          <boxGeometry args={[width + 0.2, 0.03, 0.06]} />
          <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
        </mesh>
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

  return (
    <group position={position}>
      {isPendant ? (
        <>
          {/* Cord */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.6, 6]} />
            <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Shade */}
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 0.2, 16, 1, true]} />
            <meshStandardMaterial color="#e8e4db" roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, -0.7, 0]} intensity={0.8} color="#fff5e0" distance={6} castShadow />
        </>
      ) : isSpot ? (
        <>
          {/* Housing */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.1, 12]} />
            <meshStandardMaterial color="#ccc" roughness={0.3} metalness={0.7} />
          </mesh>
          <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} intensity={1} color="#fff8ee" distance={5} castShadow />
        </>
      ) : (
        <>
          {/* Panel light */}
          <mesh position={[0, -0.015, 0]}>
            <boxGeometry args={[0.6, 0.03, 0.6]} />
            <meshStandardMaterial color="#f5f3ee" roughness={0.2} metalness={0.1} />
          </mesh>
          {/* Glow surface */}
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
            width={win.width} height={win.height} type={win.type} />
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

// ===== Collision Detection Helper =====
function checkCollision(
  newPos: THREE.Vector3,
  roomW: number, roomD: number,
  furniture: PlacedFurniture[],
  playerRadius: number = 0.25
): boolean {
  const wallMargin = playerRadius + 0.06; // wall thickness offset
  // Wall collision
  if (newPos.x < wallMargin || newPos.x > roomW - wallMargin) return true;
  if (newPos.z < wallMargin || newPos.z > roomD - wallMargin) return true;

  // Furniture collision (AABB check)
  const roomScale = 0.1;
  for (const item of furniture) {
    const fw = item.furniture.width / 1000;
    const fd = item.furniture.height / 1000;
    const fx = (item.x / roomScale) / 1000 + fw / 2;
    const fz = (item.y / roomScale) / 1000 + fd / 2;

    // Simple AABB with rotation consideration
    const rot = (item.rotation * Math.PI) / 180;
    const cosR = Math.abs(Math.cos(rot));
    const sinR = Math.abs(Math.sin(rot));
    const effectiveW = fw * cosR + fd * sinR;
    const effectiveD = fw * sinR + fd * cosR;

    const halfW = effectiveW / 2 + playerRadius;
    const halfD = effectiveD / 2 + playerRadius;

    if (
      newPos.x > fx - halfW && newPos.x < fx + halfW &&
      newPos.z > fz - halfD && newPos.z < fz + halfD
    ) {
      return true;
    }
  }
  return false;
}

// ===== Keyboard Camera Controls (WASD + QE + RF) =====
function KeyboardCameraControls({ fpsMode, roomDimensions, placedFurniture }: {
  fpsMode?: boolean;
  roomDimensions?: RoomDimensions;
  placedFurniture?: PlacedFurniture[];
}) {
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
    const speed = (fpsMode ? 2.5 : 4) * delta;
    const rotSpeed = 1.5 * delta;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (fpsMode && roomDimensions) {
      // FPS mode with collision detection
      const roomW = roomDimensions.width / 1000;
      const roomD = roomDimensions.height / 1000;
      const furniture = placedFurniture || [];
      const newPos = camera.position.clone();

      if (keys.current.has('w')) newPos.addScaledVector(forward, speed);
      if (keys.current.has('s')) newPos.addScaledVector(forward, -speed);
      if (keys.current.has('a')) newPos.addScaledVector(right, -speed);
      if (keys.current.has('d')) newPos.addScaledVector(right, speed);

      // Try full move first
      if (!checkCollision(newPos, roomW, roomD, furniture)) {
        camera.position.copy(newPos);
      } else {
        // Try sliding along axes independently
        const slideX = camera.position.clone();
        slideX.x = newPos.x;
        if (!checkCollision(slideX, roomW, roomD, furniture)) {
          camera.position.x = slideX.x;
        }
        const slideZ = camera.position.clone();
        slideZ.z = newPos.z;
        if (!checkCollision(slideZ, roomW, roomD, furniture)) {
          camera.position.z = slideZ.z;
        }
      }
    } else {
      // Standard orbit mode — no collision
      if (keys.current.has('w')) camera.position.addScaledVector(forward, speed);
      if (keys.current.has('s')) camera.position.addScaledVector(forward, -speed);
      if (keys.current.has('a')) camera.position.addScaledVector(right, -speed);
      if (keys.current.has('d')) camera.position.addScaledVector(right, speed);

      if (keys.current.has('r')) camera.position.y += speed;
      if (keys.current.has('f')) camera.position.y = Math.max(0.2, camera.position.y - speed);
      if (keys.current.has('q')) camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
      if (keys.current.has('e')) camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
    }
  });

  return null;
}

// ===== FPS Camera Controls (PointerLock-like mouse look) =====
function FPSCameraControls({ roomDimensions, onExitFps }: { roomDimensions: RoomDimensions; onExitFps?: () => void }) {
  const { camera, gl } = useThree();
  const isLocked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const EYE_HEIGHT = 1.6;

  // Set initial FPS position
  useEffect(() => {
    const w = roomDimensions.width / 1000;
    const d = roomDimensions.height / 1000;
    camera.position.set(w / 2, EYE_HEIGHT, d - 1);
    camera.rotation.set(0, Math.PI, 0);
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
  }, []);

  // Lock height in FPS mode
  useFrame(() => {
    camera.position.y = EYE_HEIGHT;
  });

  // Pointer lock for mouse look
  useEffect(() => {
    const canvas = gl.domElement;

    const onClick = () => {
      canvas.requestPointerLock();
    };

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const sensitivity = 0.002;
      euler.current.y -= e.movementX * sensitivity;
      euler.current.x -= e.movementY * sensitivity;
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLocked.current) {
        document.exitPointerLock();
        onExitFps?.();
      }
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [gl, camera, onExitFps]);

  return null;
}

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect, onRightClickSelect, archConfig, hdriPreset, onCaptureReady, fpsMode, onExitFps }:
  Omit<PlannerCanvas3DProps, 'scale' | 'architecturalConfig'> & { archConfig: ArchitecturalConfig; hdriPreset: HdriPresetType; onCaptureReady: (fn: () => void) => void }) {
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
      <SoftShadows size={30} samples={20} focus={0.4} />

      {/* HDRI Environment Map for realistic reflections */}
      <Environment preset={hdriPreset} background={false} environmentIntensity={0.5} />

      {/* Soft ambient fill */}
      <ambientLight intensity={0.15} />

      {/* Primary key light — directional with high-res shadows */}
      <directionalLight
        position={[w + 4, 12, d + 4]} intensity={0.8} castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12}
      />

      {/* Rect Area Lights — soft, realistic indoor lighting */}
      {/* Ceiling overhead panel light */}
      <rectAreaLight
        position={[w / 2, 2.75, d / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={w * 0.6}
        height={d * 0.6}
        intensity={3}
        color="#fff8ee"
      />
      {/* Window-side fill light */}
      <rectAreaLight
        position={[w / 2, 1.8, 0.05]}
        rotation={[0, 0, 0]}
        width={w * 0.8}
        height={1.5}
        intensity={1.5}
        color="#e8f0ff"
      />
      {/* Side wall bounce */}
      <rectAreaLight
        position={[0.05, 1.4, d / 2]}
        rotation={[0, Math.PI / 2, 0]}
        width={d * 0.5}
        height={1.2}
        intensity={0.8}
        color="#fff5e8"
      />

      {/* Soft fill from opposite side */}
      <directionalLight position={[-3, 6, -2]} intensity={0.15} color="#c8d8f0" />
      {/* Ground bounce */}
      <hemisphereLight args={['#dde4f0', '#8b7355', 0.25]} />
      <color attach="background" args={['#f0eee8']} />

      {/* Contact shadows for ground contact realism */}
      <ContactShadows
        position={[w / 2, 0, d / 2]} opacity={0.55}
        scale={Math.max(w, d) * 1.5} blur={3} far={4}
        color="#1a1410"
        resolution={1024}
        frames={Infinity}
      />

      <Room dimensions={roomDimensions} archConfig={archConfig} />

      {placedFurniture.map(item => (
        <FurnitureObject
          key={item.id} item={item} isSelected={selectedId === item.id}
          onSelect={handleFurnitureSelect} onContextSelect={handleContextMenu}
        />
      ))}

      <SnapshotHelper onCapture={onCaptureReady} />

      {/* Post-processing: SSAO + subtle Bloom */}
      <EffectComposer multisampling={4}>
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={21}
          radius={0.12}
          intensity={18}
          luminanceInfluence={0.6}
          worldDistanceThreshold={1.2}
          worldDistanceFalloff={0.5}
          worldProximityThreshold={0.4}
          worldProximityFalloff={0.3}
        />
        <Bloom
          intensity={0.08}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      </EffectComposer>

      <KeyboardCameraControls fpsMode={fpsMode} />
      {fpsMode ? (
        <FPSCameraControls roomDimensions={roomDimensions} onExitFps={onExitFps} />
      ) : (
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
      )}
    </>
  );
}

export const PlannerCanvas3D = ({
  roomDimensions, placedFurniture, selectedId,
  onSelect, onRightClickSelect, architecturalConfig, hdriPreset = 'apartment',
  fpsMode = false, onExitFps,
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
    <div className="flex-1 bg-muted/30 relative" onContextMenu={(e) => e.preventDefault()}>
      {/* Tooltip */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        {fpsMode
          ? '🚶 1인칭 모드 | 클릭하여 마우스 잠금 | WASD: 이동 | ESC: 나가기'
          : 'WASD: 이동 | QE: 회전 | RF: 상하 | 마우스 드래그: 궤도 회전 | 좌클릭: 선택 | 우클릭: 정보 고정'}
      </div>

      <Button
        variant="outline" size="sm" onClick={handleSnapshot}
        className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-primary hover:text-primary-foreground gap-2"
      >
        <Camera className="h-4 w-4" />
        렌더링 샷 찍기
      </Button>

      <Canvas
        shadows
        camera={{ position: fpsMode ? [roomDimensions.width / 2000, 1.6, roomDimensions.height / 1000 - 1] : [8, 6, 8], fov: fpsMode ? 75 : 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onContextMenu={(e) => e.preventDefault()}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
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
          fpsMode={fpsMode}
          onExitFps={onExitFps}
        />
      </Canvas>
    </div>
  );
};
