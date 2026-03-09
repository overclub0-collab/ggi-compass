import { useRef, useMemo } from 'react';
import { Edges, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types/planner';
import { ThreeEvent } from '@react-three/fiber';
import { getCachedAnalysis, FurnitureAnalysis } from '@/hooks/useFurnitureAnalysis';

const EDGE_COLOR = '#1a1a1a';
const SELECTED_EDGE = '#0066cc';

// ===== Procedural Texture Generators =====

function createWoodTexture(baseColor: string, scale = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  // Base fill
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 512, 512);
  
  // Wood grain lines
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * 512;
    const variation = (Math.random() - 0.5) * 30;
    const darker = c.clone().multiplyScalar(0.85 + Math.random() * 0.1);
    ctx.strokeStyle = `rgba(${Math.round(darker.r*255)},${Math.round(darker.g*255)},${Math.round(darker.b*255)},${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 * scale) * (3 + variation * 0.3) + (Math.random() - 0.5) * 2);
    }
    ctx.stroke();
  }
  
  // Knots (occasional)
  for (let i = 0; i < 2; i++) {
    const kx = Math.random() * 512;
    const ky = Math.random() * 512;
    const kr = 5 + Math.random() * 12;
    const kColor = c.clone().multiplyScalar(0.7);
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(kColor.r*255)},${Math.round(kColor.g*255)},${Math.round(kColor.b*255)},0.3)`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}

function createMetalTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 256, 256);
  
  // Brushed metal streaks
  for (let i = 0; i < 200; i++) {
    const y = Math.random() * 256;
    const lighter = c.clone().lerp(new THREE.Color('#ffffff'), 0.1 + Math.random() * 0.15);
    ctx.strokeStyle = `rgba(${Math.round(lighter.r*255)},${Math.round(lighter.g*255)},${Math.round(lighter.b*255)},${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.3 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + (Math.random() - 0.5) * 3);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFabricTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 256, 256);
  
  // Weave pattern
  for (let x = 0; x < 256; x += 3) {
    for (let y = 0; y < 256; y += 3) {
      const bright = ((x + y) % 6 < 3) ? 0.97 : 1.03;
      const wc = c.clone().multiplyScalar(bright);
      ctx.fillStyle = `rgba(${Math.round(wc.r*255)},${Math.round(wc.g*255)},${Math.round(wc.b*255)},0.4)`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createWoodNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Neutral normal (128,128,255)
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, 512, 512);
  
  // Grain bumps
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * 512;
    ctx.strokeStyle = `rgba(${120 + Math.random()*16},${125 + Math.random()*8},255,0.3)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 15) {
      ctx.lineTo(x, y + Math.sin(x * 0.03) * 3);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ===== PBR Material helpers with procedural textures =====
function woodMat(color: string, isSelected = false) {
  const map = useMemo(() => createWoodTexture(color), [color]);
  const normalMap = useMemo(() => createWoodNormalMap(), []);
  
  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(0.3, 0.3)}
      color={color}
      roughness={0.72}
      metalness={0.02}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={0.6}
    />
  );
}

function metalMat(color: string, isSelected = false) {
  const map = useMemo(() => createMetalTexture(color), [color]);
  
  return (
    <meshStandardMaterial
      map={map}
      color={color}
      roughness={0.28}
      metalness={0.9}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={1.2}
    />
  );
}

function plasticMat(color: string, isSelected = false) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.5}
      metalness={0.04}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={0.4}
    />
  );
}

function fabricMat(color: string, isSelected = false) {
  const map = useMemo(() => createFabricTexture(color), [color]);
  
  return (
    <meshStandardMaterial
      map={map}
      color={color}
      roughness={0.92}
      metalness={0.0}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.12 : 0}
      envMapIntensity={0.2}
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

// ========== Desk / Table — Detailed with drawer panel, crossbars ==========
function DeskModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const topH = 0.032;
  const legW = 0.04;
  const legD = 0.04;
  const legH = h - topH;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const apronH = 0.06;
  const apronThick = 0.02;

  return (
    <group>
      {/* Tabletop — rounded edges */}
      <RoundedBox args={[w, topH, d]} radius={0.008} smoothness={4} position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        {woodMat(color, isSelected)}
      </RoundedBox>
      {/* Edge banding */}
      <mesh position={[0, h - topH, 0]} castShadow>
        <boxGeometry args={[w + 0.002, 0.003, d + 0.002]} />
        {woodMat(darken(color, 0.08), isSelected)}
      </mesh>

      {/* 4 Legs */}
      {[
        [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <boxGeometry args={[legW, legH, legD]} />
          {metalMat(darken(color, 0.45), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
        </mesh>
      ))}

      {/* Front apron */}
      <mesh position={[0, h - topH - apronH / 2 - 0.002, d / 2 - apronThick / 2 - 0.01]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, apronH, apronThick]} />
        {woodMat(darken(color, 0.05), isSelected)}
      </mesh>
      {/* Back apron */}
      <mesh position={[0, h - topH - apronH / 2 - 0.002, -(d / 2 - apronThick / 2 - 0.01)]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, apronH, apronThick]} />
        {woodMat(darken(color, 0.05), isSelected)}
      </mesh>

      {/* Crossbar stretcher */}
      <mesh position={[0, legH * 0.12, 0]} castShadow>
        <boxGeometry args={[w * 0.6, 0.018, 0.018]} />
        {metalMat(darken(color, 0.5), isSelected)}
      </mesh>

      {/* Foot caps */}
      {[
        [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
      ].map(([lx, , lz], i) => (
        <mesh key={`cap-${i}`} position={[lx, 0.005, lz]}>
          <cylinderGeometry args={[0.015, 0.018, 0.01, 8]} />
          <meshStandardMaterial color="#333" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ========== Chair — star base, gas lift, armrests ==========
function ChairModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const seatH = 0.05;
  const seatY = h * 0.5;
  const legH = seatY - seatH / 2;
  const backH = h - seatY - seatH / 2;
  const backThick = 0.025;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;

  return (
    <group>
      {/* Seat — rounded */}
      <RoundedBox args={[w * 0.92, seatH, d * 0.85]} radius={0.012} smoothness={4} position={[0, seatY, d * 0.04]} castShadow receiveShadow>
        {fabricMat(color, isSelected)}
      </RoundedBox>
      {/* Seat cushion highlight */}
      <RoundedBox args={[w * 0.84, 0.006, d * 0.76]} radius={0.003} smoothness={2} position={[0, seatY + seatH / 2 + 0.003, d * 0.04]}>
        {fabricMat(lighten(color, 0.08), isSelected)}
      </RoundedBox>

      {/* Backrest */}
      <RoundedBox args={[w * 0.85, backH * 0.8, backThick]} radius={0.008} smoothness={4} position={[0, seatY + backH * 0.5, -(d / 2 - backThick / 2)]} castShadow>
        {fabricMat(lighten(color, 0.04), isSelected)}
      </RoundedBox>
      {/* Backrest top rail */}
      <mesh position={[0, seatY + backH * 0.92, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.9, 0.028, backThick + 0.008]} />
        {plasticMat(darken(color, 0.2), isSelected)}
      </mesh>
      {/* Lumbar support */}
      <mesh position={[0, seatY + backH * 0.25, -(d / 2 - backThick - 0.005)]}>
        <boxGeometry args={[w * 0.5, 0.06, 0.015]} />
        {plasticMat(darken(color, 0.15), isSelected)}
      </mesh>

      {/* Gas lift */}
      <mesh position={[0, seatY / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, legH * 0.6, 12]} />
        {metalMat('#444', isSelected)}
      </mesh>
      <mesh position={[0, seatY - seatH / 2 - 0.01, 0]}>
        <cylinderGeometry args={[0.04, 0.025, 0.06, 12]} />
        {plasticMat('#333', isSelected)}
      </mesh>

      {/* Star base - 5 legs */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        const length = Math.max(w, d) * 0.42;
        const lx = Math.sin(angle) * length / 2;
        const lz = Math.cos(angle) * length / 2;
        return (
          <group key={i}>
            <mesh position={[lx, 0.02, lz]} rotation={[0, -angle, 0]} castShadow>
              <boxGeometry args={[0.025, 0.02, length]} />
              {metalMat('#555', isSelected)}
            </mesh>
            <mesh position={[Math.sin(angle) * length, 0.012, Math.cos(angle) * length]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#222" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        );
      })}
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
  const panelThick = 0.018;

  return (
    <group>
      {/* Outer shell */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {metalMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, h + 0.003, 0]}>
        <boxGeometry args={[w + 0.004, 0.006, d + 0.004]} />
        {metalMat(darken(color, 0.1), isSelected)}
      </mesh>

      {/* Internal horizontal dividers */}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = (h / rows) * (i + 1);
        return (
          <mesh key={`h${i}`} position={[0, y, 0]}>
            <boxGeometry args={[w - panelThick * 2, panelThick * 0.6, d - panelThick]} />
            {metalMat(darken(color, 0.15), isSelected)}
          </mesh>
        );
      })}

      {/* Internal vertical dividers */}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = -(w / 2) + (w / cols) * (i + 1);
        return (
          <mesh key={`v${i}`} position={[x, h / 2, 0]}>
            <boxGeometry args={[panelThick * 0.6, h - panelThick * 2, d - panelThick]} />
            {metalMat(darken(color, 0.15), isSelected)}
          </mesh>
        );
      })}

      {/* Front face lines */}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = (h / rows) * (i + 1);
        return (
          <mesh key={`fh${i}`} position={[0, y, d / 2 + 0.002]}>
            <boxGeometry args={[w * 0.98, 0.005, 0.001]} />
            <meshStandardMaterial color={darken(color, 0.35)} roughness={0.4} metalness={0.7} />
          </mesh>
        );
      })}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = -(w / 2) + (w / cols) * (i + 1);
        return (
          <mesh key={`fv${i}`} position={[x, h / 2, d / 2 + 0.002]}>
            <boxGeometry args={[0.005, h * 0.98, 0.001]} />
            <meshStandardMaterial color={darken(color, 0.35)} roughness={0.4} metalness={0.7} />
          </mesh>
        );
      })}

      {/* Door handles per cell */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cellW = w / cols;
          const cellH = h / rows;
          const cx = -(w / 2) + cellW * c + cellW / 2;
          const cy = cellH * r + cellH / 2;
          return (
            <group key={`handle-${r}-${c}`}>
              <mesh position={[cx + cellW * 0.32, cy, d / 2 + 0.012]}>
                <boxGeometry args={[0.012, 0.045, 0.01]} />
                <meshStandardMaterial color="#666" roughness={0.2} metalness={0.95} envMapIntensity={1.5} />
              </mesh>
              <mesh position={[cx + cellW * 0.32, cy + 0.025, d / 2 + 0.007]}>
                <boxGeometry args={[0.016, 0.005, 0.006]} />
                <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
              </mesh>
              <mesh position={[cx + cellW * 0.32, cy - 0.025, d / 2 + 0.007]}>
                <boxGeometry args={[0.016, 0.005, 0.006]} />
                <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Vent slots */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh key={`vent-${i}`} position={[-(w * 0.2) + i * w * 0.2, h - 0.02, d / 2 + 0.002]}>
          <boxGeometry args={[w * 0.08, 0.004, 0.001]} />
          <meshStandardMaterial color={darken(color, 0.5)} roughness={0.5} metalness={0.7} />
        </mesh>
      ))}

      {/* Base feet */}
      {[
        [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
      ].map(([fx, , fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, 0.006, fz]}>
          <cylinderGeometry args={[0.012, 0.015, 0.012, 8]} />
          <meshStandardMaterial color="#333" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
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
      {/* Base cabinet */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabinetH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Cabinet door line */}
      <mesh position={[0, cabinetH / 2, d / 2 + 0.001]}>
        <boxGeometry args={[0.004, cabinetH * 0.88, 0.001]} />
        <meshStandardMaterial color={darken(color, 0.3)} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Cabinet handles */}
      {[-0.04, 0.04].map((xOff, i) => (
        <group key={i}>
          <mesh position={[xOff, cabinetH / 2, d / 2 + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.05, 8]} />
            <meshStandardMaterial color="#888" roughness={0.2} metalness={0.95} envMapIntensity={1.5} />
          </mesh>
          <mesh position={[xOff, cabinetH / 2 + 0.025, d / 2 + 0.008]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshStandardMaterial color="#777" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh position={[xOff, cabinetH / 2 - 0.025, d / 2 + 0.008]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshStandardMaterial color="#777" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Whiteboard surface */}
      <mesh position={[0, cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]} castShadow>
        <boxGeometry args={[w - frameThick * 2, boardH - frameThick, boardThick]} />
        <meshStandardMaterial color="#f5f3ee" roughness={0.15} metalness={0.08} envMapIntensity={0.8} />
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Frame — top */}
      <mesh position={[0, cabinetH + boardH, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[w + 0.02, frameThick, boardThick + 0.012]} />
        {woodMat(darken(color, 0.15), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Frame — left */}
      <mesh position={[-(w / 2), cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[frameThick, boardH, boardThick + 0.012]} />
        {woodMat(darken(color, 0.15), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Frame — right */}
      <mesh position={[(w / 2), cabinetH + boardH / 2, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[frameThick, boardH, boardThick + 0.012]} />
        {woodMat(darken(color, 0.15), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Frame — bottom */}
      <mesh position={[0, cabinetH + frameThick / 2, -(d / 2 - boardThick / 2)]}>
        <boxGeometry args={[w + 0.02, frameThick, boardThick + 0.012]} />
        {woodMat(darken(color, 0.15), isSelected)}
      </mesh>
      {/* Chalk/marker tray */}
      <mesh position={[0, cabinetH + 0.015, -(d / 2 - 0.04)]}>
        <boxGeometry args={[w * 0.88, 0.018, 0.065]} />
        {woodMat(darken(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
      </mesh>
      <mesh position={[0, cabinetH + 0.03, -(d / 2 - 0.072)]}>
        <boxGeometry args={[w * 0.88, 0.012, 0.005]} />
        {woodMat(darken(color, 0.12), isSelected)}
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
  const seatH = h * 0.4;
  const backH = h * 0.6;
  const armW = w * 0.08;
  const cushionCount = Math.max(2, Math.round(w / 0.7));
  const cushionW = (w - armW * 2 - 0.04) / cushionCount;

  return (
    <group>
      {/* Base frame */}
      <RoundedBox args={[w, seatH, d]} radius={0.015} smoothness={4} position={[0, seatH / 2, 0]} castShadow receiveShadow>
        {fabricMat(darken(color, 0.06), isSelected)}
      </RoundedBox>
      {/* Seat cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`cushion-${i}`} args={[cushionW - 0.01, 0.07, d * 0.72]} radius={0.015} smoothness={4} position={[cx, seatH + 0.035, d * 0.04]} castShadow>
            {fabricMat(lighten(color, 0.05), isSelected)}
          </RoundedBox>
        );
      })}
      {/* Back cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`back-${i}`} args={[cushionW - 0.015, backH * 0.6, 0.18]} radius={0.02} smoothness={4} position={[cx, seatH + backH * 0.42, -(d / 2 - 0.1)]} castShadow>
            {fabricMat(lighten(color, 0.08), isSelected)}
          </RoundedBox>
        );
      })}
      {/* Arms */}
      {[-(w / 2 - armW / 2), (w / 2 - armW / 2)].map((x, i) => (
        <group key={`arm-${i}`}>
          <mesh position={[x, seatH + backH * 0.28, 0]} castShadow>
            <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
            {fabricMat(darken(color, 0.04), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
          <mesh position={[x, seatH + backH * 0.58, 0]}>
            <boxGeometry args={[armW + 0.01, 0.02, d * 0.86]} />
            {fabricMat(lighten(color, 0.03), isSelected)}
          </mesh>
        </group>
      ))}
      {/* Feet */}
      {[
        [-(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [-(w / 2 - 0.06), 0, (d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, (d / 2 - 0.06)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.018, lz]} castShadow>
          <cylinderGeometry args={[0.01, 0.016, 0.035, 8]} />
          {metalMat('#2a2a2a', isSelected)}
        </mesh>
      ))}
    </group>
  );
}

// ========== Shelf — Open shelving with back panel ==========
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
      {/* Side panels */}
      {[-(w / 2 - sideThick / 2), (w / 2 - sideThick / 2)].map((x, i) => (
        <mesh key={`side-${i}`} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[sideThick, h, d]} />
          {woodMat(darken(color, 0.1), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
        </mesh>
      ))}
      {/* Back panel */}
      <mesh position={[0, h / 2, -(d / 2 - 0.005)]} castShadow>
        <boxGeometry args={[w - sideThick * 2, h, 0.008]} />
        {woodMat(lighten(color, 0.05), isSelected)}
      </mesh>
      {/* Shelves */}
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
      {/* Shelf pins */}
      {Array.from({ length: shelfCount + 1 }, (_, i) => {
        const y = (h / shelfCount) * i;
        return [
          <mesh key={`lpin-${i}`} position={[-(w / 2 - sideThick - 0.003), y + shelfThick / 2, d / 4]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.8} />
          </mesh>,
          <mesh key={`rpin-${i}`} position={[(w / 2 - sideThick - 0.003), y + shelfThick / 2, d / 4]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshStandardMaterial color="#999" roughness={0.3} metalness={0.8} />
          </mesh>
        ];
      })}
    </group>
  );
}

// ========== Lab Bench — chemical-resistant top, plumbing detail ==========
function LabBenchModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const topH = 0.04;
  const legW = 0.05;
  const legD = 0.05;
  const legH = h - topH;

  return (
    <group>
      {/* Chemical-resistant tabletop (dark, thick) */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.15}
          emissive={isSelected ? '#001133' : '#000000'} emissiveIntensity={isSelected ? 0.15 : 0} />
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Front edge highlight */}
      <mesh position={[0, h - topH, d / 2 - 0.003]}>
        <boxGeometry args={[w, 0.005, 0.006]} />
        <meshStandardMaterial color="#444" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Steel frame legs (C-frame) */}
      {[-1, 1].map((side) => {
        const xOff = side * (w / 2 - legW / 2 - 0.02);
        return (
          <group key={`frame-${side}`}>
            {/* Vertical legs */}
            <mesh position={[xOff, legH / 2, -(d / 2 - legD / 2 - 0.01)]} castShadow>
              <boxGeometry args={[legW, legH, legD]} />
              {metalMat('#666', isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
            <mesh position={[xOff, legH / 2, (d / 2 - legD / 2 - 0.01)]} castShadow>
              <boxGeometry args={[legW, legH, legD]} />
              {metalMat('#666', isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
            {/* Horizontal brace */}
            <mesh position={[xOff, legH * 0.15, 0]}>
              <boxGeometry args={[legW * 0.8, 0.02, d - legD * 2 - 0.04]} />
              {metalMat('#555', isSelected)}
            </mesh>
          </group>
        );
      })}

      {/* Sink basin cutout (decorative) */}
      <mesh position={[w * 0.3, h - topH + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.1, 16]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Faucet */}
      <mesh position={[w * 0.3, h + 0.06, -d * 0.25]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
        {metalMat('#aaa', isSelected)}
      </mesh>
      <mesh position={[w * 0.3, h + 0.12, -d * 0.18]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.008, 0.12, 8]} />
        {metalMat('#aaa', isSelected)}
      </mesh>

      {/* Gas valve */}
      <mesh position={[-w * 0.35, h + 0.02, -d * 0.3]}>
        <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
        <meshStandardMaterial color="#ccaa00" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Adjustable feet */}
      {[
        [-(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [-(w / 2 - 0.04), 0, (d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, (d / 2 - 0.04)],
      ].map(([fx, , fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, 0.008, fz]}>
          <cylinderGeometry args={[0.018, 0.022, 0.016, 8]} />
          <meshStandardMaterial color="#444" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ========== Dining Table — large communal table with bench-style base ==========
function DiningTableModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const topH = 0.035;
  const legH = h - topH;

  return (
    <group>
      {/* Thick tabletop with rounded look */}
      <RoundedBox args={[w, topH, d]} radius={0.01} smoothness={4} position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        {woodMat(color, isSelected)}
      </RoundedBox>
      {/* Edge rounding strip */}
      <mesh position={[0, h - topH - 0.002, 0]}>
        <boxGeometry args={[w - 0.01, 0.004, d - 0.01]} />
        {woodMat(darken(color, 0.06), isSelected)}
      </mesh>

      {/* Trestle-style legs (2 A-frames) */}
      {[-1, 1].map((side) => {
        const xOff = side * (w / 2 - w * 0.15);
        return (
          <group key={`trestle-${side}`}>
            {/* Central post */}
            <mesh position={[xOff, legH / 2, 0]} castShadow>
              <boxGeometry args={[0.06, legH, 0.06]} />
              {metalMat('#555', isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
            {/* Base bar */}
            <mesh position={[xOff, 0.015, 0]}>
              <boxGeometry args={[0.04, 0.03, d * 0.7]} />
              {metalMat('#444', isSelected)}
            </mesh>
            {/* Foot pads */}
            {[-1, 1].map((z) => (
              <mesh key={`pad-${z}`} position={[xOff, 0.004, z * d * 0.35]}>
                <cylinderGeometry args={[0.025, 0.03, 0.008, 8]} />
                <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Center stretcher */}
      <mesh position={[0, legH * 0.1, 0]}>
        <boxGeometry args={[w - w * 0.3, 0.025, 0.025]} />
        {metalMat('#555', isSelected)}
      </mesh>
    </group>
  );
}

// ========== Pet Furniture — kennel/house style ==========
function PetFurnitureModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const wallThick = 0.02;
  const roofH = h * 0.25;
  const bodyH = h - roofH;
  const doorW = w * 0.4;
  const doorH = bodyH * 0.7;

  return (
    <group>
      {/* Body walls */}
      {/* Back */}
      <mesh position={[0, bodyH / 2, -(d / 2 - wallThick / 2)]} castShadow>
        <boxGeometry args={[w, bodyH, wallThick]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Left */}
      <mesh position={[-(w / 2 - wallThick / 2), bodyH / 2, 0]} castShadow>
        <boxGeometry args={[wallThick, bodyH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Right */}
      <mesh position={[(w / 2 - wallThick / 2), bodyH / 2, 0]} castShadow>
        <boxGeometry args={[wallThick, bodyH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Front - left of door */}
      <mesh position={[-(w / 2 - wallThick / 2) + (w - doorW) / 4, bodyH / 2, d / 2 - wallThick / 2]} castShadow>
        <boxGeometry args={[(w - doorW) / 2 - wallThick, bodyH, wallThick]} />
        {woodMat(color, isSelected)}
      </mesh>
      {/* Front - right of door */}
      <mesh position={[(w / 2 - wallThick / 2) - (w - doorW) / 4, bodyH / 2, d / 2 - wallThick / 2]} castShadow>
        <boxGeometry args={[(w - doorW) / 2 - wallThick, bodyH, wallThick]} />
        {woodMat(color, isSelected)}
      </mesh>
      {/* Front - above door */}
      <mesh position={[0, bodyH - (bodyH - doorH) / 4, d / 2 - wallThick / 2]} castShadow>
        <boxGeometry args={[doorW, (bodyH - doorH) / 2, wallThick]} />
        {woodMat(color, isSelected)}
      </mesh>
      {/* Door arch (semi-circle approximation) */}
      <mesh position={[0, doorH * 0.95, d / 2 - wallThick / 2 + 0.002]}>
        <ringGeometry args={[0, doorW / 2 - 0.005, 16, 1, 0, Math.PI]} />
        <meshStandardMaterial color={darken(color, 0.2)} roughness={0.7} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, wallThick / 2, 0]} receiveShadow>
        <boxGeometry args={[w, wallThick, d]} />
        {woodMat(darken(color, 0.1), isSelected)}
      </mesh>

      {/* Roof - angled (two panels) */}
      <mesh position={[-(w / 4), bodyH + roofH * 0.4, 0]} rotation={[0, 0, Math.PI * 0.12]} castShadow>
        <boxGeometry args={[w * 0.55, 0.015, d + 0.04]} />
        {woodMat(darken(color, 0.2), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      <mesh position={[(w / 4), bodyH + roofH * 0.4, 0]} rotation={[0, 0, -Math.PI * 0.12]} castShadow>
        <boxGeometry args={[w * 0.55, 0.015, d + 0.04]} />
        {woodMat(darken(color, 0.2), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Ridge beam */}
      <mesh position={[0, bodyH + roofH * 0.55, 0]}>
        <boxGeometry args={[0.03, 0.02, d + 0.06]} />
        {woodMat(darken(color, 0.3), isSelected)}
      </mesh>

      {/* Interior cushion */}
      <mesh position={[0, wallThick + 0.015, 0]}>
        <boxGeometry args={[w * 0.85, 0.03, d * 0.85]} />
        {fabricMat('#e8d5c4', isSelected)}
      </mesh>
    </group>
  );
}

// ========== Military Bunk Bed ==========
function BunkBedModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const frameW = 0.04;
  const mattressH = 0.08;
  const lowerY = h * 0.22;
  const upperY = h * 0.62;

  return (
    <group>
      {/* 4 corner posts */}
      {[
        [-(w / 2 - frameW / 2), 0, -(d / 2 - frameW / 2)],
        [(w / 2 - frameW / 2), 0, -(d / 2 - frameW / 2)],
        [-(w / 2 - frameW / 2), 0, (d / 2 - frameW / 2)],
        [(w / 2 - frameW / 2), 0, (d / 2 - frameW / 2)],
      ].map(([px, , pz], i) => (
        <mesh key={`post-${i}`} position={[px, h / 2, pz]} castShadow>
          <boxGeometry args={[frameW, h, frameW]} />
          {metalMat(darken(color, 0.4), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
        </mesh>
      ))}

      {/* Lower bed frame */}
      <mesh position={[0, lowerY, 0]}>
        <boxGeometry args={[w - frameW * 2, 0.02, d - frameW * 2]} />
        {metalMat('#666', isSelected)}
      </mesh>
      {/* Lower mattress */}
      <mesh position={[0, lowerY + mattressH / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[w - frameW * 2 - 0.02, mattressH, d - frameW * 2 - 0.02]} />
        {fabricMat('#e8e0d0', isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.5} />
      </mesh>

      {/* Upper bed frame */}
      <mesh position={[0, upperY, 0]}>
        <boxGeometry args={[w - frameW * 2, 0.02, d - frameW * 2]} />
        {metalMat('#666', isSelected)}
      </mesh>
      {/* Upper mattress */}
      <mesh position={[0, upperY + mattressH / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[w - frameW * 2 - 0.02, mattressH, d - frameW * 2 - 0.02]} />
        {fabricMat('#e8e0d0', isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.5} />
      </mesh>

      {/* Guard rail upper */}
      <mesh position={[0, upperY + mattressH + 0.08, d / 2 - frameW / 2]}>
        <boxGeometry args={[w - frameW * 2, 0.025, 0.015]} />
        {metalMat('#777', isSelected)}
      </mesh>

      {/* Ladder */}
      <mesh position={[w / 2 - frameW - 0.02, (lowerY + upperY) / 2, d / 2 - frameW / 2 + 0.02]}>
        <boxGeometry args={[0.015, upperY - lowerY + 0.1, 0.015]} />
        {metalMat('#888', isSelected)}
      </mesh>
      {/* Ladder rungs */}
      {[0.25, 0.5, 0.75].map((ratio, i) => (
        <mesh key={`rung-${i}`} position={[w / 2 - frameW - 0.02, lowerY + (upperY - lowerY) * ratio, d / 2 - frameW / 2 + 0.04]}>
          <boxGeometry args={[0.12, 0.012, 0.015]} />
          {metalMat('#888', isSelected)}
        </mesh>
      ))}
    </group>
  );
}

// ========== Generic fallback ==========
function GenericModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.01} smoothness={4} position={[0, h / 2, 0]} castShadow receiveShadow>
        {woodMat(color, isSelected)}
      </RoundedBox>
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[w + 0.01, 0.01, d + 0.01]} />
        {metalMat(darken(color, 0.3), isSelected)}
      </mesh>
    </group>
  );
}

// ========== Round Table — circular top with center pedestal ==========
function RoundTableModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const topH = 0.03;
  const radius = Math.min(w, d) / 2;
  const legH = h - topH;

  return (
    <group>
      {/* Round tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, topH, 32]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Edge banding */}
      <mesh position={[0, h - topH, 0]}>
        <cylinderGeometry args={[radius + 0.003, radius + 0.003, 0.004, 32]} />
        {woodMat(darken(color, 0.08), isSelected)}
      </mesh>
      {/* Center pedestal */}
      <mesh position={[0, legH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, legH, 12]} />
        {metalMat(darken(color, 0.45), isSelected)}
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[radius * 0.5, radius * 0.55, 0.02, 16]} />
        {metalMat(darken(color, 0.5), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
      </mesh>
      {/* 4 radial feet */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i * Math.PI * 2) / 4 + Math.PI / 4;
        const footR = radius * 0.45;
        return (
          <mesh key={i} position={[Math.cos(angle) * footR, 0.008, Math.sin(angle) * footR]}>
            <cylinderGeometry args={[0.015, 0.02, 0.016, 8]} />
            <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== Category detection — expanded for all product types ==========
function detectFurnitureType(item: PlacedFurniture): string {
  const name = (item.furniture.name || '').toLowerCase();
  const cat = (item.furniture.category || '').toLowerCase();

  // Round table detection
  if (name.includes('원형') || name.includes('라운드') || name.includes('둥근') || name.includes('원탁') || name.includes('round')) return 'roundtable';

  // Blackboard / whiteboard cabinet
  if (name.includes('칠판') || name.includes('보조장') || name.includes('blackboard') || name.includes('화이트보드')) return 'blackboard';
  
  // Bunk bed / military bed
  if (name.includes('침대') || name.includes('이층') || name.includes('bunk') || name.includes('bed') || name.includes('군용침대')) return 'bunkbed';
  
  // Pet furniture
  if (name.includes('반려') || name.includes('펫') || name.includes('pet') || name.includes('강아지') || name.includes('고양이') || name.includes('하우스') || cat.includes('반려') || cat.includes('pet')) return 'pet';
  
  // Lab bench
  if (name.includes('실험') || name.includes('lab') || name.includes('과학') || name.includes('약품') || cat.includes('lab')) return 'lab';
  
  // Dining table
  if (name.includes('식탁') || name.includes('급식') || name.includes('dining') || name.includes('구내식당') || cat.includes('dining') || cat.includes('식당')) return 'dining';
  
  // Chair
  if (name.includes('의자') || name.includes('chair') || name.includes('스툴') || name.includes('좌석') || cat.includes('chair')) return 'chair';
  
  // Sofa
  if (name.includes('소파') || name.includes('sofa') || name.includes('카우치') || cat.includes('sofa')) return 'sofa';
  
  // Storage / locker
  if (name.includes('사물함') || name.includes('수납') || name.includes('서랍') || name.includes('캐비닛') || name.includes('locker') || name.includes('신발장') || name.includes('옷장') || name.includes('보관') || cat.includes('storage')) return 'storage';
  
  // Shelf / bookcase
  if (name.includes('선반') || name.includes('책장') || name.includes('shelf') || name.includes('진열') || cat.includes('shelf')) return 'shelf';
  
  // Desk / table (broad category — last)
  if (name.includes('책상') || name.includes('탁자') || name.includes('테이블') || name.includes('강연대') || name.includes('교탁') || name.includes('desk') || name.includes('table') || name.includes('작업대') || name.includes('워크') || cat.includes('desk') || cat.includes('table')) return 'desk';

  return 'generic';
}

// ========== AI-enhanced model selection ==========
function getModelFromAnalysis(analysis: FurnitureAnalysis): string {
  return analysis.furnitureType || 'generic';
}

function getColorsFromAnalysis(analysis: FurnitureAnalysis, fallbackColor: string) {
  return {
    primary: analysis.primaryColor || fallbackColor,
    secondary: analysis.secondaryColor || darken(fallbackColor, 0.3),
    accent: analysis.accentColor || darken(fallbackColor, 0.15),
  };
}

// ========== AI-enhanced Desk with analysis params ==========
function AIEnhancedDesk({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const topH = Math.max(0.015, h * (analysis.topThickness || 0.04));
  const legW = Math.max(0.02, w * (analysis.legThickness || 0.04));
  const legD = legW;
  const legH = h - topH;
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const hasDrawers = analysis.hasDrawer || false;
  const drawerCount = analysis.drawerCount || 0;
  const details = analysis.details || [];
  const hasCrossbar = details.includes('crossbar') || details.includes('stretcher');
  const hasRoundedEdges = details.includes('rounded-edges');
  const isTFrame = analysis.legStyle === 'T-frame';
  const isPanel = analysis.legStyle === 'panel';
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat : woodMat;
  const legMatFn = analysis.secondaryMaterial === 'wood' ? woodMat : metalMat;

  return (
    <group>
      {/* Tabletop */}
      {hasRoundedEdges ? (
        <RoundedBox args={[w, topH, d]} radius={0.01} smoothness={4} position={[0, h - topH / 2, 0]} castShadow receiveShadow>
          {primaryMatFn(colors.primary, isSelected)}
        </RoundedBox>
      ) : (
        <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, topH, d]} />
          {primaryMatFn(colors.primary, isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
        </mesh>
      )}
      {/* Edge banding */}
      <mesh position={[0, h - topH, 0]}>
        <boxGeometry args={[w + 0.002, 0.003, d + 0.002]} />
        {primaryMatFn(darken(colors.primary, 0.08), isSelected)}
      </mesh>

      {/* Legs based on style */}
      {isTFrame ? (
        // T-frame legs
        <>
          {[-1, 1].map((side) => {
            const xOff = side * (w / 2 - 0.06);
            return (
              <group key={`tleg-${side}`}>
                <mesh position={[xOff, legH / 2, 0]} castShadow>
                  <boxGeometry args={[legW, legH, legW]} />
                  {legMatFn(colors.secondary, isSelected)}
                </mesh>
                <mesh position={[xOff, 0.015, 0]}>
                  <boxGeometry args={[legW, 0.03, d * 0.7]} />
                  {legMatFn(colors.secondary, isSelected)}
                </mesh>
              </group>
            );
          })}
        </>
      ) : isPanel ? (
        // Panel legs
        <>
          {[-1, 1].map((side) => (
            <mesh key={`panel-${side}`} position={[side * (w / 2 - 0.015), legH / 2, 0]} castShadow>
              <boxGeometry args={[0.03, legH, d * 0.85]} />
              {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
          ))}
        </>
      ) : (
        // Standard 4 legs
        <>
          {[
            [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
          ].map(([lx, , lz], i) => (
            <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
              <boxGeometry args={[legW, legH, legD]} />
              {legMatFn(colors.secondary, isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
          ))}
        </>
      )}

      {/* Front/back aprons */}
      <mesh position={[0, h - topH - 0.032, d / 2 - 0.01]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, 0.06, 0.02]} />
        {primaryMatFn(darken(colors.primary, 0.05), isSelected)}
      </mesh>
      <mesh position={[0, h - topH - 0.032, -(d / 2 - 0.01)]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, 0.06, 0.02]} />
        {primaryMatFn(darken(colors.primary, 0.05), isSelected)}
      </mesh>

      {/* Crossbar if detected */}
      {hasCrossbar && (
        <mesh position={[0, legH * 0.12, 0]}>
          <boxGeometry args={[w * 0.6, 0.018, 0.018]} />
          {legMatFn(colors.secondary, isSelected)}
        </mesh>
      )}

      {/* Drawers if detected */}
      {hasDrawers && Array.from({ length: Math.min(drawerCount || 1, 3) }, (_, i) => {
        const drawerH = Math.min(0.08, (legH - 0.06) / (drawerCount || 1));
        const yOff = h - topH - 0.07 - i * (drawerH + 0.01);
        return (
          <group key={`drawer-${i}`}>
            <mesh position={[w * 0.25, yOff, d / 2 - 0.005]}>
              <boxGeometry args={[w * 0.45, drawerH, 0.01]} />
              {primaryMatFn(darken(colors.primary, 0.03), isSelected)}
            </mesh>
            <mesh position={[w * 0.25, yOff, d / 2 + 0.008]}>
              <boxGeometry args={[0.04, 0.01, 0.01]} />
              <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Foot caps */}
      {!isPanel && [
        [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
        [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
        [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
      ].map(([lx, , lz], i) => (
        <mesh key={`cap-${i}`} position={[lx, 0.005, lz]}>
          <cylinderGeometry args={[0.015, 0.018, 0.01, 8]} />
          <meshStandardMaterial color="#333" roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ========== AI-enhanced Chair ==========
function AIEnhancedChair({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const seatH = 0.05;
  const seatRatio = analysis.proportions?.seatHeightRatio || 0.5;
  const seatY = h * seatRatio;
  const backH = h - seatY - seatH / 2;
  const hasArms = analysis.hasArmrest ?? false;
  const hasCushion = analysis.hasCushion ?? true;
  const isStar = analysis.legStyle === 'star-base';
  const is4Legs = analysis.legStyle === '4-legs';
  const seatMat = analysis.primaryMaterial === 'leather' || analysis.primaryMaterial === 'fabric' ? fabricMat : plasticMat;

  return (
    <group>
      {/* Seat */}
      <RoundedBox args={[w * 0.92, seatH, d * 0.85]} radius={0.012} smoothness={4} position={[0, seatY, d * 0.04]} castShadow receiveShadow>
        {seatMat(colors.primary, isSelected)}
      </RoundedBox>
      {hasCushion && (
        <RoundedBox args={[w * 0.84, 0.006, d * 0.76]} radius={0.003} smoothness={2} position={[0, seatY + seatH / 2 + 0.003, d * 0.04]}>
          {seatMat(lighten(colors.primary, 0.08), isSelected)}
        </RoundedBox>
      )}

      {/* Backrest */}
      {analysis.hasBackrest !== false && (
        <>
          <RoundedBox args={[w * 0.85, backH * 0.8, 0.025]} radius={0.008} smoothness={4} position={[0, seatY + backH * 0.5, -(d / 2 - 0.013)]} castShadow>
            {seatMat(lighten(colors.primary, 0.04), isSelected)}
          </RoundedBox>
          <mesh position={[0, seatY + backH * 0.92, -(d / 2 - 0.013)]} castShadow>
            <boxGeometry args={[w * 0.9, 0.028, 0.033]} />
            {plasticMat(colors.secondary, isSelected)}
          </mesh>
        </>
      )}

      {/* Armrests */}
      {hasArms && [-1, 1].map(side => (
        <group key={`arm-${side}`}>
          <mesh position={[side * (w * 0.42), seatY + 0.08, 0]}>
            <boxGeometry args={[0.03, 0.02, d * 0.5]} />
            {plasticMat(colors.secondary, isSelected)}
          </mesh>
          <mesh position={[side * (w * 0.42), seatY + 0.04, -d * 0.15]}>
            <boxGeometry args={[0.025, 0.08, 0.025]} />
            {plasticMat(colors.secondary, isSelected)}
          </mesh>
        </group>
      ))}

      {/* Legs */}
      {isStar ? (
        <>
          <mesh position={[0, seatY / 2, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, seatY * 0.6, 12]} />
            {metalMat('#444', isSelected)}
          </mesh>
          <mesh position={[0, seatY - seatH / 2 - 0.01, 0]}>
            <cylinderGeometry args={[0.04, 0.025, 0.06, 12]} />
            {plasticMat('#333', isSelected)}
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            const length = Math.max(w, d) * 0.42;
            return (
              <group key={i}>
                <mesh position={[Math.sin(angle) * length / 2, 0.02, Math.cos(angle) * length / 2]} rotation={[0, -angle, 0]} castShadow>
                  <boxGeometry args={[0.025, 0.02, length]} />
                  {metalMat('#555', isSelected)}
                </mesh>
                <mesh position={[Math.sin(angle) * length, 0.012, Math.cos(angle) * length]}>
                  <sphereGeometry args={[0.012, 8, 8]} />
                  <meshStandardMaterial color="#222" roughness={0.3} metalness={0.8} />
                </mesh>
              </group>
            );
          })}
        </>
      ) : is4Legs ? (
        [
          [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
          [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
          [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
          [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        ].map(([lx, , lz], i) => (
          <mesh key={i} position={[lx, seatY / 2, lz]} castShadow>
            <boxGeometry args={[0.03, seatY, 0.03]} />
            {analysis.secondaryMaterial === 'wood' ? woodMat(colors.secondary, isSelected) : metalMat(colors.secondary, isSelected)}
          </mesh>
        ))
      ) : (
        // Default star base
        <>
          <mesh position={[0, seatY / 2, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, seatY * 0.6, 12]} />
            {metalMat('#444', isSelected)}
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            const length = Math.max(w, d) * 0.42;
            return (
              <mesh key={i} position={[Math.sin(angle) * length / 2, 0.02, Math.cos(angle) * length / 2]} rotation={[0, -angle, 0]} castShadow>
                <boxGeometry args={[0.025, 0.02, length]} />
                {metalMat('#555', isSelected)}
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

// ========== AI-enhanced Sofa ==========
function AIEnhancedSofa({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const seatH = h * 0.4;
  const backH = h * 0.6;
  const armW = w * 0.08;
  const hasCushion = analysis.hasCushion ?? true;
  const cushionCount = Math.max(2, Math.round(w / 0.7));
  const cushionW = (w - armW * 2 - 0.04) / cushionCount;
  const hasArms = analysis.hasArmrest ?? true;
  const matFn = analysis.primaryMaterial === 'leather' ? fabricMat : fabricMat;
  const legStyle = analysis.legStyle || '4-legs';

  return (
    <group>
      {/* Base frame */}
      <RoundedBox args={[w, seatH, d]} radius={0.015} smoothness={4} position={[0, seatH / 2, 0]} castShadow receiveShadow>
        {matFn(darken(colors.primary, 0.06), isSelected)}
      </RoundedBox>
      {/* Seat cushions */}
      {hasCushion && Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`cushion-${i}`} args={[cushionW - 0.01, 0.07, d * 0.72]} radius={0.015} smoothness={4} position={[cx, seatH + 0.035, d * 0.04]} castShadow>
            {matFn(lighten(colors.primary, 0.05), isSelected)}
          </RoundedBox>
        );
      })}
      {/* Back cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`back-${i}`} args={[cushionW - 0.015, backH * 0.6, 0.18]} radius={0.02} smoothness={4} position={[cx, seatH + backH * 0.42, -(d / 2 - 0.1)]} castShadow>
            {matFn(lighten(colors.primary, 0.08), isSelected)}
          </RoundedBox>
        );
      })}
      {/* Arms */}
      {hasArms && [-(w / 2 - armW / 2), (w / 2 - armW / 2)].map((x, i) => (
        <group key={`arm-${i}`}>
          <mesh position={[x, seatH + backH * 0.28, 0]} castShadow>
            <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
            {matFn(darken(colors.primary, 0.04), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
          <mesh position={[x, seatH + backH * 0.58, 0]}>
            <boxGeometry args={[armW + 0.01, 0.02, d * 0.86]} />
            {matFn(lighten(colors.primary, 0.03), isSelected)}
          </mesh>
        </group>
      ))}
      {/* Feet */}
      {[
        [-(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, -(d / 2 - 0.06)],
        [-(w / 2 - 0.06), 0, (d / 2 - 0.06)],
        [(w / 2 - 0.06), 0, (d / 2 - 0.06)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.018, lz]} castShadow>
          <cylinderGeometry args={[0.01, 0.016, 0.035, 8]} />
          {analysis.secondaryMaterial === 'wood' ? woodMat(colors.secondary, isSelected) : metalMat(colors.secondary, isSelected)}
        </mesh>
      ))}
    </group>
  );
}

// ========== AI-enhanced Storage ==========
function AIEnhancedStorage({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const hasDoor = analysis.hasDoor ?? true;
  const doorCount = analysis.doorCount || 2;
  const hasShelf = analysis.hasShelf ?? true;
  const shelfCount = analysis.shelfCount || 3;
  const hasDrawer = analysis.hasDrawer ?? false;
  const drawerCount = analysis.drawerCount || 0;
  const primaryMatFn = analysis.primaryMaterial === 'wood' ? woodMat : metalMat;
  const panelThick = 0.018;

  return (
    <group>
      {/* Outer shell */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {primaryMatFn(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, h + 0.003, 0]}>
        <boxGeometry args={[w + 0.004, 0.006, d + 0.004]} />
        {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
      </mesh>

      {/* Internal shelves */}
      {hasShelf && Array.from({ length: shelfCount - 1 }, (_, i) => {
        const y = (h / shelfCount) * (i + 1);
        return (
          <mesh key={`shelf-${i}`} position={[0, y, 0]}>
            <boxGeometry args={[w - panelThick * 2, panelThick * 0.6, d - panelThick]} />
            {primaryMatFn(darken(colors.primary, 0.15), isSelected)}
          </mesh>
        );
      })}

      {/* Doors */}
      {hasDoor && Array.from({ length: doorCount }, (_, i) => {
        const doorW = (w - 0.01) / doorCount;
        const cx = -(w / 2) + doorW * i + doorW / 2 + 0.005;
        return (
          <group key={`door-${i}`}>
            <mesh position={[cx, h / 2, d / 2 + 0.002]}>
              <boxGeometry args={[doorW - 0.008, h * 0.96, 0.003]} />
              {primaryMatFn(lighten(colors.primary, 0.03), isSelected)}
            </mesh>
            {/* Handle */}
            <mesh position={[cx + doorW * 0.35, h / 2, d / 2 + 0.012]}>
              <boxGeometry args={[0.012, 0.045, 0.01]} />
              <meshStandardMaterial color={colors.secondary} roughness={0.2} metalness={0.95} />
            </mesh>
          </group>
        );
      })}

      {/* Drawers */}
      {hasDrawer && Array.from({ length: Math.min(drawerCount, 4) }, (_, i) => {
        const drawerH = Math.min(0.12, h / (drawerCount + 1));
        const yOff = drawerH * (i + 0.5) + 0.01 * i;
        return (
          <group key={`drawer-${i}`}>
            <mesh position={[0, yOff, d / 2 + 0.002]}>
              <boxGeometry args={[w * 0.95, drawerH - 0.01, 0.003]} />
              {primaryMatFn(lighten(colors.primary, 0.02), isSelected)}
            </mesh>
            <mesh position={[0, yOff, d / 2 + 0.012]}>
              <boxGeometry args={[0.06, 0.012, 0.01]} />
              <meshStandardMaterial color={colors.secondary} roughness={0.2} metalness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Base feet */}
      {[
        [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
        [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
      ].map(([fx, , fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, 0.006, fz]}>
          <cylinderGeometry args={[0.012, 0.015, 0.012, 8]} />
          <meshStandardMaterial color="#333" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ========== AI-enhanced Shelf ==========
function AIEnhancedShelf({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const shelfCount = analysis.shelfCount || Math.max(2, Math.round(h / 0.35));
  const shelfThick = 0.022;
  const sideThick = 0.022;
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat : woodMat;
  const hasBackPanel = !analysis.details?.includes('open-back');

  return (
    <group>
      {/* Side panels */}
      {[-(w / 2 - sideThick / 2), (w / 2 - sideThick / 2)].map((x, i) => (
        <mesh key={`side-${i}`} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[sideThick, h, d]} />
          {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
        </mesh>
      ))}
      {/* Back panel */}
      {hasBackPanel && (
        <mesh position={[0, h / 2, -(d / 2 - 0.005)]} castShadow>
          <boxGeometry args={[w - sideThick * 2, h, 0.008]} />
          {primaryMatFn(lighten(colors.primary, 0.05), isSelected)}
        </mesh>
      )}
      {/* Shelves */}
      {Array.from({ length: shelfCount + 1 }, (_, i) => {
        const y = (h / shelfCount) * i;
        return (
          <mesh key={i} position={[0, y + shelfThick / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - sideThick * 2, shelfThick, d]} />
            {primaryMatFn(colors.primary, isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== AI-enhanced Lab Bench ==========
function AIEnhancedLab({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const topH = Math.max(0.025, h * (analysis.topThickness || 0.05));
  const legH = h - topH;
  const legW = 0.05;
  const hasDrawer = analysis.hasDrawer ?? false;
  const drawerCount = analysis.drawerCount || 0;
  const hasDoor = analysis.hasDoor ?? false;
  const details = analysis.details || [];
  const hasSink = details.includes('sink') || details.includes('basin');
  const hasFaucet = details.includes('faucet') || hasSink;

  return (
    <group>
      {/* Chemical-resistant tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={colors.primary} roughness={0.3} metalness={0.15}
          emissive={isSelected ? '#001133' : '#000000'} emissiveIntensity={isSelected ? 0.15 : 0} />
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>

      {/* Steel frame legs */}
      {[-1, 1].map((side) => {
        const xOff = side * (w / 2 - legW / 2 - 0.02);
        return (
          <group key={`frame-${side}`}>
            <mesh position={[xOff, legH / 2, -(d / 2 - legW / 2 - 0.01)]} castShadow>
              <boxGeometry args={[legW, legH, legW]} />
              {metalMat(colors.secondary, isSelected)}
            </mesh>
            <mesh position={[xOff, legH / 2, (d / 2 - legW / 2 - 0.01)]} castShadow>
              <boxGeometry args={[legW, legH, legW]} />
              {metalMat(colors.secondary, isSelected)}
            </mesh>
            <mesh position={[xOff, legH * 0.15, 0]}>
              <boxGeometry args={[legW * 0.8, 0.02, d - legW * 2 - 0.04]} />
              {metalMat(darken(colors.secondary, 0.1), isSelected)}
            </mesh>
          </group>
        );
      })}

      {/* Sink */}
      {hasSink && (
        <mesh position={[w * 0.3, h - topH + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.1, 16]} />
          <meshStandardMaterial color="#555" roughness={0.2} metalness={0.8} />
        </mesh>
      )}
      {/* Faucet */}
      {hasFaucet && (
        <>
          <mesh position={[w * 0.3, h + 0.06, -d * 0.25]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            {metalMat('#aaa', isSelected)}
          </mesh>
          <mesh position={[w * 0.3, h + 0.12, -d * 0.18]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.008, 0.12, 8]} />
            {metalMat('#aaa', isSelected)}
          </mesh>
        </>
      )}

      {/* Under-counter cabinets */}
      {(hasDrawer || hasDoor) && (
        <mesh position={[-(w * 0.25), legH * 0.45, 0]} castShadow>
          <boxGeometry args={[w * 0.4, legH * 0.7, d * 0.85]} />
          {metalMat(lighten(colors.secondary, 0.1), isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
        </mesh>
      )}

      {/* Adjustable feet */}
      {[
        [-(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, -(d / 2 - 0.04)],
        [-(w / 2 - 0.04), 0, (d / 2 - 0.04)],
        [(w / 2 - 0.04), 0, (d / 2 - 0.04)],
      ].map(([fx, , fz], i) => (
        <mesh key={`foot-${i}`} position={[fx, 0.008, fz]}>
          <cylinderGeometry args={[0.018, 0.022, 0.016, 8]} />
          <meshStandardMaterial color="#444" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ========== AI-enhanced Round Table ==========
function AIEnhancedRoundTable({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const topH = Math.max(0.02, h * (analysis.topThickness || 0.04));
  const radius = Math.min(w, d) / 2;
  const legH = h - topH;
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat : woodMat;
  const legMatFn = analysis.secondaryMaterial === 'wood' ? woodMat : metalMat;
  const isPedestal = analysis.legStyle === 'pedestal' || analysis.legStyle === 'star-base';
  const legCount = analysis.legCount || 4;

  return (
    <group>
      {/* Round tabletop */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, topH, 32]} />
        {primaryMatFn(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>

      {isPedestal ? (
        <>
          <mesh position={[0, legH * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, legH, 12]} />
            {legMatFn(colors.secondary, isSelected)}
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[radius * 0.5, radius * 0.55, 0.02, 16]} />
            {legMatFn(darken(colors.secondary, 0.1), isSelected)}
          </mesh>
          {Array.from({ length: legCount }, (_, i) => {
            const angle = (i * Math.PI * 2) / legCount + Math.PI / legCount;
            return (
              <mesh key={i} position={[Math.cos(angle) * radius * 0.45, 0.008, Math.sin(angle) * radius * 0.45]}>
                <cylinderGeometry args={[0.015, 0.02, 0.016, 8]} />
                <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
              </mesh>
            );
          })}
        </>
      ) : (
        // Standard legs around the circumference
        Array.from({ length: legCount }, (_, i) => {
          const angle = (i * Math.PI * 2) / legCount;
          const lx = Math.cos(angle) * (radius - 0.05);
          const lz = Math.sin(angle) * (radius - 0.05);
          return (
            <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
              <boxGeometry args={[0.035, legH, 0.035]} />
              {legMatFn(colors.secondary, isSelected)}
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ========== AI-enhanced Generic (fallback) ==========
function AIEnhancedGeneric({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat :
    analysis.primaryMaterial === 'fabric' || analysis.primaryMaterial === 'leather' ? fabricMat : woodMat;

  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.01} smoothness={4} position={[0, h / 2, 0]} castShadow receiveShadow>
        {primaryMatFn(colors.primary, isSelected)}
      </RoundedBox>
      {/* Simple edge detail */}
      <mesh position={[0, h + 0.003, 0]}>
        <boxGeometry args={[w + 0.004, 0.004, d + 0.004]} />
        {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
      </mesh>
    </group>
  );
}

// ========== Main exported component ==========
export function FurnitureObject({ item, isSelected, onSelect, onContextSelect }: {
  item: PlacedFurniture;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onContextSelect?: (id: string) => void;
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
  
  // Get AI analysis if available
  const analysis = useMemo(() => getCachedAnalysis(item.furnitureId), [item.furnitureId]);
  
  // Use AI type if available, fallback to keyword detection
  const furnitureType = useMemo(() => {
    if (analysis) return getModelFromAnalysis(analysis);
    return detectFurnitureType(item);
  }, [item, analysis]);
  
  // Use AI colors if available
  const effectiveColor = useMemo(() => {
    if (analysis?.primaryColor) return analysis.primaryColor;
    return baseColor;
  }, [analysis, baseColor]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent.button === 0) {
      onSelect(item.id);
    } else if (e.nativeEvent.button === 2 && onContextSelect) {
      onContextSelect(item.id);
    }
  };

  // If AI analysis is available, use enhanced models
  const renderModel = () => {
    if (analysis) {
      const props = { w, d, h, color: effectiveColor, isSelected, analysis };
      switch (furnitureType) {
        case 'desk':
        case 'dining':
          return <AIEnhancedDesk {...props} />;
        case 'chair':
          return <AIEnhancedChair {...props} />;
        case 'sofa':
          return <AIEnhancedSofa {...props} />;
        case 'storage':
          return <AIEnhancedStorage {...props} />;
        case 'shelf':
          return <AIEnhancedShelf {...props} />;
        case 'lab':
          return <AIEnhancedLab {...props} />;
        case 'roundtable':
          return <AIEnhancedRoundTable {...props} />;
        default:
          return <AIEnhancedGeneric {...props} />;
      }
    }
    
    // Fallback: use original keyword-based detection
    const ModelComponent = getModelComponent(furnitureType);
    return <ModelComponent w={w} d={d} h={h} color={effectiveColor} isSelected={isSelected} />;
  };

  return (
    <group
      ref={groupRef}
      position={[posX, 0, posZ]}
      rotation={[0, -(item.rotation * Math.PI) / 180, 0]}
      onPointerDown={handlePointerDown}
    >
      {renderModel()}

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

function getModelComponent(furnitureType: string) {
  switch (furnitureType) {
    case 'desk': return DeskModel;
    case 'chair': return ChairModel;
    case 'storage': return StorageModel;
    case 'blackboard': return BlackboardCabinetModel;
    case 'sofa': return SofaModel;
    case 'shelf': return ShelfModel;
    case 'lab': return LabBenchModel;
    case 'dining': return DiningTableModel;
    case 'pet': return PetFurnitureModel;
    case 'bunkbed': return BunkBedModel;
    case 'roundtable': return RoundTableModel;
    default: return GenericModel;
  }
}
