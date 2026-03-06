import { useRef, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
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
      {/* Glass */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#b8d4e8"
          transparent
          opacity={0.3}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
          thickness={0.01}
        />
      </mesh>
      {/* Frame — top */}
      <mesh position={[0, height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Frame — bottom */}
      <mesh position={[0, -height / 2, 0.01]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Frame — left */}
      <mesh position={[-width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Frame — right */}
      <mesh position={[width / 2, 0, 0.01]}>
        <boxGeometry args={[frameThick, height, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Center divider vertical */}
      {hasDivider && (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, height, 0.025]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {/* Center divider horizontal */}
      {hasHorizontalDivider && (
        <mesh position={[0, 0.05, 0.01]}>
          <boxGeometry args={[width, 0.02, 0.025]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {/* Sliding rail for sliding type */}
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
      {/* Sill */}
      <mesh position={[0, -height / 2 - 0.02, 0.04]}>
        <boxGeometry args={[width + 0.08, 0.03, 0.08]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Outdoor light glow */}
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
      {/* Door panel(s) */}
      {(isDouble ? [-(panelW / 2 + 0.002), (panelW / 2 + 0.002)] : [0]).map((xOff, i) => (
        <group key={i}>
          <mesh position={[xOff, height / 2, 0]}>
            <boxGeometry args={[panelW - (isDouble ? 0.004 : 0), height, 0.04]} />
            <meshStandardMaterial color="#b8a990" roughness={0.7} metalness={0.02} />
            <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
          </mesh>
          {/* Panel inset top */}
          <mesh position={[xOff, height * 0.65, 0.022]}>
            <boxGeometry args={[panelW * 0.65, height * 0.3, 0.005]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
          </mesh>
          {/* Panel inset bottom */}
          <mesh position={[xOff, height * 0.25, 0.022]}>
            <boxGeometry args={[panelW * 0.65, height * 0.25, 0.005]} />
            <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
          </mesh>
          {/* Handle */}
          <mesh position={[xOff + (isDouble ? (i === 0 ? panelW * 0.35 : -panelW * 0.35) : panelW * 0.38), height * 0.47, 0.035]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Frame */}
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
      {/* Sliding rail */}
      {type === 'sliding' && (
        <mesh position={[0, height + 0.06, 0]}>
          <boxGeometry args={[width + 0.2, 0.03, 0.06]} />
          <meshStandardMaterial color="#999" roughness={0.3} metalness={0.7} />
        </mesh>
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
    switch (wall) {
      case 'back':
        return { position: [w * posRatio, yCenter, wallThickness / 2 + 0.002], rotation: [0, 0, 0] };
      case 'left':
        return { position: [wallThickness / 2 + 0.002, yCenter, d * posRatio], rotation: [0, Math.PI / 2, 0] };
      case 'right':
        return { position: [w - wallThickness / 2 - 0.002, yCenter, d * posRatio], rotation: [0, -Math.PI / 2, 0] };
      case 'front':
        return { position: [w * posRatio, yCenter, d - wallThickness / 2 - 0.002], rotation: [0, Math.PI, 0] };
      default:
        return { position: [w * posRatio, yCenter, wallThickness / 2 + 0.002], rotation: [0, 0, 0] };
    }
  };

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.75} metalness={0.02} />
      </mesh>
      {/* Plank lines */}
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

      {/* Dynamic Windows */}
      {archConfig.windows.map((win, idx) => {
        const { position, rotation } = getWallPosition(win.wall, win.positionRatio, wallH * 0.55);
        return (
          <WindowElement
            key={`win-${idx}`}
            position={position}
            rotation={rotation}
            width={win.width}
            height={win.height}
            type={win.type}
          />
        );
      })}

      {/* Dynamic Doors */}
      {archConfig.doors.map((door, idx) => {
        const { position, rotation } = getWallPosition(door.wall, door.positionRatio, 0);
        return (
          <DoorElement
            key={`door-${idx}`}
            position={position}
            rotation={rotation}
            width={door.width}
            height={door.height}
            type={door.type}
          />
        );
      })}

      {/* Grid */}
      <Grid
        position={[w / 2, 0.001, d / 2]}
        args={[w, d]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#ccc"
        sectionSize={1}
        sectionThickness={0.8}
        sectionColor="#999"
        fadeDistance={25}
        infiniteGrid={false}
      />

      {/* Dimension labels */}
      <Text position={[w / 2, 0.02, d + 0.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#555" anchorX="center">
        {w.toFixed(1)}m
      </Text>
      <Text position={[-0.3, 0.02, d / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.18} color="#555" anchorX="center">
        {d.toFixed(1)}m
      </Text>
    </group>
  );
}

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect, onRightClickSelect, archConfig }:
  Omit<PlannerCanvas3DProps, 'scale' | 'architecturalConfig'> & { archConfig: ArchitecturalConfig }) {
  const w = roomDimensions.width / 1000;
  const d = roomDimensions.height / 1000;

  const handleFurnitureSelect = useCallback((id: string | null) => {
    onSelect(id);
  }, [onSelect]);

  const handleContextMenu = useCallback((id: string) => {
    if (onRightClickSelect) {
      onRightClickSelect(id);
    }
  }, [onRightClickSelect]);

  return (
    <>
      <SoftShadows size={25} samples={16} focus={0.5} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[w + 4, 12, d + 4]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 8, -2]} intensity={0.3} />
      <directionalLight position={[0, 5, d + 5]} intensity={0.2} />
      <hemisphereLight args={['#c4d4e8', '#8b7355', 0.4]} />
      <color attach="background" args={['#f0eee8']} />

      <ContactShadows
        position={[w / 2, 0, d / 2]}
        opacity={0.4}
        scale={Math.max(w, d) * 1.5}
        blur={2}
        far={4}
      />

      <Room dimensions={roomDimensions} archConfig={archConfig} />

      {placedFurniture.map(item => (
        <FurnitureObject
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={handleFurnitureSelect}
          onContextSelect={handleContextMenu}
        />
      ))}

      <OrbitControls
        target={[w / 2, 0.5, d / 2]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={20}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export const PlannerCanvas3D = ({
  roomDimensions,
  placedFurniture,
  selectedId,
  onSelect,
  onRightClickSelect,
  architecturalConfig,
}: PlannerCanvas3DProps) => {
  const glRef = useRef<any>(null);
  const archConfig = architecturalConfig || DEFAULT_ARCHITECTURAL_CONFIG;

  const handleSnapshot = useCallback(() => {
    if (!glRef.current) {
      toast.error('렌더러를 찾을 수 없습니다');
      return;
    }
    try {
      const canvas = glRef.current.domElement;
      glRef.current.render(glRef.current._scene || glRef.current.scene, glRef.current._camera || glRef.current.camera);
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `GGI-렌더링샷-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('렌더링 샷이 저장되었습니다!');
    } catch (err) {
      console.error('Snapshot error:', err);
      toast.error('스냅샷 저장에 실패했습니다');
    }
  }, []);

  return (
    <div className="flex-1 bg-muted/30 relative" onContextMenu={(e) => e.preventDefault()}>
      {/* Tooltip hint */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        좌클릭: 선택 | 우클릭: 정보 고정 | 드래그: 회전/확대
      </div>

      {/* Snapshot button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSnapshot}
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
          glRef.current = gl;
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
        />
      </Canvas>
    </div>
  );
};
