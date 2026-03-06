import { useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, SoftShadows, ContactShadows, Edges } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import { FurnitureObject } from './FurnitureModels';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as THREE from 'three';
import { ArchitecturalConfig, DEFAULT_ARCHITECTURAL_CONFIG } from './ArchitecturalSettingsPanel';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onRightClickSelect?: (id: string) => void;
  architecturalConfig?: ArchitecturalConfig;
}

const WALL_COLOR = '#f5f2ec';
const FLOOR_COLOR = '#c8b89a';
const EDGE_COLOR = '#2a2a2a';

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

function DoorElement({ position, rotation, width = 0.9, height = 2.1, type = 'swing' }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number; type?: string;
}) {
  const frameColor = '#d5d0c5';
  const isDouble = type === 'double';
  const panelW = isDouble ? width / 2 : width;

  return (
    <group position={position} rotation={rotation}>
      {(isDouble ? [-(panelW / 2 + 0.002), (panelW / 2 + 0.002)] : [0]).map((xOff, i) => (
        <group key={i}>
          <mesh position={[xOff, height / 2, 0]}>
            <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.04]} />
            <meshStandardMaterial color="#b8a990" roughness={0.7} metalness={0.02} />
            <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
          </mesh>
          <mesh position={[xOff, height * 0.65, 0.022]}>
            <boxGeometry args={[panelW * 0.65, height * 0.3, 0.005]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
          </mesh>
          <mesh position={[xOff, height * 0.25, 0.022]}>
            <boxGeometry args={[panelW * 0.65, height * 0.25, 0.005]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
          </mesh>
          <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.035]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[-width / 2 - 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[width / 2 + 0.03, height / 2, 0]}>
        <boxGeometry args={[0.06, height + 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, height + 0.03, 0]}>
        <boxGeometry args={[width + 0.12, 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
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

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.75} metalness={0.02} />
      </mesh>
      {Array.from({ length: Math.ceil(w / 0.15) }, (_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[i * 0.15, 0.001, d / 2]}>
          <planeGeometry args={[0.002, d]} />
          <meshStandardMaterial color="#b8a888" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Back wall */}
      <mesh position={[w / 2, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} metalness={0.01} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>
      {/* Left wall */}
      <mesh position={[0, wallH / 2, d / 2]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} metalness={0.01} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>
      {/* Right wall (ghost) */}
      <mesh position={[w, wallH / 2, d / 2]}>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshStandardMaterial color={WALL_COLOR} transparent opacity={0.1} roughness={0.9} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.6} />
      </mesh>
      {/* Front wall (ghost) */}
      <mesh position={[w / 2, wallH / 2, d]}>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshStandardMaterial color={WALL_COLOR} transparent opacity={0.1} roughness={0.9} />
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
            width={door.width} height={door.height} type={door.type} />
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

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect, onRightClickSelect, archConfig, onCaptureReady }:
  Omit<PlannerCanvas3DProps, 'scale' | 'architecturalConfig'> & { archConfig: ArchitecturalConfig; onCaptureReady: (fn: () => void) => void }) {
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
      <SoftShadows size={25} samples={16} focus={0.5} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[w + 4, 12, d + 4]} intensity={1.0} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={10} shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 8, -2]} intensity={0.3} />
      <directionalLight position={[0, 5, d + 5]} intensity={0.2} />
      <hemisphereLight args={['#c4d4e8', '#8b7355', 0.4]} />
      <color attach="background" args={['#f0eee8']} />

      <ContactShadows
        position={[w / 2, 0, d / 2]} opacity={0.4}
        scale={Math.max(w, d) * 1.5} blur={2} far={4}
      />

      <Room dimensions={roomDimensions} archConfig={archConfig} />

      {placedFurniture.map(item => (
        <FurnitureObject
          key={item.id} item={item} isSelected={selectedId === item.id}
          onSelect={handleFurnitureSelect} onContextSelect={handleContextMenu}
        />
      ))}

      <SnapshotHelper onCapture={onCaptureReady} />

      <OrbitControls
        target={[w / 2, 0.5, d / 2]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2} maxDistance={20}
        enableDamping dampingFactor={0.08}
      />
    </>
  );
}

export const PlannerCanvas3D = ({
  roomDimensions, placedFurniture, selectedId,
  onSelect, onRightClickSelect, architecturalConfig,
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
      {/* Tooltip — static, no animation */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        좌클릭: 선택 | 우클릭: 정보 고정 | 드래그: 회전/확대
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
        camera={{ position: [8, 6, 8], fov: 45 }}
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
          onCaptureReady={handleCaptureReady}
        />
      </Canvas>
    </div>
  );
};
