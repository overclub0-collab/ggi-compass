import { useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, SoftShadows, Environment, ContactShadows } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import { FurnitureObject } from './FurnitureModels';
import { Edges } from '@react-three/drei';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
}

const WALL_COLOR = '#f5f2ec';
const FLOOR_COLOR = '#e8e4db';
const EDGE_COLOR = '#2a2a2a';

function Room({ dimensions }: { dimensions: RoomDimensions }) {
  const w = dimensions.width / 1000;
  const d = dimensions.height / 1000;
  const wallH = 2.8;
  const wallThickness = 0.06;

  return (
    <group>
      {/* Floor with wood-like material */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} metalness={0.02} />
      </mesh>

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
      <Text
        position={[w / 2, 0.02, d + 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color="#555"
        anchorX="center"
      >
        {w.toFixed(1)}m
      </Text>
      <Text
        position={[-0.3, 0.02, d / 2]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.18}
        color="#555"
        anchorX="center"
      >
        {d.toFixed(1)}m
      </Text>
    </group>
  );
}

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect }: Omit<PlannerCanvas3DProps, 'scale'>) {
  const w = roomDimensions.width / 1000;
  const d = roomDimensions.height / 1000;

  return (
    <>
      {/* Soft Shadows for realism */}
      <SoftShadows size={25} samples={16} focus={0.5} />

      {/* Studio lighting setup */}
      <ambientLight intensity={0.35} />
      
      {/* Key light - main directional */}
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
      
      {/* Fill light */}
      <directionalLight position={[-4, 8, -2]} intensity={0.3} />
      
      {/* Rim light for edge definition */}
      <directionalLight position={[0, 5, d + 5]} intensity={0.2} />
      
      {/* Hemisphere for ambient bounce */}
      <hemisphereLight args={['#c4d4e8', '#8b7355', 0.4]} />
      
      {/* Background color */}
      <color attach="background" args={['#f0eee8']} />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[w / 2, 0, d / 2]}
        opacity={0.4}
        scale={Math.max(w, d) * 1.5}
        blur={2}
        far={4}
      />

      <Room dimensions={roomDimensions} />

      {placedFurniture.map(item => (
        <FurnitureObject
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
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

// Snapshot helper component
function SnapshotHelper({ onSnapshot }: { onSnapshot: (gl: any) => void }) {
  const { gl } = useThree();
  
  // Expose gl via callback
  if (onSnapshot) {
    onSnapshot(gl);
  }
  
  return null;
}

export const PlannerCanvas3D = ({
  roomDimensions,
  placedFurniture,
  selectedId,
  onSelect,
}: PlannerCanvas3DProps) => {
  const glRef = useRef<any>(null);

  const handleSnapshot = useCallback(() => {
    if (!glRef.current) {
      toast.error('렌더러를 찾을 수 없습니다');
      return;
    }
    
    try {
      const canvas = glRef.current.domElement;
      
      // Force a render with preserveDrawingBuffer
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
        클릭: 제품정보 | 드래그: 회전/확대
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
          gl.toneMapping = 1; // ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Scene
          roomDimensions={roomDimensions}
          placedFurniture={placedFurniture}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </Canvas>
    </div>
  );
};
