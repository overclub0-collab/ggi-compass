import { useRef, useMemo } from 'react';
import { Edges, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types/planner';
import { ThreeEvent } from '@react-three/fiber';
import { getCachedAnalysis, FurnitureAnalysis, TextureAnalysis, PartTextures, SectionLayout } from '@/hooks/useFurnitureAnalysis';

const EDGE_COLOR = '#1a1a1a';
const SELECTED_EDGE = '#0066cc';

// ===== Procedural Texture Generators =====

// Global texture analysis context for current rendering — set per-part before calling material fns
let _currentTextureAnalysis: TextureAnalysis | undefined;
let _currentPartTextures: PartTextures | undefined;
let _currentDefaultTexture: TextureAnalysis | undefined;

/** Switch the active texture context to a specific furniture part */
function usePartTexture(part: keyof PartTextures) {
  _currentTextureAnalysis = _currentPartTextures?.[part] || _currentDefaultTexture;
}

/** Reset texture context to the default (whole-furniture) texture */
function useDefaultTexture() {
  _currentTextureAnalysis = _currentDefaultTexture;
}

function createWoodTexture(baseColor: string, scale = 1): THREE.CanvasTexture {
  const textureInfo = _currentTextureAnalysis?.woodGrain;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 512, 512);
  
  const direction = textureInfo?.direction || 'horizontal';
  const intensity = textureInfo?.intensity || 'moderate';
  const knotFrequency = textureInfo?.knotFrequency || 'few';
  const grainColor = textureInfo?.grainColor ? new THREE.Color(textureInfo.grainColor) : c.clone().multiplyScalar(0.82);
  
  const lineCount = intensity === 'subtle' ? 40 : intensity === 'pronounced' ? 140 : 80;
  const baseOpacity = intensity === 'subtle' ? 0.08 : intensity === 'pronounced' ? 0.25 : 0.15;
  
  for (let i = 0; i < lineCount; i++) {
    const pos = Math.random() * 512;
    const variation = (Math.random() - 0.5) * 30;
    const darker = grainColor.clone().multiplyScalar(0.9 + Math.random() * 0.1);
    ctx.strokeStyle = `rgba(${Math.round(darker.r*255)},${Math.round(darker.g*255)},${Math.round(darker.b*255)},${baseOpacity + Math.random() * 0.15})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.beginPath();
    
    if (direction === 'vertical') {
      ctx.moveTo(pos, 0);
      for (let y = 0; y < 512; y += 20) {
        ctx.lineTo(pos + Math.sin(y * 0.02 * scale) * (3 + variation * 0.3) + (Math.random() - 0.5) * 2, y);
      }
    } else if (direction === 'diagonal') {
      ctx.moveTo(pos, 0);
      for (let t = 0; t < 512; t += 20) {
        ctx.lineTo(pos + t * 0.5 + Math.sin(t * 0.02) * 3, t);
      }
    } else if (direction === 'radial') {
      const cx2 = 256, cy2 = 256;
      const angle = Math.random() * Math.PI * 2;
      const r1 = 20 + Math.random() * 80;
      ctx.arc(cx2, cy2, r1 + 50 + Math.random() * 100, angle - 0.3, angle + 0.3);
    } else {
      ctx.moveTo(0, pos);
      for (let x = 0; x < 512; x += 20) {
        ctx.lineTo(x, pos + Math.sin(x * 0.02 * scale) * (3 + variation * 0.3) + (Math.random() - 0.5) * 2);
      }
    }
    ctx.stroke();
  }
  
  const knotCount = knotFrequency === 'none' ? 0 : knotFrequency === 'many' ? 5 : 2;
  for (let i = 0; i < knotCount; i++) {
    const kx = Math.random() * 512;
    const ky = Math.random() * 512;
    const kr = 5 + Math.random() * 12;
    const kColor = grainColor.clone().multiplyScalar(0.65);
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.arc(kx, ky, kr - ring * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${Math.round(kColor.r*255)},${Math.round(kColor.g*255)},${Math.round(kColor.b*255)},${0.15 + ring * 0.08})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(kx, ky, kr * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(kColor.r*255)},${Math.round(kColor.g*255)},${Math.round(kColor.b*255)},0.35)`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}

function createMetalTexture(baseColor: string): THREE.CanvasTexture {
  const metalFinish = _currentTextureAnalysis?.metalFinish;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 256, 256);
  
  const finishType = metalFinish?.type || 'brushed';
  const brushDir = metalFinish?.brushDirection || 'horizontal';
  
  if (finishType === 'brushed' || finishType === 'anodized') {
    const streakCount = finishType === 'anodized' ? 100 : 200;
    for (let i = 0; i < streakCount; i++) {
      const lighter = c.clone().lerp(new THREE.Color('#ffffff'), 0.1 + Math.random() * 0.15);
      ctx.strokeStyle = `rgba(${Math.round(lighter.r*255)},${Math.round(lighter.g*255)},${Math.round(lighter.b*255)},${0.05 + Math.random() * 0.1})`;
      ctx.lineWidth = 0.3 + Math.random() * 0.8;
      ctx.beginPath();
      if (brushDir === 'vertical') {
        const x = Math.random() * 256;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 3, 256);
      } else if (brushDir === 'circular') {
        const angle = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 80;
        ctx.arc(128, 128, r, angle, angle + 0.5 + Math.random() * 0.5);
      } else {
        const y = Math.random() * 256;
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }
  } else if (finishType === 'chrome' || finishType === 'polished') {
    const grad = ctx.createRadialGradient(100, 80, 10, 128, 128, 180);
    const highlight = c.clone().lerp(new THREE.Color('#ffffff'), 0.4);
    grad.addColorStop(0, `rgba(${Math.round(highlight.r*255)},${Math.round(highlight.g*255)},${Math.round(highlight.b*255)},0.3)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  } else if (finishType === 'powder-coated' || finishType === 'matte') {
    for (let x = 0; x < 256; x += 2) {
      for (let y = 0; y < 256; y += 2) {
        const noise = (Math.random() - 0.5) * 0.04;
        const nc = c.clone().multiplyScalar(1 + noise);
        ctx.fillStyle = `rgba(${Math.round(nc.r*255)},${Math.round(nc.g*255)},${Math.round(nc.b*255)},0.5)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createFabricTexture(baseColor: string): THREE.CanvasTexture {
  const fabricInfo = _currentTextureAnalysis?.fabricPattern;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(baseColor);
  
  ctx.fillStyle = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`;
  ctx.fillRect(0, 0, 256, 256);
  
  const fabricType = fabricInfo?.type || 'plain';
  const weaveScale = fabricInfo?.weaveScale || 1;
  const step = Math.max(2, Math.round(3 / weaveScale));
  
  if (fabricType === 'twill') {
    for (let x = 0; x < 256; x += step) {
      for (let y = 0; y < 256; y += step) {
        const bright = ((x + y) % (step * 4) < step * 2) ? 0.96 : 1.04;
        const wc = c.clone().multiplyScalar(bright);
        ctx.fillStyle = `rgba(${Math.round(wc.r*255)},${Math.round(wc.g*255)},${Math.round(wc.b*255)},0.5)`;
        ctx.fillRect(x, y, step - 1, step - 1);
      }
    }
  } else if (fabricType === 'velvet') {
    for (let x = 0; x < 256; x += 2) {
      for (let y = 0; y < 256; y += 2) {
        const sheen = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.06;
        const vc = c.clone().multiplyScalar(1 + sheen);
        ctx.fillStyle = `rgba(${Math.round(vc.r*255)},${Math.round(vc.g*255)},${Math.round(vc.b*255)},0.4)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  } else if (fabricType === 'leather-grain') {
    for (let i = 0; i < 300; i++) {
      const px = Math.random() * 256;
      const py = Math.random() * 256;
      const pr = 1 + Math.random() * 3;
      const darker = c.clone().multiplyScalar(0.88 + Math.random() * 0.08);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(darker.r*255)},${Math.round(darker.g*255)},${Math.round(darker.b*255)},0.2)`;
      ctx.fill();
    }
  } else if (fabricType === 'mesh') {
    for (let x = 0; x < 256; x += step * 2) {
      for (let y = 0; y < 256; y += step * 2) {
        const darker = c.clone().multiplyScalar(0.85);
        ctx.fillStyle = `rgba(${Math.round(darker.r*255)},${Math.round(darker.g*255)},${Math.round(darker.b*255)},0.3)`;
        ctx.fillRect(x, y, 1, step * 2);
        ctx.fillRect(x, y, step * 2, 1);
      }
    }
  } else if (fabricType === 'knit') {
    for (let y = 0; y < 256; y += step * 3) {
      for (let x = 0; x < 256; x += step * 2) {
        const darker = c.clone().multiplyScalar(0.93);
        ctx.strokeStyle = `rgba(${Math.round(darker.r*255)},${Math.round(darker.g*255)},${Math.round(darker.b*255)},0.3)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step * 1.5);
        ctx.lineTo(x + step * 2, y);
        ctx.stroke();
      }
    }
  } else {
    for (let x = 0; x < 256; x += step) {
      for (let y = 0; y < 256; y += step) {
        const bright = ((x + y) % (step * 2) < step) ? 0.97 : 1.03;
        const wc = c.clone().multiplyScalar(bright);
        ctx.fillStyle = `rgba(${Math.round(wc.r*255)},${Math.round(wc.g*255)},${Math.round(wc.b*255)},0.4)`;
        ctx.fillRect(x, y, step - 1, step - 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3 * weaveScale, 3 * weaveScale);
  return tex;
}

function createWoodNormalMap(): THREE.CanvasTexture {
  const direction = _currentTextureAnalysis?.woodGrain?.direction;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, 512, 512);
  
  const isVertical = direction === 'vertical';
  const isDiagonal = direction === 'diagonal';
  
  for (let i = 0; i < 60; i++) {
    const pos = Math.random() * 512;
    ctx.strokeStyle = `rgba(${120 + Math.random()*16},${125 + Math.random()*8},255,0.3)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    if (isVertical) {
      ctx.moveTo(pos, 0);
      for (let y = 0; y < 512; y += 15) {
        ctx.lineTo(pos + Math.sin(y * 0.03) * 3, y);
      }
    } else if (isDiagonal) {
      ctx.moveTo(pos, 0);
      for (let t = 0; t < 512; t += 15) {
        ctx.lineTo(pos + t * 0.5 + Math.sin(t * 0.03) * 2, t);
      }
    } else {
      ctx.moveTo(0, pos);
      for (let x = 0; x < 512; x += 15) {
        ctx.lineTo(x, pos + Math.sin(x * 0.03) * 3);
      }
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ===== PBR Material helpers with procedural textures =====
function woodMat(color: string, isSelected = false) {
  const tex = _currentTextureAnalysis;
  const map = useMemo(() => createWoodTexture(color), [color]);
  const normalMap = useMemo(() => createWoodNormalMap(), []);
  const roughness = tex?.roughnessEstimate ?? 0.72;
  const metalness = tex?.metalnessEstimate ?? 0.02;
  const normalStrength = tex?.woodGrain?.intensity === 'pronounced' ? 0.5 : tex?.woodGrain?.intensity === 'subtle' ? 0.15 : 0.3;
  
  return (
    <meshStandardMaterial
      map={map}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(normalStrength, normalStrength)}
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={tex?.surfaceFinish === 'glossy' ? 1.0 : tex?.surfaceFinish === 'matte' ? 0.3 : 0.6}
    />
  );
}

function metalMat(color: string, isSelected = false) {
  const tex = _currentTextureAnalysis;
  const map = useMemo(() => createMetalTexture(color), [color]);
  const roughness = tex?.metalnessEstimate !== undefined ? (1 - tex.metalnessEstimate) * 0.4 : 0.28;
  const metalness = tex?.metalnessEstimate ?? 0.9;
  const envIntensity = tex?.metalFinish?.type === 'chrome' || tex?.metalFinish?.type === 'polished' ? 2.0 :
    tex?.metalFinish?.type === 'matte' || tex?.metalFinish?.type === 'powder-coated' ? 0.6 : 1.2;
  
  return (
    <meshStandardMaterial
      map={map}
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={envIntensity}
    />
  );
}

function plasticMat(color: string, isSelected = false) {
  const tex = _currentTextureAnalysis;
  const roughness = tex?.roughnessEstimate ?? 0.5;
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={0.04}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.15 : 0}
      envMapIntensity={tex?.surfaceFinish === 'glossy' ? 0.8 : 0.4}
    />
  );
}

function fabricMat(color: string, isSelected = false) {
  const tex = _currentTextureAnalysis;
  const map = useMemo(() => createFabricTexture(color), [color]);
  const roughness = tex?.roughnessEstimate ?? 0.92;
  const envIntensity = tex?.fabricPattern?.type === 'velvet' ? 0.15 :
    tex?.fabricPattern?.type === 'leather-grain' ? 0.4 : 0.2;
  
  return (
    <meshStandardMaterial
      map={map}
      color={color}
      roughness={roughness}
      metalness={0.0}
      emissive={isSelected ? '#001133' : '#000000'}
      emissiveIntensity={isSelected ? 0.12 : 0}
      envMapIntensity={envIntensity}
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

// ========== Blackboard Cabinet — Full structure: lower cab + board + upper shelves + sides + filler ==========
function BlackboardCabinetModel({ w, d, h, color, isSelected }: {
  w: number; d: number; h: number; color: string; isSelected: boolean;
}) {
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const edgeW = isSelected ? 2.5 : 1;
  const panelThick = 0.02;
  
  // Proportions based on real 칠판보조장
  const lowerH = h * 0.28;        // 하부장 높이
  const boardH = h * 0.42;         // 칠판/화이트보드 영역
  const upperH = h * 0.22;         // 상부 선반장
  const fillerH = h * 0.06;        // 상부 마감 휠라
  const sideW = w * 0.12;          // 양 사이드 장 폭
  const boardAreaW = w - sideW * 2; // 중앙 보드 영역

  return (
    <group>
      {/* ===== 하부장 (Lower Cabinet) ===== */}
      <mesh position={[0, lowerH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, lowerH, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
      </mesh>
      {/* 하부장 문 분할선 */}
      <mesh position={[0, lowerH / 2, d / 2 + 0.001]}>
        <boxGeometry args={[0.004, lowerH * 0.88, 0.001]} />
        <meshStandardMaterial color={darken(color, 0.3)} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* 하부장 손잡이 */}
      {[-0.04, 0.04].map((xOff, i) => (
        <mesh key={`lh-${i}`} position={[xOff, lowerH / 2, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.05, 8]} />
          <meshStandardMaterial color="#888" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}

      {/* ===== 양 사이드 장 (Side Cabinets) — 하부장 위부터 상부 선반까지 ===== */}
      {[-1, 1].map((side) => {
        const sx = side * (w / 2 - sideW / 2);
        const sideFullH = boardH + upperH;
        const sideY = lowerH + sideFullH / 2;
        return (
          <group key={`side-${side}`}>
            {/* 사이드 장 본체 */}
            <mesh position={[sx, sideY, 0]} castShadow>
              <boxGeometry args={[sideW, sideFullH, d]} />
              {woodMat(color, isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={edgeW} />
            </mesh>
            {/* 사이드 장 내부 선반 (2~3단) */}
            {Array.from({ length: 3 }, (_, i) => {
              const shelfY = lowerH + (sideFullH / 4) * (i + 1);
              return (
                <mesh key={`ss-${i}`} position={[sx, shelfY, 0]}>
                  <boxGeometry args={[sideW - panelThick * 2, panelThick * 0.5, d - panelThick]} />
                  {woodMat(darken(color, 0.08), isSelected)}
                </mesh>
              );
            })}
            {/* 사이드 장 문 or 개방면 표시 */}
            <mesh position={[sx, sideY, d / 2 + 0.002]}>
              <boxGeometry args={[sideW - 0.01, sideFullH - 0.02, 0.003]} />
              {woodMat(lighten(color, 0.03), isSelected)}
            </mesh>
          </group>
        );
      })}

      {/* ===== 화이트보드/칠판 (Center Board) ===== */}
      <mesh position={[0, lowerH + boardH / 2, -(d / 2 - panelThick / 2)]} castShadow>
        <boxGeometry args={[boardAreaW - 0.04, boardH - 0.04, panelThick]} />
        <meshStandardMaterial color="#f5f3ee" roughness={0.15} metalness={0.08} envMapIntensity={0.8} />
        <Edges threshold={15} color={edgeColor} lineWidth={1} />
      </mesh>
      {/* 보드 프레임 — 상 */}
      <mesh position={[0, lowerH + boardH, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[boardAreaW, 0.03, panelThick + 0.01]} />
        {woodMat(darken(color, 0.12), isSelected)}
      </mesh>
      {/* 보드 프레임 — 하 */}
      <mesh position={[0, lowerH + 0.015, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[boardAreaW, 0.03, panelThick + 0.01]} />
        {woodMat(darken(color, 0.12), isSelected)}
      </mesh>
      {/* 분필/마커 받침대 */}
      <mesh position={[0, lowerH + 0.012, -(d / 2 - 0.04)]}>
        <boxGeometry args={[boardAreaW * 0.85, 0.015, 0.06]} />
        {woodMat(darken(color, 0.1), isSelected)}
      </mesh>

      {/* ===== 상부 선반장 (Upper Shelf Cabinet) ===== */}
      {/* 상부 배경판 */}
      <mesh position={[0, lowerH + boardH + upperH / 2, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[boardAreaW, upperH, panelThick]} />
        {woodMat(lighten(color, 0.04), isSelected)}
      </mesh>
      {/* 상부 선반 (2단) */}
      {[0.5].map((ratio, i) => {
        const shelfY = lowerH + boardH + upperH * ratio;
        return (
          <mesh key={`us-${i}`} position={[0, shelfY, 0]}>
            <boxGeometry args={[boardAreaW - 0.02, panelThick, d]} />
            {woodMat(color, isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
          </mesh>
        );
      })}
      {/* 상부 수직 칸막이 (3~4칸 분할) */}
      {Array.from({ length: 3 }, (_, i) => {
        const divX = -(boardAreaW / 2) + (boardAreaW / 4) * (i + 1);
        return (
          <mesh key={`ud-${i}`} position={[divX, lowerH + boardH + upperH / 2, 0]}>
            <boxGeometry args={[panelThick * 0.6, upperH, d - panelThick]} />
            {woodMat(darken(color, 0.06), isSelected)}
          </mesh>
        );
      })}
      {/* 상부 상판 */}
      <mesh position={[0, lowerH + boardH + upperH, 0]}>
        <boxGeometry args={[boardAreaW, panelThick, d]} />
        {woodMat(color, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
      </mesh>
      {/* 상부 하판 */}
      <mesh position={[0, lowerH + boardH, 0]}>
        <boxGeometry args={[boardAreaW, panelThick, d]} />
        {woodMat(color, isSelected)}
      </mesh>

      {/* ===== 상부 마감 휠라 (Top Filler/Crown) ===== */}
      <mesh position={[0, h - fillerH / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.01, fillerH, d + 0.005]} />
        {woodMat(darken(color, 0.05), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
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

  return detectTypeFromKeywords(name, cat);
}

function detectTypeFromKeywords(name: string, cat: string): string {
  // Round table detection — MUST be checked before generic desk/table
  if (name.includes('원형') || name.includes('라운드') || name.includes('둥근') || name.includes('원탁') || name.includes('round') || name.includes('원형탁자') || name.includes('원형식탁') || name.includes('원형테이블')) return 'roundtable';

  // Blackboard / whiteboard cabinet
  if (name.includes('칠판') || name.includes('보조장') || name.includes('blackboard') || name.includes('화이트보드')) return 'blackboard';
  
  // Bunk bed / military bed
  if (name.includes('침대') || name.includes('이층') || name.includes('bunk') || name.includes('bed') || name.includes('군용침대')) return 'bunkbed';
  
  // Pet furniture
  if (name.includes('반려') || name.includes('펫') || name.includes('pet') || name.includes('강아지') || name.includes('고양이') || name.includes('하우스') || cat.includes('반려') || cat.includes('pet')) return 'pet';
  
  // Podium / lectern
  if (name.includes('강연대') || name.includes('교탁') || name.includes('podium') || name.includes('lectern')) return 'podium';
  
  // Lab bench
  if (name.includes('실험') || name.includes('lab') || name.includes('과학') || name.includes('약품') || cat.includes('lab')) return 'lab';
  
  // Dining table
  if (name.includes('식탁') || name.includes('급식') || name.includes('dining') || name.includes('구내식당') || cat.includes('dining') || cat.includes('식당')) return 'dining';
  
  // Chair
  if (name.includes('의자') || name.includes('chair') || name.includes('스툴') || name.includes('좌석') || cat.includes('chair')) return 'chair';
  
  // Sofa
  if (name.includes('소파') || name.includes('sofa') || name.includes('카우치') || cat.includes('sofa')) return 'sofa';
  
  // Storage / locker / cabinet
  if (name.includes('사물함') || name.includes('수납') || name.includes('서랍') || name.includes('캐비닛') || name.includes('locker') || name.includes('신발장') || name.includes('옷장') || name.includes('보관') || name.includes('철장') || name.includes('장롱') || name.includes('락커') || name.includes('cabinet') || cat.includes('storage')) return 'storage';
  
  // Shelf / bookcase
  if (name.includes('선반') || name.includes('책장') || name.includes('shelf') || name.includes('진열') || name.includes('거치대') || cat.includes('shelf')) return 'shelf';
  
  // Desk / table / conference table / workstation (broad — last)
  if (name.includes('책상') || name.includes('탁자') || name.includes('테이블') || name.includes('desk') || name.includes('table') || name.includes('작업대') || name.includes('워크') || name.includes('회의') || name.includes('conference') || name.includes('세미나') || cat.includes('desk') || cat.includes('table')) return 'desk';

  return 'generic';
}

// ========== AI-enhanced model selection with keyword cross-check ==========
function getModelFromAnalysis(analysis: FurnitureAnalysis, item: PlacedFurniture): string {
  const aiType = analysis.furnitureType || 'generic';
  const name = (item.furniture.name || '').toLowerCase();
  const cat = (item.furniture.category || '').toLowerCase();
  const keywordType = detectTypeFromKeywords(name, cat);

  // If keyword detection gives a specific type (not generic) and AI gave generic, prefer keyword
  if (aiType === 'generic' && keywordType !== 'generic') {
    return keywordType;
  }

  // If keyword says roundtable but AI doesn't, override (round tables are easy to detect by name)
  if (keywordType === 'roundtable' && aiType !== 'roundtable') {
    return 'roundtable';
  }

  // If keyword says specific structural types that AI might miss, prefer keyword
  const structuralTypes = ['blackboard', 'bunkbed', 'pet', 'lab', 'podium'];
  if (structuralTypes.includes(keywordType) && !structuralTypes.includes(aiType)) {
    return keywordType;
  }

  return aiType;
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

  // Part-specific texture helpers
  const topMat = (c: string, sel: boolean) => { usePartTexture('top'); return primaryMatFn(c, sel); };
  const legMaterial = (c: string, sel: boolean) => { usePartTexture('legs'); return legMatFn(c, sel); };
  const drawerMat = (c: string, sel: boolean) => { usePartTexture('drawers'); return primaryMatFn(c, sel); };

  return (
    <group>
      {/* Tabletop */}
      {hasRoundedEdges ? (
        <RoundedBox args={[w, topH, d]} radius={0.01} smoothness={4} position={[0, h - topH / 2, 0]} castShadow receiveShadow>
          {topMat(colors.primary, isSelected)}
        </RoundedBox>
      ) : (
        <mesh position={[0, h - topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, topH, d]} />
          {topMat(colors.primary, isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
        </mesh>
      )}
      {/* Edge banding */}
      <mesh position={[0, h - topH, 0]}>
        <boxGeometry args={[w + 0.002, 0.003, d + 0.002]} />
        {topMat(darken(colors.primary, 0.08), isSelected)}
      </mesh>

      {/* Legs based on style */}
      {(() => {
        // Keyword-based leg style override from product name
        const itemName = ((analysis as any)._productName || '').toLowerCase();
        let legStyle = analysis.legStyle || '4-legs';
        let isWoodMaterial = analysis.primaryMaterial === 'wood' || analysis.secondaryMaterial === 'wood';
        
        // Override leg material from product name keywords
        if (itemName.includes('철재') || itemName.includes('스틸') || itemName.includes('steel') || itemName.includes('metal')) {
          isWoodMaterial = false;
        }
        if (itemName.includes('목재') || itemName.includes('원목') || itemName.includes('나무')) {
          isWoodMaterial = true;
        }
        // Override leg style from product name if AI missed it
        if (itemName.includes('트레슬') || itemName.includes('trestle')) legStyle = 'trestle';
        if (itemName.includes('패널다리') || itemName.includes('panel')) legStyle = 'panel';
        if (itemName.includes('슬레드') || itemName.includes('sled')) legStyle = 'sled';
        if (itemName.includes('t자') || itemName.includes('t-frame') || itemName.includes('T프레임')) legStyle = 'T-frame';
        
        const isSled = legStyle === 'sled';
        const isTrestle = legStyle === 'trestle';
        const isPedestal = legStyle === 'pedestal';
        const isStarBase = legStyle === 'star-base';
        const isTapered = details.includes('tapered-legs');
        const isRoundLeg = analysis.legCount === 4 && (details.includes('round-legs') || details.includes('cylindrical'));

        if (isSled) {
          // U-shaped sled base (metal runners)
          return [-1, 1].map((side) => {
            const xOff = side * (w / 2 - legW - 0.02);
            return (
              <group key={`sled-${side}`}>
                {/* Vertical front */}
                <mesh position={[xOff, legH * 0.5, d / 2 - legW / 2 - 0.01]} castShadow>
                  <boxGeometry args={[legW, legH, legW]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
                {/* Vertical back */}
                <mesh position={[xOff, legH * 0.5, -(d / 2 - legW / 2 - 0.01)]} castShadow>
                  <boxGeometry args={[legW, legH, legW]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
                {/* Bottom horizontal runner connecting front to back */}
                <mesh position={[xOff, legW / 2, 0]} castShadow>
                  <boxGeometry args={[legW, legW, d - legW - 0.02]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
              </group>
            );
          });
        }
        if (isTrestle) {
          // A-frame / trestle legs
          return [-1, 1].map((side) => {
            const xOff = side * (w / 2 - w * 0.15);
            return (
              <group key={`trestle-${side}`}>
                {/* Central post */}
                <mesh position={[xOff, legH / 2, 0]} castShadow>
                  <boxGeometry args={[0.05, legH, 0.05]} />
                  {legMaterial(colors.secondary, isSelected)}
                  <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
                </mesh>
                {/* Base bar (horizontal spread) */}
                <mesh position={[xOff, 0.015, 0]}>
                  <boxGeometry args={[0.04, 0.03, d * 0.7]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
                {/* Foot pads */}
                {[-1, 1].map((z) => (
                  <mesh key={`pad-${z}`} position={[xOff, 0.005, z * d * 0.35]}>
                    <cylinderGeometry args={[0.02, 0.025, 0.01, 8]} />
                    <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
                  </mesh>
                ))}
              </group>
            );
          });
        }
        if (isPedestal) {
          // Center pedestal column
          return (
            <group>
              <mesh position={[0, legH * 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.06, legH, 12]} />
                {legMaterial(colors.secondary, isSelected)}
              </mesh>
              <mesh position={[0, 0.01, 0]}>
                <cylinderGeometry args={[Math.min(w, d) * 0.3, Math.min(w, d) * 0.35, 0.02, 16]} />
                {legMaterial(darken(colors.secondary, 0.1), isSelected)}
              </mesh>
            </group>
          );
        }
        if (isStarBase) {
          // 5-leg star base (like office chair but for desk)
          return (
            <group>
              <mesh position={[0, legH * 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.04, legH, 12]} />
                {legMaterial(colors.secondary, isSelected)}
              </mesh>
              {[0, 1, 2, 3, 4].map(i => {
                const angle = (i * Math.PI * 2) / 5;
                const length = Math.max(w, d) * 0.4;
                return (
                  <mesh key={i} position={[Math.sin(angle) * length / 2, 0.015, Math.cos(angle) * length / 2]} rotation={[0, -angle, 0]} castShadow>
                    <boxGeometry args={[0.025, 0.02, length]} />
                    {legMaterial(colors.secondary, isSelected)}
                  </mesh>
                );
              })}
            </group>
          );
        }
        if (isTFrame) {
          // T-frame: vertical post with horizontal base
          return [-1, 1].map((side) => {
            const xOff = side * (w / 2 - 0.06);
            return (
              <group key={`tleg-${side}`}>
                <mesh position={[xOff, legH / 2, 0]} castShadow>
                  <boxGeometry args={[legW, legH, legW]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
                <mesh position={[xOff, 0.015, 0]}>
                  <boxGeometry args={[legW, 0.03, d * 0.7]} />
                  {legMaterial(colors.secondary, isSelected)}
                </mesh>
              </group>
            );
          });
        }
        if (isPanel) {
          // Panel-style solid side panels (wood desk)
          return [-1, 1].map((side) => (
            <mesh key={`panel-${side}`} position={[side * (w / 2 - 0.015), legH / 2, 0]} castShadow>
              <boxGeometry args={[0.03, legH, d * 0.85]} />
              {(() => { usePartTexture('legs'); return primaryMatFn(darken(colors.primary, 0.1), isSelected); })()}
              <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
            </mesh>
          ));
        }
        if (isTapered && isWoodMaterial) {
          // Tapered wood legs — narrower at bottom
          const positions = [
            [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
          ];
          return positions.map(([lx, , lz], i) => (
            <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
              <cylinderGeometry args={[legW * 0.4, legW * 0.7, legH, 8]} />
              {(() => { usePartTexture('legs'); return woodMat(colors.secondary, isSelected); })()}
            </mesh>
          ));
        }
        if (isRoundLeg || (isWoodMaterial && legStyle === '4-legs')) {
          // Round cylindrical legs (wood or metal)
          const positions = [
            [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
            [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
            [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
          ];
          const radius = legW * 0.5;
          return positions.map(([lx, , lz], i) => (
            <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
              <cylinderGeometry args={[radius, radius, legH, 12]} />
              {isWoodMaterial
                ? (() => { usePartTexture('legs'); return woodMat(colors.secondary, isSelected); })()
                : legMaterial(colors.secondary, isSelected)
              }
            </mesh>
          ));
        }
        // Default: box 4-legs (metal)
        return [
          [-(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
          [(w / 2 - legW / 2 - 0.01), 0, -(d / 2 - legD / 2 - 0.01)],
          [-(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
          [(w / 2 - legW / 2 - 0.01), 0, (d / 2 - legD / 2 - 0.01)],
        ].map(([lx, , lz], i) => (
          <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
            <boxGeometry args={[legW, legH, legD]} />
            {legMaterial(colors.secondary, isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.6} />
          </mesh>
        ));
      })()}

      {/* Front/back aprons */}
      {(() => { usePartTexture('body'); return null; })()}
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
          {legMaterial(colors.secondary, isSelected)}
        </mesh>
      )}

      {/* Drawers if detected */}
      {hasDrawers && Array.from({ length: Math.min(drawerCount || 1, 3) }, (_, i) => {
        const dH = Math.min(0.08, (legH - 0.06) / (drawerCount || 1));
        const yOff = h - topH - 0.07 - i * (dH + 0.01);
        return (
          <group key={`drawer-${i}`}>
            <mesh position={[w * 0.25, yOff, d / 2 - 0.005]}>
              <boxGeometry args={[w * 0.45, dH, 0.01]} />
              {drawerMat(darken(colors.primary, 0.03), isSelected)}
            </mesh>
            <mesh position={[w * 0.25, yOff, d / 2 + 0.008]}>
              <boxGeometry args={[0.04, 0.01, 0.01]} />
              {(() => { usePartTexture('accent'); return metalMat('#888', isSelected); })()}
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
      {(() => { useDefaultTexture(); return null; })()}
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
  const seatMatFn = analysis.primaryMaterial === 'leather' || analysis.primaryMaterial === 'fabric' ? fabricMat : plasticMat;

  return (
    <group>
      {/* Seat */}
      {(() => { usePartTexture('seat'); return null; })()}
      <RoundedBox args={[w * 0.92, seatH, d * 0.85]} radius={0.012} smoothness={4} position={[0, seatY, d * 0.04]} castShadow receiveShadow>
        {seatMatFn(colors.primary, isSelected)}
      </RoundedBox>
      {hasCushion && (
        <RoundedBox args={[w * 0.84, 0.006, d * 0.76]} radius={0.003} smoothness={2} position={[0, seatY + seatH / 2 + 0.003, d * 0.04]}>
          {(() => { usePartTexture('cushion'); return seatMatFn(lighten(colors.primary, 0.08), isSelected); })()}
        </RoundedBox>
      )}

      {/* Backrest */}
      {analysis.hasBackrest !== false && (
        <>
          {(() => { usePartTexture('back'); return null; })()}
          <RoundedBox args={[w * 0.85, backH * 0.8, 0.025]} radius={0.008} smoothness={4} position={[0, seatY + backH * 0.5, -(d / 2 - 0.013)]} castShadow>
            {seatMatFn(lighten(colors.primary, 0.04), isSelected)}
          </RoundedBox>
          <mesh position={[0, seatY + backH * 0.92, -(d / 2 - 0.013)]} castShadow>
            <boxGeometry args={[w * 0.9, 0.028, 0.033]} />
            {(() => { usePartTexture('accent'); return plasticMat(colors.secondary, isSelected); })()}
          </mesh>
        </>
      )}

      {/* Armrests */}
      {hasArms && [-1, 1].map(side => (
        <group key={`arm-${side}`}>
          {(() => { usePartTexture('arms'); return null; })()}
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
      {(() => { usePartTexture('legs'); return null; })()}
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
      {(() => { useDefaultTexture(); return null; })()}
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
      {(() => { usePartTexture('body'); return null; })()}
      <RoundedBox args={[w, seatH, d]} radius={0.015} smoothness={4} position={[0, seatH / 2, 0]} castShadow receiveShadow>
        {matFn(darken(colors.primary, 0.06), isSelected)}
      </RoundedBox>
      {/* Seat cushions */}
      {hasCushion && Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`cushion-${i}`} args={[cushionW - 0.01, 0.07, d * 0.72]} radius={0.015} smoothness={4} position={[cx, seatH + 0.035, d * 0.04]} castShadow>
            {(() => { usePartTexture('cushion'); return matFn(lighten(colors.primary, 0.05), isSelected); })()}
          </RoundedBox>
        );
      })}
      {/* Back cushions */}
      {Array.from({ length: cushionCount }, (_, i) => {
        const cx = -(w / 2 - armW - 0.02) + cushionW * i + cushionW / 2;
        return (
          <RoundedBox key={`back-${i}`} args={[cushionW - 0.015, backH * 0.6, 0.18]} radius={0.02} smoothness={4} position={[cx, seatH + backH * 0.42, -(d / 2 - 0.1)]} castShadow>
            {(() => { usePartTexture('back'); return matFn(lighten(colors.primary, 0.08), isSelected); })()}
          </RoundedBox>
        );
      })}
      {/* Arms */}
      {hasArms && [-(w / 2 - armW / 2), (w / 2 - armW / 2)].map((x, i) => (
        <group key={`arm-${i}`}>
          {(() => { usePartTexture('arms'); return null; })()}
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
      {(() => { usePartTexture('legs'); return null; })()}
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
      {(() => { useDefaultTexture(); return null; })()}
    </group>
  );
}

// ========== AI-enhanced Storage ==========
function AIEnhancedStorage({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const sections = analysis.sections;
  const name = (analysis as any)._productName || '';
  const nameHasOpen = name.includes('오픈') || name.includes('open') || name.includes('개방');
  const isOpenFront = sections?.hasOpenFront === true || nameHasOpen;
  // CRITICAL: Respect AI analysis — if hasOpenFront is true OR hasDoor is explicitly false OR product name says "오픈", no doors
  const hasDoor = isOpenFront ? false : (analysis.hasDoor ?? false);
  const doorCount = analysis.doorCount || 2;
  const hasShelf = analysis.hasShelf ?? true;
  const shelfCount = analysis.shelfCount || 3;
  const hasDrawer = analysis.hasDrawer ?? false;
  const drawerCount = analysis.drawerCount || 0;
  const primaryMatFn = analysis.primaryMaterial === 'wood' || analysis.primaryMaterial === 'melamine' || analysis.primaryMaterial === 'hpl' ? woodMat : metalMat;
  const panelThick = 0.018;
  const grid = sections?.compartmentGrid;
  const isGridLayout = sections?.layout === 'grid' && grid;

  return (
    <group>
      {/* Outer shell */}
      {(() => { usePartTexture('body'); return null; })()}
      {/* Back panel */}
      <mesh position={[0, h / 2, -(d / 2 - 0.004)]} castShadow>
        <boxGeometry args={[w, h, 0.008]} />
        {primaryMatFn(darken(colors.primary, 0.05), isSelected)}
      </mesh>
      {/* Top */}
      <mesh position={[0, h - panelThick / 2, 0]} castShadow>
        <boxGeometry args={[w, panelThick, d]} />
        {primaryMatFn(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, panelThick / 2, 0]} castShadow>
        <boxGeometry args={[w, panelThick, d]} />
        {primaryMatFn(colors.primary, isSelected)}
      </mesh>
      {/* Left side */}
      <mesh position={[-(w / 2 - panelThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[panelThick, h, d]} />
        {primaryMatFn(darken(colors.primary, 0.08), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Right side */}
      <mesh position={[(w / 2 - panelThick / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[panelThick, h, d]} />
        {primaryMatFn(darken(colors.primary, 0.08), isSelected)}
      </mesh>

      {isGridLayout ? (
        // Grid layout (lockers / cubby storage)
        <>
          {/* Vertical dividers */}
          {Array.from({ length: grid!.cols - 1 }, (_, i) => {
            const x = -(w / 2 - panelThick) + ((w - panelThick * 2) / grid!.cols) * (i + 1);
            return (
              <mesh key={`vd-${i}`} position={[x, h / 2, 0]}>
                <boxGeometry args={[panelThick * 0.7, h - panelThick * 2, d - panelThick]} />
                {primaryMatFn(darken(colors.primary, 0.06), isSelected)}
              </mesh>
            );
          })}
          {/* Horizontal dividers */}
          {Array.from({ length: grid!.rows - 1 }, (_, i) => {
            const y = panelThick + ((h - panelThick * 2) / grid!.rows) * (i + 1);
            return (
              <mesh key={`hd-${i}`} position={[0, y, 0]}>
                <boxGeometry args={[w - panelThick * 2, panelThick * 0.6, d - panelThick]} />
                {primaryMatFn(darken(colors.primary, 0.04), isSelected)}
              </mesh>
            );
          })}
          {/* Individual compartment doors */}
          {hasDoor && Array.from({ length: grid!.cols }, (_, ci) => {
            const cellW = (w - panelThick * 2) / grid!.cols;
            const cx = -(w / 2 - panelThick) + cellW * ci + cellW / 2;
            return Array.from({ length: grid!.rows }, (_, ri) => {
              const cellH = (h - panelThick * 2) / grid!.rows;
              const cy = panelThick + cellH * ri + cellH / 2;
              return (
                <group key={`door-${ci}-${ri}`}>
                  <mesh position={[cx, cy, d / 2 + 0.001]}>
                    <boxGeometry args={[cellW - panelThick * 1.5, cellH - panelThick * 1.2, 0.003]} />
                    {(() => { usePartTexture('doors'); return primaryMatFn(lighten(colors.primary, 0.03), isSelected); })()}
                  </mesh>
                  {/* Handle */}
                  <mesh position={[cx, cy, d / 2 + 0.01]}>
                    <boxGeometry args={[cellW * 0.15, 0.008, 0.008]} />
                    {(() => { usePartTexture('accent'); return metalMat(colors.secondary, isSelected); })()}
                  </mesh>
                  {/* Number label area */}
                  {analysis.details?.includes('number-labels') && (
                    <mesh position={[cx, cy + cellH * 0.3, d / 2 + 0.005]}>
                      <planeGeometry args={[cellW * 0.3, cellH * 0.15]} />
                      <meshStandardMaterial color="#f0f0e8" roughness={0.6} />
                    </mesh>
                  )}
                </group>
              );
            });
          })}
          {/* Ventilation holes */}
          {analysis.details?.includes('ventilation-holes') && Array.from({ length: grid!.cols }, (_, ci) => {
            const cellW = (w - panelThick * 2) / grid!.cols;
            const cx = -(w / 2 - panelThick) + cellW * ci + cellW / 2;
            return Array.from({ length: grid!.rows }, (_, ri) => {
              const cellH = (h - panelThick * 2) / grid!.rows;
              const cy = panelThick + cellH * ri + cellH * 0.15;
              return (
                <mesh key={`vent-${ci}-${ri}`} position={[cx, cy, d / 2 + 0.004]}>
                  <planeGeometry args={[cellW * 0.4, cellH * 0.08]} />
                  <meshStandardMaterial color={darken(colors.primary, 0.15)} roughness={0.8} metalness={0.3} />
                </mesh>
              );
            });
          })}
        </>
      ) : (
        <>
          {/* Standard shelves */}
          {hasShelf && Array.from({ length: shelfCount - 1 }, (_, i) => {
            const y = (h / shelfCount) * (i + 1);
            return (
              <mesh key={`shelf-${i}`} position={[0, y, 0]}>
                <boxGeometry args={[w - panelThick * 2, panelThick * 0.6, d - panelThick]} />
                {(() => { usePartTexture('shelves'); return primaryMatFn(darken(colors.primary, 0.15), isSelected); })()}
              </mesh>
            );
          })}
          {/* Standard doors */}
          {hasDoor && Array.from({ length: doorCount }, (_, i) => {
            const dw = (w - 0.01) / doorCount;
            const cx = -(w / 2) + dw * i + dw / 2 + 0.005;
            return (
              <group key={`door-${i}`}>
                <mesh position={[cx, h / 2, d / 2 + 0.002]}>
                  <boxGeometry args={[dw - 0.008, h * 0.96, 0.003]} />
                  {(() => { usePartTexture('doors'); return primaryMatFn(lighten(colors.primary, 0.03), isSelected); })()}
                </mesh>
                <mesh position={[cx + dw * 0.35, h / 2, d / 2 + 0.012]}>
                  <boxGeometry args={[0.012, 0.045, 0.01]} />
                  {(() => { usePartTexture('accent'); return metalMat(colors.secondary, isSelected); })()}
                </mesh>
              </group>
            );
          })}
          {/* Drawers */}
          {hasDrawer && Array.from({ length: Math.min(drawerCount, 4) }, (_, i) => {
            const drH = Math.min(0.12, h / (drawerCount + 1));
            const yOff = drH * (i + 0.5) + 0.01 * i;
            return (
              <group key={`drawer-${i}`}>
                <mesh position={[0, yOff, d / 2 + 0.002]}>
                  <boxGeometry args={[w * 0.95, drH - 0.01, 0.003]} />
                  {(() => { usePartTexture('drawers'); return primaryMatFn(lighten(colors.primary, 0.02), isSelected); })()}
                </mesh>
                <mesh position={[0, yOff, d / 2 + 0.012]}>
                  <boxGeometry args={[0.06, 0.012, 0.01]} />
                  {(() => { usePartTexture('accent'); return metalMat(colors.secondary, isSelected); })()}
                </mesh>
              </group>
            );
          })}
        </>
      )}

      {/* Base feet */}
      {(() => { usePartTexture('legs'); return null; })()}
      {analysis.details?.includes('adjustable-feet') || analysis.details?.includes('casters') ? (
        [
          [-(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
          [(w / 2 - 0.03), 0, -(d / 2 - 0.03)],
          [-(w / 2 - 0.03), 0, (d / 2 - 0.03)],
          [(w / 2 - 0.03), 0, (d / 2 - 0.03)],
        ].map(([fx, , fz], i) => (
          <mesh key={`foot-${i}`} position={[fx, 0.006, fz]}>
            <cylinderGeometry args={[0.012, 0.015, 0.012, 8]} />
            <meshStandardMaterial color="#333" roughness={0.7} metalness={0.5} />
          </mesh>
        ))
      ) : (
        // Plinth base
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[w - 0.01, 0.03, d - 0.02]} />
          {primaryMatFn(darken(colors.primary, 0.12), isSelected)}
        </mesh>
      )}
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

// ========== AI-enhanced Blackboard Cabinet ==========
function AIEnhancedBlackboard({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const panelThick = 0.02;
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat :
    (analysis.primaryMaterial === 'melamine' || analysis.primaryMaterial === 'hpl') ? woodMat : woodMat;
  
  const hasShelf = analysis.hasShelf ?? true;
  const shelfCount = analysis.shelfCount || 2;
  const hasDoor = analysis.hasDoor ?? true;
  const doorCount = analysis.doorCount || 2;
  const details = analysis.details || [];
  const sections = analysis.sections;
  const hasUpperShelves = hasShelf || details.includes('upper-shelf') || details.includes('compartments');
  
  // Use AI-detected section ratios or fallback
  const lowerH = h * (sections?.bottomRatio || 0.28);
  const topFillerRatio = 0.04;
  const fillerH = h * topFillerRatio;
  const remainH = h - lowerH - fillerH;
  const boardRatio = sections?.middleRatio || 0.55;
  const boardH = remainH * boardRatio;
  const upperH = remainH * (1 - boardRatio);
  const sideW = w * (sections?.leftSideRatio || 0.12);
  const boardAreaW = w - sideW * 2;
  const upperCols = sections?.columns || 4;
  const upperRows = sections?.rows || (shelfCount > 0 ? shelfCount : 2);

  return (
    <group>
      {/* 하부장 본체 */}
      <mesh position={[0, lowerH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, lowerH, d]} />
        {primaryMatFn(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* 하부장 문 */}
      {hasDoor && Array.from({ length: doorCount }, (_, i) => {
        const dw = w / doorCount;
        const cx = -(w / 2) + dw * i + dw / 2;
        return (
          <group key={`ld-${i}`}>
            <mesh position={[cx, lowerH / 2, d / 2 + 0.002]}>
              <boxGeometry args={[dw - 0.008, lowerH - 0.02, 0.003]} />
              {primaryMatFn(lighten(colors.primary, 0.02), isSelected)}
            </mesh>
            {/* Handle */}
            <mesh position={[cx + dw * 0.35, lowerH / 2, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <meshStandardMaterial color={colors.secondary} roughness={0.2} metalness={0.95} />
            </mesh>
          </group>
        );
      })}

      {/* 양 사이드 장 (수납 컬럼) */}
      {[-1, 1].map((side) => {
        const sx = side * (w / 2 - sideW / 2);
        const sideFullH = boardH + upperH;
        const sideY = lowerH + sideFullH / 2;
        const sideShelves = Math.max(2, Math.round(sideFullH / 0.35));
        return (
          <group key={`side-${side}`}>
            {/* Side cabinet body */}
            <mesh position={[sx, sideY, 0]} castShadow>
              <boxGeometry args={[sideW, sideFullH, d]} />
              {primaryMatFn(colors.primary, isSelected)}
              <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
            </mesh>
            {/* Side shelves */}
            {Array.from({ length: sideShelves - 1 }, (_, i) => (
              <mesh key={`ss-${i}`} position={[sx, lowerH + (sideFullH / sideShelves) * (i + 1), 0]}>
                <boxGeometry args={[sideW - panelThick * 2, panelThick * 0.5, d - panelThick]} />
                {primaryMatFn(darken(colors.primary, 0.08), isSelected)}
              </mesh>
            ))}
            {/* Open front visible depth */}
            <mesh position={[sx, sideY, d / 2 - panelThick / 2]}>
              <boxGeometry args={[sideW, sideFullH, panelThick * 0.3]} />
              {primaryMatFn(darken(colors.primary, 0.03), isSelected)}
            </mesh>
          </group>
        );
      })}

      {/* 화이트보드/칠판 영역 */}
      <mesh position={[0, lowerH + boardH / 2, -(d / 2 - panelThick / 2)]} castShadow>
        <boxGeometry args={[boardAreaW - 0.04, boardH - 0.04, panelThick]} />
        <meshStandardMaterial color="#f5f3ee" roughness={0.12} metalness={0.08} envMapIntensity={0.8} />
      </mesh>
      {/* 보드 프레임 (상) */}
      <mesh position={[0, lowerH + boardH, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[boardAreaW, 0.025, panelThick + 0.008]} />
        {primaryMatFn(darken(colors.primary, 0.12), isSelected)}
      </mesh>
      {/* 보드 프레임 (하) */}
      <mesh position={[0, lowerH + 0.012, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[boardAreaW, 0.025, panelThick + 0.008]} />
        {primaryMatFn(darken(colors.primary, 0.12), isSelected)}
      </mesh>
      {/* 보드 좌우 프레임 */}
      {[-1, 1].map(side => (
        <mesh key={`bf-${side}`} position={[side * (boardAreaW / 2 - 0.012), lowerH + boardH / 2, -(d / 2 - panelThick / 2)]}>
          <boxGeometry args={[0.025, boardH, panelThick + 0.008]} />
          {primaryMatFn(darken(colors.primary, 0.12), isSelected)}
        </mesh>
      ))}
      {/* 분필/마커 받이 */}
      {(details.includes('marker-tray') || details.includes('chalk-tray')) && (
        <mesh position={[0, lowerH + 0.01, -(d / 2 - 0.04)]}>
          <boxGeometry args={[boardAreaW * 0.85, 0.012, 0.06]} />
          {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
        </mesh>
      )}

      {/* 상부 선반장 — 칸막이 포함 */}
      {hasUpperShelves && (
        <>
          {/* Back panel */}
          <mesh position={[0, lowerH + boardH + upperH / 2, -(d / 2 - panelThick / 2)]}>
            <boxGeometry args={[boardAreaW, upperH, panelThick]} />
            {primaryMatFn(lighten(colors.primary, 0.04), isSelected)}
          </mesh>
          {/* Top cap */}
          <mesh position={[0, lowerH + boardH + upperH, 0]}>
            <boxGeometry args={[boardAreaW, panelThick, d]} />
            {primaryMatFn(colors.primary, isSelected)}
          </mesh>
          {/* Bottom separator */}
          <mesh position={[0, lowerH + boardH, 0]}>
            <boxGeometry args={[boardAreaW, panelThick, d]} />
            {primaryMatFn(colors.primary, isSelected)}
          </mesh>
          {/* Horizontal shelves in upper area */}
          {Array.from({ length: Math.max(0, upperRows - 1) }, (_, i) => (
            <mesh key={`us-${i}`} position={[0, lowerH + boardH + upperH * ((i + 1) / upperRows), 0]}>
              <boxGeometry args={[boardAreaW - 0.02, panelThick * 0.8, d]} />
              {primaryMatFn(colors.primary, isSelected)}
            </mesh>
          ))}
          {/* Vertical dividers in upper area */}
          {Array.from({ length: Math.max(0, upperCols - 1) }, (_, i) => (
            <mesh key={`ud-${i}`} position={[-(boardAreaW / 2) + (boardAreaW / upperCols) * (i + 1), lowerH + boardH + upperH / 2, 0]}>
              <boxGeometry args={[panelThick * 0.6, upperH - panelThick, d - panelThick]} />
              {primaryMatFn(darken(colors.primary, 0.06), isSelected)}
            </mesh>
          ))}
        </>
      )}

      {/* 상부 마감 필라 */}
      <mesh position={[0, h - fillerH / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.01, fillerH, d + 0.005]} />
        {primaryMatFn(darken(colors.primary, 0.05), isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
      </mesh>
    </group>
  );
}
// ========== AI-enhanced Bunk Bed ==========
function AIEnhancedBunkBed({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const frameW = Math.max(0.03, w * (analysis.legThickness || 0.04));
  const mattressH = 0.08;
  const lowerY = h * 0.22;
  const upperY = h * 0.62;
  const legMatFn = analysis.secondaryMaterial === 'wood' ? woodMat : metalMat;
  const details = analysis.details || [];
  const hasLadder = !details.includes('no-ladder');
  const hasGuardRail = !details.includes('no-guardrail');
  const shelfCount = analysis.shelfCount || 0;

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
          {legMatFn(colors.secondary, isSelected)}
          <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
        </mesh>
      ))}

      {/* Lower bed frame + mattress */}
      <mesh position={[0, lowerY, 0]}>
        <boxGeometry args={[w - frameW * 2, 0.02, d - frameW * 2]} />
        {legMatFn(darken(colors.secondary, 0.1), isSelected)}
      </mesh>
      <mesh position={[0, lowerY + mattressH / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[w - frameW * 2 - 0.02, mattressH, d - frameW * 2 - 0.02]} />
        {fabricMat(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.5} />
      </mesh>

      {/* Upper bed frame + mattress */}
      <mesh position={[0, upperY, 0]}>
        <boxGeometry args={[w - frameW * 2, 0.02, d - frameW * 2]} />
        {legMatFn(darken(colors.secondary, 0.1), isSelected)}
      </mesh>
      <mesh position={[0, upperY + mattressH / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[w - frameW * 2 - 0.02, mattressH, d - frameW * 2 - 0.02]} />
        {fabricMat(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={0.5} />
      </mesh>

      {/* Guard rail */}
      {hasGuardRail && (
        <>
          <mesh position={[0, upperY + mattressH + 0.08, d / 2 - frameW / 2]}>
            <boxGeometry args={[w - frameW * 2, 0.025, 0.015]} />
            {legMatFn(darken(colors.secondary, 0.05), isSelected)}
          </mesh>
          <mesh position={[0, upperY + mattressH + 0.08, -(d / 2 - frameW / 2)]}>
            <boxGeometry args={[w - frameW * 2, 0.025, 0.015]} />
            {legMatFn(darken(colors.secondary, 0.05), isSelected)}
          </mesh>
        </>
      )}

      {/* Ladder */}
      {hasLadder && (
        <group>
          {/* Ladder rails */}
          {[-0.05, 0.05].map((xOff, i) => (
            <mesh key={`lr-${i}`} position={[w / 2 - frameW - 0.02 + xOff, (lowerY + upperY) / 2, d / 2 - frameW / 2 + 0.02]}>
              <boxGeometry args={[0.015, upperY - lowerY + 0.1, 0.015]} />
              {legMatFn(colors.secondary, isSelected)}
            </mesh>
          ))}
          {/* Ladder rungs */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <mesh key={`rung-${i}`} position={[w / 2 - frameW - 0.02, lowerY + (upperY - lowerY) * ratio, d / 2 - frameW / 2 + 0.04]}>
              <boxGeometry args={[0.12, 0.012, 0.015]} />
              {legMatFn(colors.secondary, isSelected)}
            </mesh>
          ))}
        </group>
      )}

      {/* Side horizontal braces */}
      {[-1, 1].map(side => (
        <group key={`brace-${side}`}>
          <mesh position={[side * (w / 2 - frameW / 2), lowerY * 0.5, 0]}>
            <boxGeometry args={[frameW * 0.6, 0.02, d - frameW * 2]} />
            {legMatFn(darken(colors.secondary, 0.15), isSelected)}
          </mesh>
        </group>
      ))}

      {/* Optional under-bed shelf/storage */}
      {shelfCount > 0 && (
        <mesh position={[0, lowerY * 0.4, 0]}>
          <boxGeometry args={[w - frameW * 2 - 0.04, 0.015, d - frameW * 2 - 0.04]} />
          {legMatFn(darken(colors.secondary, 0.05), isSelected)}
        </mesh>
      )}

      {/* Pillow indicators */}
      {[lowerY, upperY].map((bedY, bi) => (
        <RoundedBox key={`pillow-${bi}`} args={[w * 0.3, 0.04, 0.18]} radius={0.015} smoothness={3}
          position={[-(w / 2 - frameW - w * 0.18), bedY + mattressH + 0.03, -(d / 2 - frameW - 0.12)]} castShadow>
          {fabricMat(lighten(colors.primary, 0.15), isSelected)}
        </RoundedBox>
      ))}
    </group>
  );
}

// ========== AI-enhanced Pet Furniture ==========
function AIEnhancedPet({ w, d, h, color, isSelected, analysis }: {
  w: number; d: number; h: number; color: string; isSelected: boolean; analysis: FurnitureAnalysis;
}) {
  const colors = getColorsFromAnalysis(analysis, color);
  const edgeColor = isSelected ? SELECTED_EDGE : EDGE_COLOR;
  const primaryMatFn = analysis.primaryMaterial === 'metal' ? metalMat :
    analysis.primaryMaterial === 'plastic' ? plasticMat : woodMat;
  const details = analysis.details || [];
  const wallThick = 0.02;
  const hasRoof = !details.includes('open-top');
  const hasCushion = analysis.hasCushion ?? true;
  const hasDoor = analysis.hasDoor ?? true;
  const roofH = h * 0.25;
  const bodyH = hasRoof ? h - roofH : h;
  const doorW = w * 0.4;
  const doorH = bodyH * 0.7;
  const hasShelf = analysis.hasShelf ?? false;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, bodyH / 2, -(d / 2 - wallThick / 2)]} castShadow>
        <boxGeometry args={[w, bodyH, wallThick]} />
        {primaryMatFn(colors.primary, isSelected)}
        <Edges threshold={15} color={edgeColor} lineWidth={isSelected ? 2.5 : 1} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-(w / 2 - wallThick / 2), bodyH / 2, 0]} castShadow>
        <boxGeometry args={[wallThick, bodyH, d]} />
        {primaryMatFn(colors.primary, isSelected)}
      </mesh>
      {/* Right wall */}
      <mesh position={[(w / 2 - wallThick / 2), bodyH / 2, 0]} castShadow>
        <boxGeometry args={[wallThick, bodyH, d]} />
        {primaryMatFn(colors.primary, isSelected)}
      </mesh>

      {/* Front wall with door opening */}
      {hasDoor ? (
        <>
          <mesh position={[-(w / 2 - wallThick / 2) + (w - doorW) / 4, bodyH / 2, d / 2 - wallThick / 2]} castShadow>
            <boxGeometry args={[(w - doorW) / 2 - wallThick, bodyH, wallThick]} />
            {primaryMatFn(colors.primary, isSelected)}
          </mesh>
          <mesh position={[(w / 2 - wallThick / 2) - (w - doorW) / 4, bodyH / 2, d / 2 - wallThick / 2]} castShadow>
            <boxGeometry args={[(w - doorW) / 2 - wallThick, bodyH, wallThick]} />
            {primaryMatFn(colors.primary, isSelected)}
          </mesh>
          <mesh position={[0, bodyH - (bodyH - doorH) / 4, d / 2 - wallThick / 2]} castShadow>
            <boxGeometry args={[doorW, (bodyH - doorH) / 2, wallThick]} />
            {primaryMatFn(colors.primary, isSelected)}
          </mesh>
          {/* Door arch */}
          <mesh position={[0, doorH * 0.95, d / 2 - wallThick / 2 + 0.002]}>
            <ringGeometry args={[0, doorW / 2 - 0.005, 16, 1, 0, Math.PI]} />
            <meshStandardMaterial color={darken(colors.primary, 0.2)} roughness={0.7} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, bodyH / 2, d / 2 - wallThick / 2]} castShadow>
          <boxGeometry args={[w, bodyH, wallThick]} />
          {primaryMatFn(colors.primary, isSelected)}
        </mesh>
      )}

      {/* Floor */}
      <mesh position={[0, wallThick / 2, 0]} receiveShadow>
        <boxGeometry args={[w, wallThick, d]} />
        {primaryMatFn(darken(colors.primary, 0.1), isSelected)}
      </mesh>

      {/* Internal shelf */}
      {hasShelf && (
        <mesh position={[0, bodyH * 0.5, 0]}>
          <boxGeometry args={[w - wallThick * 2 - 0.01, wallThick * 0.6, d - wallThick * 2]} />
          {primaryMatFn(darken(colors.primary, 0.05), isSelected)}
        </mesh>
      )}

      {/* Roof */}
      {hasRoof && (
        <>
          <mesh position={[-(w / 4), bodyH + roofH * 0.4, 0]} rotation={[0, 0, Math.PI * 0.12]} castShadow>
            <boxGeometry args={[w * 0.55, 0.015, d + 0.04]} />
            {primaryMatFn(darken(colors.primary, 0.2), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
          <mesh position={[(w / 4), bodyH + roofH * 0.4, 0]} rotation={[0, 0, -Math.PI * 0.12]} castShadow>
            <boxGeometry args={[w * 0.55, 0.015, d + 0.04]} />
            {primaryMatFn(darken(colors.primary, 0.2), isSelected)}
            <Edges threshold={15} color={edgeColor} lineWidth={0.8} />
          </mesh>
          {/* Ridge beam */}
          <mesh position={[0, bodyH + roofH * 0.55, 0]}>
            <boxGeometry args={[0.03, 0.02, d + 0.06]} />
            {primaryMatFn(darken(colors.primary, 0.3), isSelected)}
          </mesh>
        </>
      )}

      {/* Interior cushion */}
      {hasCushion && (
        <RoundedBox args={[w * 0.85, 0.04, d * 0.85]} radius={0.01} smoothness={3}
          position={[0, wallThick + 0.02, 0]} castShadow>
          {fabricMat(colors.accent || '#e8d5c4', isSelected)}
        </RoundedBox>
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
  
  // Get AI analysis if available, inject product name for keyword overrides
  const analysis = useMemo(() => {
    const cached = getCachedAnalysis(item.furnitureId);
    if (cached) {
      (cached as any)._productName = item.furniture.name || '';
    }
    return cached;
  }, [item.furnitureId, item.furniture.name]);
  
  // Use AI type if available, fallback to keyword detection
  const furnitureType = useMemo(() => {
    if (analysis) return getModelFromAnalysis(analysis, item);
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
    // Set texture contexts for material functions
    _currentDefaultTexture = analysis?.texture;
    _currentPartTextures = analysis?.partTextures;
    _currentTextureAnalysis = _currentDefaultTexture;
    
    if (analysis) {
      const props = { w, d, h, color: effectiveColor, isSelected, analysis };
      
      // Check if this should be a round table based on shape/topShape/name
      const isRound = analysis.topShape === 'round' || analysis.topShape === 'oval' || analysis.shape === 'round';
      
      // Route round tables regardless of furnitureType
      if (isRound && ['desk', 'dining', 'generic', 'roundtable'].includes(furnitureType)) {
        return <AIEnhancedRoundTable {...props} />;
      }
      
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
        case 'blackboard':
          return <AIEnhancedBlackboard {...props} />;
        case 'bunkbed':
          return <AIEnhancedBunkBed {...props} />;
        case 'pet':
          return <AIEnhancedPet {...props} />;
        case 'podium':
          return <AIEnhancedDesk {...props} />; // Podium uses enhanced desk model
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
