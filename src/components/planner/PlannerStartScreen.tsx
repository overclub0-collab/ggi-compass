import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, PenTool, School, Briefcase, Home, UtensilsCrossed, FlaskConical, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomDimensions } from '@/types/planner';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { Link } from 'react-router-dom';

interface SpaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  dimensions: RoomDimensions;
  color: string;
}

const TEMPLATES: SpaceTemplate[] = [
  { id: 'office', name: '사무실', description: '일반 사무 공간 (6m × 5m)', icon: Briefcase, dimensions: { width: 6000, height: 5000 }, color: 'hsl(210, 40%, 55%)' },
  { id: 'classroom', name: '교실', description: '표준 교실 (9m × 7m)', icon: School, dimensions: { width: 9000, height: 7000 }, color: 'hsl(45, 60%, 55%)' },
  { id: 'home', name: '거실', description: '가정 거실 (5m × 4m)', icon: Home, dimensions: { width: 5000, height: 4000 }, color: 'hsl(160, 35%, 50%)' },
  { id: 'dining', name: '식당', description: '단체 식당 (8m × 6m)', icon: UtensilsCrossed, dimensions: { width: 8000, height: 6000 }, color: 'hsl(25, 50%, 55%)' },
  { id: 'lab', name: '실험실', description: '과학 실험실 (8m × 6m)', icon: FlaskConical, dimensions: { width: 8000, height: 6000 }, color: 'hsl(180, 30%, 50%)' },
];

interface PlannerStartScreenProps {
  onStart: (mode: 'template' | 'free', dimensions?: RoomDimensions) => void;
}

export const PlannerStartScreen = ({ onStart }: PlannerStartScreenProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customW, setCustomW] = useState(5);
  const [customH, setCustomH] = useState(4);
  const [tab, setTab] = useState<'template' | 'free'>('template');

  const handleTemplateStart = () => {
    const tmpl = TEMPLATES.find(t => t.id === selectedTemplate);
    if (tmpl) onStart('template', tmpl.dimensions);
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
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`group relative p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                        isActive
                          ? 'border-white bg-white/15 scale-[1.03]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${
                          isActive ? 'bg-white/20' : 'bg-white/10'
                        }`}
                        style={{ backgroundColor: isActive ? tmpl.color + '40' : undefined }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-white font-bold text-sm">{tmpl.name}</p>
                      <p className="text-white/40 text-[10px] mt-1">{tmpl.description}</p>
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
