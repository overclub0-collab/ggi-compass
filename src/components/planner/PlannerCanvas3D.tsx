import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import { FurnitureObject } from './FurnitureModels';
import { Edges } from '@react-three/drei';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
}

const WALL_COLOR = '#f0ede6';
const FLOOR_COLOR = '#e2dfd6';
const EDGE_COLOR = '#2a2a2a';

function Room({ dimensions }: { dimensions: RoomDimensions }) {
  const w = dimensions.width / 1000;
  const d = dimensions.height / 1000;
  const wallH = 2.8;
  const wallThickness = 0.06;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color={FLOOR_COLOR} />
      </mesh>

      {/* Back wall */}
      <mesh position={[w / 2, wallH / 2, 0]} castShadow>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshLambertMaterial color={WALL_COLOR} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>

      {/* Left wall */}
      <mesh position={[0, wallH / 2, d / 2]} castShadow>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshLambertMaterial color={WALL_COLOR} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={1.5} />
      </mesh>

      {/* Right wall (ghost) */}
      <mesh position={[w, wallH / 2, d / 2]}>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshLambertMaterial color={WALL_COLOR} transparent opacity={0.12} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.8} />
      </mesh>

      {/* Front wall (ghost) */}
      <mesh position={[w / 2, wallH / 2, d]}>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshLambertMaterial color={WALL_COLOR} transparent opacity={0.12} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.8} />
      </mesh>

      {/* Grid */}
      <Grid
        position={[w / 2, 0.001, d / 2]}
        args={[w, d]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#bbb"
        sectionSize={1}
        sectionThickness={1.2}
        sectionColor="#888"
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
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[w + 3, 10, d + 3]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-4, 6, -2]} intensity={0.25} />
      <hemisphereLight args={['#b1c4de', '#8b7355', 0.3]} />
      <color attach="background" args={['#f0eee8']} />

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

export const PlannerCanvas3D = ({
  roomDimensions,
  placedFurniture,
  selectedId,
  onSelect,
}: PlannerCanvas3DProps) => {
  return (
    <div className="flex-1 bg-muted/30 relative" onContextMenu={(e) => e.preventDefault()}>
      {/* Tooltip hint */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-70">
        클릭: 제품정보 | 드래그: 회전/확대
      </div>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onContextMenu={(e) => e.preventDefault()}
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
