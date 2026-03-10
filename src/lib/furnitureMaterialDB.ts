/**
 * 가구 소재/부품/색상 데이터베이스
 * Permax 가구부품 카탈로그 기반 + 사무/교육용 표준 색상 라이브러리
 */

// ==========================================
// 목재 소재 상세 분류
// ==========================================
export const WOOD_SUBTYPES = [
  { id: 'pb-15t', name: 'PB (파티클보드) 15T', thickness: 15, description: '일반 사무가구용 파티클보드', roughness: 0.6, metalness: 0 },
  { id: 'pb-18t', name: 'PB (파티클보드) 18T', thickness: 18, description: '내구성 강화 파티클보드', roughness: 0.6, metalness: 0 },
  { id: 'pb-25t', name: 'PB (파티클보드) 25T', thickness: 25, description: '두께감 있는 상판용', roughness: 0.55, metalness: 0 },
  { id: 'mdf-12t', name: 'MDF 12T', thickness: 12, description: '선반/뒷판용 MDF', roughness: 0.5, metalness: 0 },
  { id: 'mdf-15t', name: 'MDF 15T', thickness: 15, description: '일반 MDF', roughness: 0.5, metalness: 0 },
  { id: 'mdf-18t', name: 'MDF 18T', thickness: 18, description: '가구 본체용 MDF', roughness: 0.5, metalness: 0 },
  { id: 'birch-15t', name: '자작나무 합판 15T', thickness: 15, description: '교육용 가구 기본소재', roughness: 0.55, metalness: 0 },
  { id: 'birch-18t', name: '자작나무 합판 18T', thickness: 18, description: '내구성 자작나무 합판', roughness: 0.55, metalness: 0 },
  { id: 'veneer', name: '무늬목 (베니어)', thickness: 0.6, description: '천연 나무결 표면재', roughness: 0.45, metalness: 0 },
  { id: 'solid-oak', name: '참나무 원목', thickness: 20, description: '프리미엄 원목', roughness: 0.5, metalness: 0 },
  { id: 'solid-walnut', name: '월넛 원목', thickness: 20, description: '고급 월넛 원목', roughness: 0.45, metalness: 0 },
  { id: 'melamine', name: '멜라민 코팅', thickness: 0.3, description: '멜라민 시트 코팅 PB/MDF', roughness: 0.4, metalness: 0.05 },
  { id: 'hpl', name: 'HPL (High Pressure Laminate)', thickness: 1, description: '고압 적층 합판', roughness: 0.35, metalness: 0.05 },
  { id: 'lpм', name: 'LPM (Low Pressure Melamine)', thickness: 0.2, description: '저압 멜라민 표면재', roughness: 0.4, metalness: 0.03 },
] as const;

// ==========================================
// 철재/금속 부품 (퍼맥스 벤치마킹)
// ==========================================
export const METAL_PARTS = {
  legs: [
    { id: 'square-leg-25', name: '사각파이프 다리 25×25', size: '25×25mm', material: 'steel', finish: 'powder-coated', roughness: 0.65, metalness: 0.3 },
    { id: 'square-leg-30', name: '사각파이프 다리 30×30', size: '30×30mm', material: 'steel', finish: 'powder-coated', roughness: 0.65, metalness: 0.3 },
    { id: 'square-leg-40', name: '사각파이프 다리 40×40', size: '40×40mm', material: 'steel', finish: 'powder-coated', roughness: 0.65, metalness: 0.3 },
    { id: 'square-leg-50', name: '사각파이프 다리 50×50', size: '50×50mm', material: 'steel', finish: 'powder-coated', roughness: 0.65, metalness: 0.3 },
    { id: 'round-pipe-25', name: '원형파이프 다리 Ø25', size: 'Ø25mm', material: 'steel', finish: 'chrome', roughness: 0.15, metalness: 0.95 },
    { id: 'round-pipe-32', name: '원형파이프 다리 Ø32', size: 'Ø32mm', material: 'steel', finish: 'chrome', roughness: 0.15, metalness: 0.95 },
    { id: 'round-pipe-38', name: '원형파이프 다리 Ø38', size: 'Ø38mm', material: 'steel', finish: 'chrome', roughness: 0.15, metalness: 0.95 },
    { id: 'flat-bar-leg', name: '플랫바 다리 (40×3T)', size: '40×3mm', material: 'steel', finish: 'powder-coated', roughness: 0.6, metalness: 0.4 },
    { id: 'tapered-wood', name: '원목 테이퍼드 다리', size: 'Ø45~30mm', material: 'wood', finish: 'lacquer', roughness: 0.45, metalness: 0 },
    { id: 'aluminum-leg', name: '알루미늄 다리', size: '50×50mm', material: 'aluminum', finish: 'anodized', roughness: 0.3, metalness: 0.8 },
  ],
  frames: [
    { id: 'steel-frame-30', name: '스틸 프레임 30×15', size: '30×15mm', material: 'steel', description: '책상 하부 프레임', roughness: 0.65, metalness: 0.3 },
    { id: 'steel-frame-40', name: '스틸 프레임 40×20', size: '40×20mm', material: 'steel', description: '대형 책상 프레임', roughness: 0.65, metalness: 0.3 },
    { id: 't-frame', name: 'T자형 프레임', size: '60×30mm', material: 'steel', description: 'T프레임 책상 하부', roughness: 0.65, metalness: 0.3 },
    { id: 'c-channel', name: 'C형강 프레임', size: '50×25mm', material: 'steel', description: '선반/캐비닛 프레임', roughness: 0.7, metalness: 0.3 },
    { id: 'angle-bar', name: '앵글바 (L형강)', size: '30×30×3mm', material: 'steel', description: '보강용 앵글바', roughness: 0.7, metalness: 0.3 },
  ],
  hardware: [
    { id: 'caster-50', name: '캐스터 Ø50 (나일론)', size: 'Ø50mm', type: 'caster' },
    { id: 'caster-65', name: '캐스터 Ø65 (PU)', size: 'Ø65mm', type: 'caster' },
    { id: 'adj-foot-m8', name: '수평 조절발 M8', size: 'M8', type: 'adjustable-foot' },
    { id: 'adj-foot-m10', name: '수평 조절발 M10', size: 'M10', type: 'adjustable-foot' },
    { id: 'handle-bow-96', name: '활형 손잡이 96mm', size: '96mm', type: 'handle' },
    { id: 'handle-bow-128', name: '활형 손잡이 128mm', size: '128mm', type: 'handle' },
    { id: 'handle-recessed', name: '매입 손잡이', size: '120×40mm', type: 'handle' },
    { id: 'handle-edge', name: '엣지 손잡이 (무손잡이)', size: '45도 경사', type: 'handle' },
    { id: 'hinge-concealed', name: '컨실드 경첩', size: '35mm', type: 'hinge' },
    { id: 'hinge-piano', name: '피아노 경첩', size: '전장', type: 'hinge' },
    { id: 'slide-full', name: '풀익스텐션 서랍레일', size: '400mm', type: 'slide' },
    { id: 'slide-ball', name: '볼베어링 레일', size: '400mm', type: 'slide' },
    { id: 'lock-cam', name: '캠 잠금장치', size: '16mm', type: 'lock' },
    { id: 'lock-cylinder', name: '실린더 잠금장치', size: '20mm', type: 'lock' },
    { id: 'edge-abs-04', name: 'ABS 엣지밴딩 0.4T', size: '0.4mm', type: 'edge' },
    { id: 'edge-abs-1', name: 'ABS 엣지밴딩 1.0T', size: '1.0mm', type: 'edge' },
    { id: 'edge-abs-2', name: 'ABS 엣지밴딩 2.0T', size: '2.0mm', type: 'edge' },
    { id: 'edge-pvc', name: 'PVC 엣지밴딩', size: '0.5mm', type: 'edge' },
    { id: 'wire-grommet-60', name: '전선 그로밋 Ø60', size: 'Ø60mm', type: 'grommet' },
    { id: 'wire-grommet-80', name: '전선 그로밋 Ø80', size: 'Ø80mm', type: 'grommet' },
    { id: 'cable-tray', name: '케이블 트레이', size: '600mm', type: 'cable-management' },
    { id: 'modesty-panel', name: '모데스티 패널', size: '600×300mm', type: 'panel' },
  ],
  chair_parts: [
    { id: 'star-base-5', name: '5발 스타베이스 (나일론)', size: 'Ø600mm', material: 'nylon', finish: 'matte' },
    { id: 'star-base-5-al', name: '5발 스타베이스 (알루미늄)', size: 'Ø600mm', material: 'aluminum', finish: 'polished' },
    { id: 'gas-cylinder', name: '가스 실린더', size: 'Class 4', type: 'mechanism' },
    { id: 'armrest-fixed', name: '고정 팔걸이 (PP)', size: '250mm', type: 'armrest' },
    { id: 'armrest-adj', name: '조절 팔걸이 (PU패드)', size: '280mm', type: 'armrest' },
    { id: 'lumbar-support', name: '럼버서포트', size: '400mm', type: 'support' },
    { id: 'headrest', name: '헤드레스트', size: '200×150mm', type: 'headrest' },
  ],
} as const;

// ==========================================
// 사무/교육용 가구 표준 색상 라이브러리
// ==========================================
export const STANDARD_COLORS = {
  wood_tones: [
    { id: 'white', name: '화이트', hex: '#FFFFFF', gloss: 0.3 },
    { id: 'ivory', name: '아이보리', hex: '#FFFFF0', gloss: 0.25 },
    { id: 'light-maple', name: '라이트 메이플', hex: '#E8D5A3', gloss: 0.3 },
    { id: 'maple', name: '메이플', hex: '#D4A96A', gloss: 0.35 },
    { id: 'natural-birch', name: '자작나무 내추럴', hex: '#D9C8A0', gloss: 0.3 },
    { id: 'beech', name: '비치 (너도밤나무)', hex: '#C9A96E', gloss: 0.35 },
    { id: 'mang-pearl-beech', name: '망펄비치', hex: '#C4A882', gloss: 0.4 },
    { id: 'oak', name: '오크', hex: '#B8945F', gloss: 0.35 },
    { id: 'cherry', name: '체리', hex: '#9B4722', gloss: 0.4 },
    { id: 'walnut', name: '월넛', hex: '#5C3A1E', gloss: 0.4 },
    { id: 'mahogany', name: '마호가니', hex: '#4E2728', gloss: 0.45 },
    { id: 'wenge', name: '웬지', hex: '#3C2415', gloss: 0.35 },
    { id: 'dark-brown', name: '다크 브라운', hex: '#3B2314', gloss: 0.3 },
    { id: 'black-wood', name: '블랙 우드', hex: '#1A1A1A', gloss: 0.3 },
  ],
  solid_colors: [
    { id: 'pure-white', name: '퓨어 화이트', hex: '#FFFFFF', gloss: 0.5 },
    { id: 'warm-white', name: '웜 화이트', hex: '#FAF5EB', gloss: 0.4 },
    { id: 'light-gray', name: '라이트 그레이', hex: '#D3D3D3', gloss: 0.3 },
    { id: 'medium-gray', name: '미디엄 그레이', hex: '#A0A0A0', gloss: 0.3 },
    { id: 'dark-gray', name: '다크 그레이', hex: '#555555', gloss: 0.3 },
    { id: 'charcoal', name: '차콜', hex: '#333333', gloss: 0.25 },
    { id: 'black', name: '블랙', hex: '#1A1A1A', gloss: 0.2 },
    { id: 'navy', name: '네이비', hex: '#1B2A4A', gloss: 0.3 },
    { id: 'olive-green', name: '올리브 그린', hex: '#4A5D23', gloss: 0.25 },
    { id: 'burgundy', name: '버건디', hex: '#6B1C2A', gloss: 0.35 },
  ],
  metal_colors: [
    { id: 'chrome', name: '크롬', hex: '#C0C0C0', gloss: 0.9, metalness: 0.95 },
    { id: 'brushed-steel', name: '브러시드 스틸', hex: '#8C8C8C', gloss: 0.5, metalness: 0.85 },
    { id: 'black-metal', name: '블랙 (분체도장)', hex: '#2A2A2A', gloss: 0.2, metalness: 0.3 },
    { id: 'white-metal', name: '화이트 (분체도장)', hex: '#F0F0F0', gloss: 0.3, metalness: 0.2 },
    { id: 'gray-metal', name: '그레이 (분체도장)', hex: '#808080', gloss: 0.25, metalness: 0.3 },
    { id: 'silver-anodized', name: '실버 아노다이징', hex: '#B8B8B8', gloss: 0.6, metalness: 0.7 },
    { id: 'gold-anodized', name: '골드 아노다이징', hex: '#D4A960', gloss: 0.65, metalness: 0.7 },
  ],
  fabric_colors: [
    { id: 'fabric-black', name: '블랙 패브릭', hex: '#2C2C2C', gloss: 0.1 },
    { id: 'fabric-charcoal', name: '차콜 패브릭', hex: '#424242', gloss: 0.1 },
    { id: 'fabric-gray', name: '그레이 패브릭', hex: '#7A7A7A', gloss: 0.1 },
    { id: 'fabric-navy', name: '네이비 패브릭', hex: '#1E2D4D', gloss: 0.1 },
    { id: 'fabric-green', name: '그린 패브릭', hex: '#2D5A2D', gloss: 0.1 },
    { id: 'fabric-burgundy', name: '버건디 패브릭', hex: '#5C1A2A', gloss: 0.1 },
    { id: 'fabric-orange', name: '오렌지 패브릭', hex: '#D4672C', gloss: 0.1 },
    { id: 'fabric-blue', name: '블루 패브릭', hex: '#2E5D9E', gloss: 0.1 },
    { id: 'mesh-black', name: '블랙 메쉬', hex: '#1A1A1A', gloss: 0.15 },
    { id: 'mesh-gray', name: '그레이 메쉬', hex: '#6B6B6B', gloss: 0.15 },
  ],
} as const;

// All standard colors flattened for easy lookup
export const ALL_STANDARD_COLORS = [
  ...STANDARD_COLORS.wood_tones.map(c => ({ ...c, category: '목재톤' })),
  ...STANDARD_COLORS.solid_colors.map(c => ({ ...c, category: '솔리드' })),
  ...STANDARD_COLORS.metal_colors.map(c => ({ ...c, category: '금속' })),
  ...STANDARD_COLORS.fabric_colors.map(c => ({ ...c, category: '패브릭' })),
];

// ==========================================
// 엣지 처리 유형
// ==========================================
export const EDGE_TREATMENTS = [
  { id: 'abs-04', name: 'ABS 0.4T', description: '기본 엣지 처리' },
  { id: 'abs-1', name: 'ABS 1.0T', description: '표준 엣지 처리' },
  { id: 'abs-2', name: 'ABS 2.0T', description: '두꺼운 엣지 처리 (프리미엄)' },
  { id: 'pvc-05', name: 'PVC 0.5T', description: 'PVC 엣지밴딩' },
  { id: 'post-form', name: '포스트포밍', description: '곡선 R 엣지 처리' },
  { id: 'bullnose', name: '불노즈 (반원형)', description: 'R형 라운드 처리' },
  { id: 'chamfer', name: '챔퍼 (사면)', description: '45도 모따기' },
  { id: 'raw', name: '무처리', description: '엣지 처리 없음' },
] as const;

// ==========================================
// 표면 처리 유형
// ==========================================
export const SURFACE_TREATMENTS = [
  { id: 'melamine-coat', name: '멜라민 시트', roughness: 0.4, metalness: 0.05, description: '기본 사무가구 표면' },
  { id: 'hpl-coat', name: 'HPL 코팅', roughness: 0.35, metalness: 0.05, description: '고내구성 표면' },
  { id: 'uv-coat', name: 'UV 코팅', roughness: 0.2, metalness: 0.1, description: '고광택 UV 도장' },
  { id: 'pu-coat', name: 'PU 도장', roughness: 0.3, metalness: 0.05, description: '폴리우레탄 도장' },
  { id: 'powder-coat', name: '분체도장', roughness: 0.65, metalness: 0.3, description: '금속 분체도장' },
  { id: 'chrome-plating', name: '크롬 도금', roughness: 0.1, metalness: 0.95, description: '크롬 도금 처리' },
  { id: 'anodizing', name: '아노다이징', roughness: 0.3, metalness: 0.8, description: '알루미늄 산화 피막' },
  { id: 'oil-finish', name: '오일 피니시', roughness: 0.55, metalness: 0, description: '원목 오일 마감' },
  { id: 'lacquer', name: '래커 도장', roughness: 0.25, metalness: 0.05, description: '래커 도장 마감' },
] as const;
