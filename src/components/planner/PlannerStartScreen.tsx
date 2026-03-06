import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, PenTool, School, Briefcase, Home, UtensilsCrossed, FlaskConical, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomDimensions } from '@/types/planner';
import { ArchitecturalConfig } from '@/components/planner/ArchitecturalSettingsPanel';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { Link } from 'react-router-dom';

interface SpaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  dimensions: RoomDimensions;
  color: string;
  archConfig: ArchitecturalConfig;
}

const TEMPLATES: SpaceTemplate[] = [
  {
    id: 'office', name: '사무실', description: '일반 사무 공간 (6m × 5m)', icon: Briefcase,
    dimensions: { width: 6000, height: 5000 }, color: 'hsl(210, 40%, 55%)',
    archConfig: {
      windows: [
        { type: 'double', width: 1.8, height: 1.5, wall: 'back', positionRatio: 0.3 },
        { type: 'double', width: 1.8, height: 1.5, wall: 'back', positionRatio: 0.7 },
      ],
      doors: [
        { type: 'swing', material: 'wood', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.85 },
      ],
      columns: [],
      partitions: [
        { wall: 'right', positionRatio: 0.5, width: 2.0, height: 1.5 },
      ],
      outlets: [
        { wall: 'back', positionRatio: 0.15 },
        { wall: 'back', positionRatio: 0.85 },
        { wall: 'right', positionRatio: 0.2 },
        { wall: 'left', positionRatio: 0.4 },
      ],
      ceilingLights: [
        { type: 'panel', xRatio: 0.3, zRatio: 0.35 },
        { type: 'panel', xRatio: 0.7, zRatio: 0.35 },
        { type: 'panel', xRatio: 0.3, zRatio: 0.7 },
        { type: 'panel', xRatio: 0.7, zRatio: 0.7 },
      ],
    },
  },
  {
    id: 'classroom', name: '교실', description: '표준 교실 (9m × 7m)', icon: School,
    dimensions: { width: 9000, height: 7000 }, color: 'hsl(45, 60%, 55%)',
    archConfig: {
      windows: [
        { type: 'sliding', width: 2.4, height: 1.4, wall: 'left', positionRatio: 0.2 },
        { type: 'sliding', width: 2.4, height: 1.4, wall: 'left', positionRatio: 0.5 },
        { type: 'sliding', width: 2.4, height: 1.4, wall: 'left', positionRatio: 0.8 },
      ],
      doors: [
        { type: 'sliding', material: 'glass', width: 1.2, height: 2.1, wall: 'front', positionRatio: 0.15 },
        { type: 'sliding', material: 'glass', width: 1.2, height: 2.1, wall: 'front', positionRatio: 0.85 },
      ],
      columns: [
        { wall: 'right', positionRatio: 0.33, radius: 0.15 },
        { wall: 'right', positionRatio: 0.66, radius: 0.15 },
      ],
      partitions: [],
      outlets: [
        { wall: 'back', positionRatio: 0.1 },
        { wall: 'back', positionRatio: 0.5 },
        { wall: 'back', positionRatio: 0.9 },
        { wall: 'right', positionRatio: 0.5 },
      ],
      ceilingLights: [
        { type: 'panel', xRatio: 0.25, zRatio: 0.25 },
        { type: 'panel', xRatio: 0.5, zRatio: 0.25 },
        { type: 'panel', xRatio: 0.75, zRatio: 0.25 },
        { type: 'panel', xRatio: 0.25, zRatio: 0.5 },
        { type: 'panel', xRatio: 0.5, zRatio: 0.5 },
        { type: 'panel', xRatio: 0.75, zRatio: 0.5 },
        { type: 'panel', xRatio: 0.25, zRatio: 0.75 },
        { type: 'panel', xRatio: 0.5, zRatio: 0.75 },
        { type: 'panel', xRatio: 0.75, zRatio: 0.75 },
      ],
    },
  },
  {
    id: 'dining', name: '식당', description: '단체 식당 (8m × 6m)', icon: UtensilsCrossed,
    dimensions: { width: 8000, height: 6000 }, color: 'hsl(25, 50%, 55%)',
    archConfig: {
      windows: [
        { type: 'fixed', width: 2.4, height: 1.4, wall: 'back', positionRatio: 0.25 },
        { type: 'fixed', width: 2.4, height: 1.4, wall: 'back', positionRatio: 0.75 },
      ],
      doors: [
        { type: 'double', width: 1.8, height: 2.1, wall: 'front', positionRatio: 0.5 },
        { type: 'swing', width: 0.9, height: 2.1, wall: 'right', positionRatio: 0.85 },
      ],
      columns: [
        { wall: 'back', positionRatio: 0.5, radius: 0.2 },
      ],
      partitions: [
        { wall: 'right', positionRatio: 0.35, width: 1.5, height: 1.2 },
      ],
      outlets: [
        { wall: 'left', positionRatio: 0.3 },
        { wall: 'left', positionRatio: 0.7 },
        { wall: 'right', positionRatio: 0.15 },
      ],
      ceilingLights: [
        { type: 'pendant', xRatio: 0.25, zRatio: 0.3 },
        { type: 'pendant', xRatio: 0.5, zRatio: 0.3 },
        { type: 'pendant', xRatio: 0.75, zRatio: 0.3 },
        { type: 'pendant', xRatio: 0.25, zRatio: 0.7 },
        { type: 'pendant', xRatio: 0.5, zRatio: 0.7 },
        { type: 'pendant', xRatio: 0.75, zRatio: 0.7 },
      ],
    },
  },
  {
    id: 'lab', name: '실험실', description: '과학 실험실 (8m × 6m)', icon: FlaskConical,
    dimensions: { width: 8000, height: 6000 }, color: 'hsl(180, 30%, 50%)',
    archConfig: {
      windows: [
        { type: 'fixed', width: 1.2, height: 1.0, wall: 'back', positionRatio: 0.2 },
        { type: 'fixed', width: 1.2, height: 1.0, wall: 'back', positionRatio: 0.5 },
        { type: 'fixed', width: 1.2, height: 1.0, wall: 'back', positionRatio: 0.8 },
      ],
      doors: [
        { type: 'sliding', width: 1.2, height: 2.1, wall: 'front', positionRatio: 0.15 },
      ],
      columns: [],
      partitions: [
        { wall: 'left', positionRatio: 0.6, width: 2.0, height: 1.8 },
      ],
      outlets: [
        { wall: 'back', positionRatio: 0.1 },
        { wall: 'back', positionRatio: 0.35 },
        { wall: 'back', positionRatio: 0.65 },
        { wall: 'back', positionRatio: 0.9 },
        { wall: 'left', positionRatio: 0.2 },
        { wall: 'right', positionRatio: 0.3 },
        { wall: 'right', positionRatio: 0.7 },
      ],
      ceilingLights: [
        { type: 'panel', xRatio: 0.25, zRatio: 0.3 },
        { type: 'panel', xRatio: 0.75, zRatio: 0.3 },
        { type: 'panel', xRatio: 0.25, zRatio: 0.7 },
        { type: 'panel', xRatio: 0.75, zRatio: 0.7 },
        { type: 'spot', xRatio: 0.5, zRatio: 0.15 },
        { type: 'spot', xRatio: 0.5, zRatio: 0.85 },
      ],
    },
  },
  {
    id: 'house', name: '하우스', description: '주거 공간 (5m × 4m)', icon: Home,
    dimensions: { width: 5000, height: 4000 }, color: 'hsl(160, 35%, 50%)',
    archConfig: {
      windows: [
        { type: 'sliding', width: 1.8, height: 1.5, wall: 'back', positionRatio: 0.5 },
        { type: 'single', width: 0.8, height: 1.0, wall: 'right', positionRatio: 0.3 },
      ],
      doors: [
        { type: 'swing', width: 0.9, height: 2.1, wall: 'left', positionRatio: 0.8 },
      ],
      columns: [],
      partitions: [],
      outlets: [
        { wall: 'back', positionRatio: 0.15 },
        { wall: 'back', positionRatio: 0.85 },
        { wall: 'right', positionRatio: 0.7 },
        { wall: 'left', positionRatio: 0.3 },
      ],
      ceilingLights: [
        { type: 'pendant', xRatio: 0.5, zRatio: 0.4 },
        { type: 'spot', xRatio: 0.15, zRatio: 0.15 },
        { type: 'spot', xRatio: 0.85, zRatio: 0.85 },
      ],
    },
  },
];

// Mini 2D preview of a template's architectural config
function TemplatePreview({ template }: { template: SpaceTemplate }) {
  const w = 120;
  const h = (template.dimensions.height / template.dimensions.width) * w;
  const sx = w / template.dimensions.width;
  const sy = h / template.dimensions.height;

  return (
    <div className="relative mx-auto mt-2 mb-1 border-2 border-white/20 rounded bg-white/5" style={{ width: w, height: h }}>
      {/* Windows */}
      {template.archConfig.windows.map((win, i) => {
        const wpx = win.width * 1000 * sx;
        const isH = win.wall === 'back' || win.wall === 'front';
        const pos = win.positionRatio * (isH ? w : h) - wpx / 2;
        return (
          <div key={`w${i}`} className="absolute bg-sky-400/80" style={{
            ...(win.wall === 'back' ? { left: pos, top: 0, width: wpx, height: 3 } : {}),
            ...(win.wall === 'front' ? { left: pos, bottom: 0, width: wpx, height: 3 } : {}),
            ...(win.wall === 'left' ? { left: 0, top: pos, width: 3, height: wpx } : {}),
            ...(win.wall === 'right' ? { right: 0, top: pos, width: 3, height: wpx } : {}),
          }} />
        );
      })}
      {/* Doors */}
      {template.archConfig.doors.map((door, i) => {
        const dpx = door.width * 1000 * sx;
        const isH = door.wall === 'back' || door.wall === 'front';
        const pos = door.positionRatio * (isH ? w : h) - dpx / 2;
        return (
          <div key={`d${i}`} className="absolute bg-amber-400/80" style={{
            ...(door.wall === 'back' ? { left: pos, top: 0, width: dpx, height: 4 } : {}),
            ...(door.wall === 'front' ? { left: pos, bottom: 0, width: dpx, height: 4 } : {}),
            ...(door.wall === 'left' ? { left: 0, top: pos, width: 4, height: dpx } : {}),
            ...(door.wall === 'right' ? { right: 0, top: pos, width: 4, height: dpx } : {}),
          }} />
        );
      })}
      {/* Columns */}
      {template.archConfig.columns.map((col, i) => {
        const isH = col.wall === 'back' || col.wall === 'front';
        const pos = col.positionRatio * (isH ? w : h);
        return (
          <div key={`c${i}`} className="absolute w-3 h-3 rounded-full bg-stone-400/80" style={{
            ...(col.wall === 'back' ? { left: pos - 1.5, top: -1 } : {}),
            ...(col.wall === 'front' ? { left: pos - 1.5, bottom: -1 } : {}),
            ...(col.wall === 'left' ? { left: -1, top: pos - 1.5 } : {}),
            ...(col.wall === 'right' ? { right: -1, top: pos - 1.5 } : {}),
          }} />
        );
      })}
      {/* Partitions */}
      {template.archConfig.partitions.map((part, i) => {
        const ppx = part.width * 1000 * sx;
        const isH = part.wall === 'back' || part.wall === 'front';
        const pos = part.positionRatio * (isH ? w : h) - ppx / 2;
        return (
          <div key={`p${i}`} className="absolute bg-stone-500/60" style={{
            ...(part.wall === 'back' ? { left: pos, top: 0, width: ppx, height: 3 } : {}),
            ...(part.wall === 'front' ? { left: pos, bottom: 0, width: ppx, height: 3 } : {}),
            ...(part.wall === 'left' ? { left: 0, top: pos, width: 3, height: ppx } : {}),
            ...(part.wall === 'right' ? { right: 0, top: pos, width: 3, height: ppx } : {}),
          }} />
        );
      })}
      {/* Lights */}
      {template.archConfig.ceilingLights.map((light, i) => (
        <div key={`l${i}`} className="absolute w-2 h-2 rounded-full bg-yellow-300/80" style={{
          left: light.xRatio * w - 1,
          top: light.zRatio * h - 1,
        }} />
      ))}
      {/* Outlets */}
      {template.archConfig.outlets.map((out, i) => {
        const isH = out.wall === 'back' || out.wall === 'front';
        const pos = out.positionRatio * (isH ? w : h);
        return (
          <div key={`o${i}`} className="absolute w-1.5 h-1.5 bg-yellow-500/80" style={{
            ...(out.wall === 'back' ? { left: pos - 0.75, top: 0 } : {}),
            ...(out.wall === 'front' ? { left: pos - 0.75, bottom: 0 } : {}),
            ...(out.wall === 'left' ? { left: 0, top: pos - 0.75 } : {}),
            ...(out.wall === 'right' ? { right: 0, top: pos - 0.75 } : {}),
          }} />
        );
      })}
    </div>
  );
}

interface PlannerStartScreenProps {
  onStart: (mode: 'template' | 'free', dimensions?: RoomDimensions, archConfig?: ArchitecturalConfig) => void;
}

export const PlannerStartScreen = ({ onStart }: PlannerStartScreenProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customW, setCustomW] = useState(5);
  const [customH, setCustomH] = useState(4);
  const [tab, setTab] = useState<'template' | 'free'>('template');

  const handleTemplateStart = () => {
    const tmpl = TEMPLATES.find(t => t.id === selectedTemplate);
    if (tmpl) onStart('template', tmpl.dimensions, tmpl.archConfig);
  };

  const handleFreeStart = () => {
    onStart('free', { width: customW * 1000, height: customH * 1000 });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0A1931]">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between shrink-0 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={ggiLogo} alt="GGI" className="h-8" />
        </Link>
        <span className="text-white/40 text-xs tracking-widest uppercase">3D Interior</span>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-3">
              GGI 3D 인테리어
            </h1>
            <p className="text-white/50 text-sm">
              공간을 선택하고 가구를 배치하여 나만의 인테리어를 완성하세요
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setTab('template')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  tab === 'template'
                    ? 'bg-white text-[#0A1931] shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building2 className="h-4 w-4" />
                공간 템플릿
              </button>
              <button
                onClick={() => setTab('free')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  tab === 'free'
                    ? 'bg-white text-[#0A1931] shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <PenTool className="h-4 w-4" />
                자유 설정
              </button>
            </div>
          </div>

          {/* Template Grid */}
          {tab === 'template' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isActive = selectedTemplate === tmpl.id;
                  const summary = [
                    `창문 ${tmpl.archConfig.windows.length}`,
                    `문 ${tmpl.archConfig.doors.length}`,
                    tmpl.archConfig.columns.length > 0 ? `기둥 ${tmpl.archConfig.columns.length}` : '',
                    tmpl.archConfig.partitions.length > 0 ? `파티션 ${tmpl.archConfig.partitions.length}` : '',
                    `조명 ${tmpl.archConfig.ceilingLights.length}`,
                  ].filter(Boolean).join(' · ');

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`group relative p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                        isActive
                          ? 'border-white bg-white/15 scale-[1.03]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1 transition-colors ${
                          isActive ? 'bg-white/20' : 'bg-white/10'
                        }`}
                        style={{ backgroundColor: isActive ? tmpl.color + '40' : undefined }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-white font-bold text-sm">{tmpl.name}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">{tmpl.description}</p>
                      
                      {/* Mini floor plan preview */}
                      <TemplatePreview template={tmpl} />
                      
                      <p className="text-white/30 text-[8px] mt-1 leading-tight">{summary}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  disabled={!selectedTemplate}
                  onClick={handleTemplateStart}
                  className="bg-white text-[#0A1931] hover:bg-white/90 font-bold px-10 gap-2 rounded-xl shadow-xl disabled:opacity-30"
                >
                  시작하기
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Free Mode */}
          {tab === 'free' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-white/60 text-sm mb-6 text-center">
                  공간의 가로·세로 크기를 미터(m) 단위로 입력하세요
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-white/70 text-sm font-medium w-12">가로</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      step={0.5}
                      value={customW}
                      onChange={(e) => setCustomW(parseFloat(e.target.value) || 1)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/50"
                    />
                    <span className="text-white/40 text-sm w-6">m</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-white/70 text-sm font-medium w-12">세로</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      step={0.5}
                      value={customH}
                      onChange={(e) => setCustomH(parseFloat(e.target.value) || 1)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/50"
                    />
                    <span className="text-white/40 text-sm w-6">m</span>
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-6 flex justify-center">
                  <div
                    className="border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/30 text-xs"
                    style={{
                      width: `${Math.min(200, customW * 25)}px`,
                      height: `${Math.min(160, customH * 25)}px`,
                    }}
                  >
                    {customW}m × {customH}m
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleFreeStart}
                  className="bg-white text-[#0A1931] hover:bg-white/90 font-bold px-10 gap-2 rounded-xl shadow-xl"
                >
                  시작하기
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer badges */}
      <div className="h-10 flex items-center justify-center gap-6 text-xs text-white/30 border-t border-white/5">
        <span>✅ 여성기업 인증</span>
        <span>🏛️ 나라장터 조달 등록</span>
        <span>📋 GGI 3D 인테리어</span>
      </div>
    </div>
  );
};
