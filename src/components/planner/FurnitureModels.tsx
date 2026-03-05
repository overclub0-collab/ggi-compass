import { useRef, useMemo } from 'react';
import { Edges, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types/planner';
import { ThreeEvent } from '@react-three/fiber';

const EDGE_COLOR = '#1a1a1a';
const SELECTED_EDGE = '#0066cc';

// ===== PBR Material helpers =====
function woodMat(color: string, isSelected = false) {
  return (
    <meshStandardMaterial
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
  return (
    <meshStandardMaterial
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
  return (
    <meshStandardMaterial
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

// Textured front face component
function TexturedFrontFace({ w, h, d, thumbnail, isSelected }: {
  w: number; h: number; d: number; thumbnail: string; isSelected: boolean;
}) {
  const texture = useTexture(thumbnail);

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
      {/* Tabletop with rounded edge effect (stacked) */}
      <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Edge banding strip */}
      <mesh position={[0, h - topH, 0]} castShadow>
        <boxGeometry args={[w + 0.002, 0.003, d + 0.002]} />
        {woodMat(darken(color, 0.08), isSelected)}
      </mesh>

      {/* 4 Legs — rectangular cross-section */}
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

      {/* Front apron (under top) */}
      <mesh position={[0, h - topH - apronH / 2 - 0.002, d / 2 - apronThick / 2 - 0.01]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, apronH, apronThick]} />
        {woodMat(darken(color, 0.05), isSelected)}
      </mesh>
      {/* Back apron */}
      <mesh position={[0, h - topH - apronH / 2 - 0.002, -(d / 2 - apronThick / 2 - 0.01)]} castShadow>
        <boxGeometry args={[w - legW * 2 - 0.04, apronH, apronThick]} />
        {woodMat(darken(color, 0.05), isSelected)}
      </mesh>

      {/* Horizontal crossbar (stretcher) */}
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

// ========== Chair — Detailed with armrests, gas lift, star base ==========
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
      {/* Seat — slightly curved (thicker edges) */}
      <mesh position={[0, seatY, d * 0.04]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.92, seatH, d * 0.85]} />
        {fabricMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Seat cushion highlight */}
      <mesh position={[0, seatY + seatH / 2 + 0.003, d * 0.04]}>
        <boxGeometry args={[w * 0.84, 0.006, d * 0.76]} />
        {fabricMat(lighten(color, 0.08), isSelected)}
      </mesh>

      {/* Backrest — curved panel */}
      <mesh position={[0, seatY + backH * 0.5, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.85, backH * 0.8, backThick]} />
        {fabricMat(lighten(color, 0.04), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Backrest top rail */}
      <mesh position={[0, seatY + backH * 0.92, -(d / 2 - backThick / 2)]} castShadow>
        <boxGeometry args={[w * 0.9, 0.028, backThick + 0.008]} />
        {plasticMat(darken(color, 0.2), isSelected)}
      </mesh>

      {/* Lumbar support detail */}
      <mesh position={[0, seatY + backH * 0.25, -(d / 2 - backThick - 0.005)]}>
        <boxGeometry args={[w * 0.5, 0.06, 0.015]} />
        {plasticMat(darken(color, 0.15), isSelected)}
      </mesh>

      {/* Gas lift cylinder */}
      <mesh position={[0, seatY / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, legH * 0.6, 12]} />
        {metalMat('#444', isSelected)}
      </mesh>
      {/* Gas lift cover */}
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
            {/* Caster wheel */}
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

// ========== Storage / Locker — Detailed with handles, hinges, internal shelves ==========
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

      {/* Top cap (slightly overhanging) */}
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

      {/* Front face door lines */}
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
              {/* Handle bar */}
              <mesh position={[cx + cellW * 0.32, cy, d / 2 + 0.012]}>
                <boxGeometry args={[0.012, 0.045, 0.01]} />
                <meshStandardMaterial color="#666" roughness={0.2} metalness={0.95} envMapIntensity={1.5} />
              </mesh>
              {/* Handle mount top */}
              <mesh position={[cx + cellW * 0.32, cy + 0.025, d / 2 + 0.007]}>
                <boxGeometry args={[0.016, 0.005, 0.006]} />
                <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
              </mesh>
              {/* Handle mount bottom */}
              <mesh position={[cx + cellW * 0.32, cy - 0.025, d / 2 + 0.007]}>
                <boxGeometry args={[0.016, 0.005, 0.006]} />
                <meshStandardMaterial color="#555" roughness={0.3} metalness={0.9} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Ventilation slots at top */}
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

// ========== Blackboard Cabinet — Frame detail, chalk tray, hinges ==========
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
          {/* Mount points */}
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
      {/* Tray lip */}
      <mesh position={[0, cabinetH + 0.03, -(d / 2 - 0.072)]}>
        <boxGeometry args={[w * 0.88, 0.012, 0.005]} />
        {woodMat(darken(color, 0.12), isSelected)}
      </mesh>
    </group>
  );
}

// ========== Sofa — Cushion detail, piping, legs ==========
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
      <mesh position={[0, seatH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d]} />
        {fabricMat(darken(color, 0.06), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>

      {/* Seat cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <mesh key={`cushion-${i}`} position={[cx, seatH + 0.035, d * 0.04]} castShadow>
            <boxGeometry args={[cushionW - 0.01, 0.07, d * 0.72]} />
            {fabricMat(lighten(color, 0.05), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
          </mesh>
        );
      })}

      {/* Back cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <mesh key={`back-${i}`} position={[cx, seatH + backH * 0.42, -(d / 2 - 0.1)]} castShadow>
            <boxGeometry args={[cushionW - 0.015, backH * 0.6, 0.18]} />
            {fabricMat(lighten(color, 0.08), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
          </mesh>
        );
      })}

      {/* Left arm */}
      <mesh position={[-(w / 2 - armW / 2), seatH + backH * 0.28, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
        {fabricMat(darken(color, 0.04), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Left arm top pad */}
      <mesh position={[-(w / 2 - armW / 2), seatH + backH * 0.58, 0]}>
        <boxGeometry args={[armW + 0.01, 0.02, d * 0.86]} />
        {fabricMat(lighten(color, 0.03), isSelected)}
      </mesh>

      {/* Right arm */}
      <mesh position={[(w / 2 - armW / 2), seatH + backH * 0.28, 0]} castShadow>
        <boxGeometry args={[armW, backH * 0.55, d * 0.88]} />
        {fabricMat(darken(color, 0.04), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
      {/* Right arm top pad */}
      <mesh position={[(w / 2 - armW / 2), seatH + backH * 0.58, 0]}>
        <boxGeometry args={[armW + 0.01, 0.02, d * 0.86]} />
        {fabricMat(lighten(color, 0.03), isSelected)}
      </mesh>

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
      {/* Left side panel */}
      <mesh position={[-(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        {woodMat(darken(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[(w / 2 - sideThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[sideThick, h, d]} />
        {woodMat(darken(color, 0.1), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>

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

      {/* Shelf pin details on sides */}
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

// ========== Generic fallback ==========
function GenericModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Base detail */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[w + 0.01, 0.01, d + 0.01]} />
        {metalMat(darken(color, 0.3), isSelected)}
      </mesh>
    </group>
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent.button === 0) {
      onSelect(item.id);
    } else if (e.nativeEvent.button === 2 && onContextSelect) {
      onContextSelect(item.id);
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
