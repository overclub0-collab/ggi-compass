import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Edges } from '@react-three/drei';
import { PlacedFurniture, RoomDimensions } from '@/types/planner';
import * as THREE from 'three';

interface PlannerCanvas3DProps {
  roomDimensions: RoomDimensions;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
}

// SketchUp-style matte palette
const WALL_COLOR = '#f0ede6';
const FLOOR_COLOR = '#e2dfd6';
const EDGE_COLOR = '#2a2a2a';
const SELECTED_EDGE = '#0066cc';

// Custom SketchUp-style matte material
function SketchMaterial({ color, opacity = 0.92 }: { color: string; opacity?: number }) {
  return (
    <meshLambertMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function FurnitureBox({ item, isSelected, onSelect }: {
  item: PlacedFurniture;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const w = item.furniture.width / 1000;
  const d = item.furniture.height / 1000;
  const h = (item.furniture.depth || 750) / 1000;

  const roomScale = 0.1;
  const posX = (item.x / roomScale) / 1000 + w / 2;
  const posZ = (item.y / roomScale) / 1000 + d / 2;

  const color = item.furniture.color || '#c8b89a';

  return (
    <group
      position={[posX, h / 2, posZ]}
      rotation={[0, -(item.rotation * Math.PI) / 180, 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <SketchMaterial color={color} opacity={0.88} />
        <Edges
          threshold={15}
          color={isSelected ? SELECTED_EDGE : EDGE_COLOR}
          lineWidth={isSelected ? 3 : 1.5}
        />
      </mesh>
      {/* Label on top */}
      <Text
        position={[0, h / 2 + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.13}
        color="#222"
        anchorX="center"
        anchorY="middle"
        maxWidth={w * 0.9}
        font={undefined}
      >
        {item.furniture.name}
      </Text>
    </group>
  );
}

function Room({ dimensions }: { dimensions: RoomDimensions }) {
  const w = dimensions.width / 1000;
  const d = dimensions.height / 1000;
  const wallH = 2.8;
  const wallThickness = 0.06;

  return (
    <group>
      {/* Floor - matte */}
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

      {/* Right wall (transparent ghost) */}
      <mesh position={[w, wallH / 2, d / 2]}>
        <boxGeometry args={[wallThickness, wallH, d]} />
        <meshLambertMaterial color={WALL_COLOR} transparent opacity={0.12} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.8} />
      </mesh>

      {/* Front wall (transparent ghost) */}
      <mesh position={[w / 2, wallH / 2, d]}>
        <boxGeometry args={[w, wallH, wallThickness]} />
        <meshLambertMaterial color={WALL_COLOR} transparent opacity={0.12} />
        <Edges threshold={15} color={EDGE_COLOR} lineWidth={0.8} />
      </mesh>

      {/* Grid on floor */}
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
        {(w).toFixed(1)}m
      </Text>
      <Text
        position={[-0.3, 0.02, d / 2]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.18}
        color="#555"
        anchorX="center"
      >
        {(d).toFixed(1)}m
      </Text>
    </group>
  );
}

function Scene({ roomDimensions, placedFurniture, selectedId, onSelect }: Omit<PlannerCanvas3DProps, 'scale'>) {
  const w = roomDimensions.width / 1000;
  const d = roomDimensions.height / 1000;

  return (
    <>
      {/* Soft ambient + directional for SketchUp feel */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[w + 2, 8, d + 2]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 5, -3]} intensity={0.2} />

      {/* Sky color */}
      <color attach="background" args={['#f5f3ee']} />

      <Room dimensions={roomDimensions} />

      {placedFurniture.map(item => (
        <FurnitureBox
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
    <div className="flex-1 bg-muted/30" onClick={() => onSelect(null)}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onClick={(e) => e.stopPropagation()}
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
