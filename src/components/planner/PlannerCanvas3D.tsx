import { useRef, useCallback, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, SoftShadows, ContactShadows } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import { FurnitureObject } from './FurnitureModels';
import { Edges } from '@react-three/drei';
import { Camera, DoorOpen, PanelTop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as THREE from 'three';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onRightClickSelect?: (id: string) => void;
}

const WALL_COLOR = '#f5f2ec';
const FLOOR_COLOR = '#c8b89a';
const EDGE_COLOR = '#2a2a2a';

// ===== Architectural Elements =====

function WindowElement({ position, rotation, width = 1.2, height = 1.4 }: {
  position: [number, number, number]; rotation: [number, number, number];
  width?: number; height?: number;
}) {
  const frameColor = '#e8e4db';
  const frameThick = 0.04;

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
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.02, height, 0.025]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Center divider horizontal */}
      <mesh position={[0, 0.05, 0.01]}>
        <boxGeometry args={[width, 0.02, 0.025]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.05} />
      </mesh>
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

function DoorElement({ position, rotation }: {
  position: [number, number, number]; rotation: [number, number, number];
}) {
  const doorW = 0.9;
  const doorH = 2.1;
  const frameColor = '#d5d0c5';

  return (
    <group position={position} rotation={rotation}>
      {/* Door panel */}
      <mesh position={[0, doorH / 2, 0]}>
        <boxGeometry args={[doorW, doorH, 0.04]} />
        <meshStandardMaterial color="#b8a990" roughness={0.7} metalness={0.02} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Panel inset top */}
      <mesh position={[0, doorH * 0.65, 0.022]}>
        <boxGeometry args={[doorW * 0.7, doorH * 0.35, 0.005]} />
        <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
      </mesh>
      {/* Panel inset bottom */}
      <mesh position={[0, doorH * 0.25, 0.022]}>
        <boxGeometry args={[doorW * 0.7, doorH * 0.3, 0.005]} />
        <meshStandardMaterial color="#c4b5a0" roughness={0.75} metalness={0.02} />
      </mesh>
      {/* Frame */}
      <mesh position={[-doorW / 2 - 0.03, doorH / 2, 0]}>
        <boxGeometry args={[0.06, doorH + 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[doorW / 2 + 0.03, doorH / 2, 0]}>
        <boxGeometry args={[0.06, doorH + 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, doorH + 0.03, 0]}>
        <boxGeometry args={[doorW + 0.12, 0.06, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Handle */}
      <mesh position={[doorW * 0.38, doorH * 0.47, 0.035]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[doorW * 0.38, doorH * 0.47, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ===== Crown Molding =====
function CrownMolding({ w, d, wallH }: { w: number; d: number; wallH: number }) {
  const moldH = 0.06;
  const moldD = 0.04;
  return (
    <group>
      {/* Back wall molding */}
      <mesh position={[w / 2, wallH - moldH / 2, moldD / 2]}>
        <boxGeometry args={[w, moldH, moldD]} />
        <meshStandardMaterial color="#e2ded5" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Left wall molding */}
      <mesh position={[moldD / 2, wallH - moldH / 2, d / 2]}>
        <boxGeometry args={[moldD, moldH, d]} />
        <meshStandardMaterial color="#e2ded5" roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  );
}

interface RoomConfig {
  showWindows: boolean;
  showDoor: boolean;
}

function Room({ dimensions, config }: { dimensions: RoomDimensions; config: RoomConfig }) {
  const w = dimensions.width / 1000;
  const d = dimensions.height / 1000;
  const wallH = 2.8;
  const wallThickness = 0.06;

  return (
    <group>
      {/* Floor – wood plank pattern via repeating strips */}
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

      {/* Baseboard - back wall */}
      <mesh position={[w / 2, 0.04, wallThickness / 2 + 0.005]}>
        <boxGeometry args={[w, 0.08, 0.015]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Baseboard - left wall */}
      <mesh position={[wallThickness / 2 + 0.005, 0.04, d / 2]}>
        <boxGeometry args={[0.015, 0.08, d]} />
        <meshStandardMaterial color="#d5d0c5" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Crown Molding */}
      <CrownMolding w={w} d={d} wallH={wallH} />

      {/* Windows on back wall */}
      {config.showWindows && (
        <>
          <WindowElement
            position={[w * 0.3, wallH * 0.55, wallThickness / 2 + 0.002]}
            rotation={[0, 0, 0]}
          />
          {w > 4 && (
            <WindowElement
              position={[w * 0.7, wallH * 0.55, wallThickness / 2 + 0.002]}
              rotation={[0, 0, 0]}
            />
          )}
        </>
      )}

      {/* Door on left wall */}
      {config.showDoor && (
        <DoorElement
          position={[wallThickness / 2 + 0.002, 0, d * 0.8]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}

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

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect, onRightClickSelect, roomConfig }: 
  Omit<PlannerCanvas3DProps, 'scale'> & { roomConfig: RoomConfig }) {
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

      {/* Studio lighting */}
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

      <Room dimensions={roomDimensions} config={roomConfig} />

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
}: PlannerCanvas3DProps) => {
  const glRef = useRef<any>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({ showWindows: true, showDoor: true });

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

      {/* Architectural toggles */}
      <div className="absolute top-2 right-4 z-10 flex gap-1">
        <Button
          variant={roomConfig.showWindows ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRoomConfig(prev => ({ ...prev, showWindows: !prev.showWindows }))}
          className="gap-1 text-xs h-7"
        >
          <PanelTop className="h-3.5 w-3.5" />
          창문
        </Button>
        <Button
          variant={roomConfig.showDoor ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRoomConfig(prev => ({ ...prev, showDoor: !prev.showDoor }))}
          className="gap-1 text-xs h-7"
        >
          <DoorOpen className="h-3.5 w-3.5" />
          도어
        </Button>
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
          roomConfig={roomConfig}
        />
      </Canvas>
    </div>
  );
};
