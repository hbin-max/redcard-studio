import React from 'react';
import type { CardModel } from '../types';
import { THEMES } from '../themes';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Star, 
  ShieldCheck, 
  Heart, 
  MessageSquare,
  RefreshCw,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Quote,
  Activity,
  Check
} from 'lucide-react';

interface CardViewProps {
  card: CardModel;
  index: number;
  total: number;
  isEditable?: boolean;
  onUpdateCard?: (updated: CardModel) => void;
  onRegenerateCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onDuplicateCard?: (cardId: string) => void;
  onMoveCard?: (cardId: string, direction: 'prev' | 'next') => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  index,
  total,
  isEditable = false,
  onUpdateCard,
  onRegenerateCard,
  onDeleteCard,
  onDuplicateCard,
  onMoveCard
}) => {
  const theme = THEMES[card.theme] || THEMES.rose;

  const handleTextChange = (field: string, value: string) => {
    if (!onUpdateCard) return;
    onUpdateCard({
      ...card,
      [field]: value
    });
  };

  // 纯 SVG 动态五维雷达图数学计算 (中心点 120, 110, 半径 75)
  const renderRadarSvg = (axes: { label: string; value: number }[]) => {
    const cx = 120;
    const cy = 110;
    const radius = 75;
    const count = axes.length || 5;

    // 辅助网格同心圆环
    const gridLevels = [0.25, 0.5, 0.75, 1];

    const getCoord = (angleIdx: number, valNorm: number) => {
      const angle = (Math.PI * 2 * angleIdx) / count - Math.PI / 2;
      return {
        x: cx + radius * valNorm * Math.cos(angle),
        y: cy + radius * valNorm * Math.sin(angle)
      };
    };

    // 多边形顶点连线
    const dataPoints = axes.map((ax, i) => getCoord(i, Math.min(Math.max(ax.value / 100, 0.1), 1)));
    const polygonPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <svg viewBox="0 0 240 220" className="w-full max-w-[230px] h-auto mx-auto overflow-visible select-none">
        {/* 背景同心网格 */}
        {gridLevels.map((lvl, gIdx) => {
          const gridPoints = Array.from({ length: count }).map((_, i) => getCoord(i, lvl));
          return (
            <polygon
              key={gIdx}
              points={gridPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={gIdx === gridLevels.length - 1 ? theme.primaryLight : 'none'}
              fillOpacity={0.25}
              stroke={theme.border}
              strokeWidth="1"
              strokeDasharray={gIdx < gridLevels.length - 1 ? '3 3' : 'none'}
            />
          );
        })}

        {/* 轴线 */}
        {axes.map((_, i) => {
          const pt = getCoord(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={theme.border} strokeWidth="1" />;
        })}

        {/* 实际评分多边形 */}
        <polygon
          points={polygonPath}
          fill={theme.primary}
          fillOpacity={0.35}
          stroke={theme.primary}
          strokeWidth="2.5"
        />

        {/* 顶点数据指示圆圈与标签 */}
        {axes.map((ax, i) => {
          const pt = dataPoints[i];
          const labelPt = getCoord(i, 1.25);
          return (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4" fill={theme.primary} stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="bold"
                fill={theme.text}
              >
                {ax.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      id={`redcard-${card.id}`}
      className="aspect-redbook w-full relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl shadow-xl overflow-hidden select-none transition-all duration-300 group"
      style={{
        backgroundColor: theme.bgCard,
        border: `1.5px solid ${theme.border}`,
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.12)',
        color: theme.text,
      }}
    >
      {/* 顶部背景装饰微渐变 */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-40"
        style={{
          background: `linear-gradient(180deg, ${theme.primaryLight} 0%, transparent 100%)`
        }}
      />

      {/* ===== 浮动卡片管理工具条 (Deck Orchestrator Bar - 仅悬浮时可见) ===== */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl border border-slate-700 text-xs">
        {onMoveCard && (
          <>
            <button
              onClick={() => onMoveCard(card.id, 'prev')}
              disabled={index === 0}
              title="卡片前移"
              className="p-1 hover:text-red-400 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveCard(card.id, 'next')}
              disabled={index === total - 1}
              title="卡片后移"
              className="p-1 hover:text-red-400 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-700" />
          </>
        )}

        {onRegenerateCard && (
          <button
            onClick={() => onRegenerateCard(card.id)}
            title="仅重新生成本页"
            className="flex items-center gap-1 hover:text-red-400 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-[11px]">局部重生</span>
          </button>
        )}

        {onDuplicateCard && (
          <button
            onClick={() => onDuplicateCard(card.id)}
            title="复制本页"
            className="p-1 hover:text-red-400 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        {onDeleteCard && total > 1 && (
          <button
            onClick={() => onDeleteCard(card.id)}
            title="删除本页"
            className="p-1 hover:text-red-500 text-slate-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ===== 顶部导航栏 (Top Bar) ===== */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 focus:outline-none"
          style={{
            backgroundColor: theme.tagBg,
            color: theme.tagText,
            border: `1px solid ${theme.border}`
          }}
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange('badge', e.currentTarget.textContent || '')}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
          {card.badge}
        </span>

        <div
          className="px-3 py-1 rounded-full text-xs font-black tracking-widest"
          style={{
            backgroundColor: theme.primaryLight,
            color: theme.primary
          }}
        >
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      {/* ===== 核心卡片内容区 ===== */}
      <div className="relative z-10 flex-1 flex flex-col justify-center my-auto overflow-hidden">
        {/* 1. 封面卡 (Cover) */}
        {card.type === 'cover' && (
          <div className="flex flex-col h-full justify-between py-2">
            <div>
              <div
                className="inline-block text-xs font-black tracking-widest px-2.5 py-0.5 rounded mb-3"
                style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
              >
                SPECIAL REPORT
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black leading-tight tracking-tight mb-3 focus:outline-none"
                style={{ color: theme.text }}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
              >
                {card.title}
              </h2>
              {card.subtitle && (
                <div
                  className="text-xs sm:text-sm font-medium leading-relaxed pl-3 border-l-4 focus:outline-none"
                  style={{ borderColor: theme.primary, color: theme.textLight }}
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('subtitle', e.currentTarget.textContent || '')}
                >
                  {card.subtitle}
                </div>
              )}
            </div>

            {/* 用户上传的实物参考图 (支持抠图透底展示) */}
            {card.heroImage ? (
              <div className="my-auto py-2 flex justify-center">
                <div
                  className="relative rounded-2xl overflow-hidden p-1.5 shadow-lg max-h-48 w-full max-w-[260px] flex items-center justify-center transition-transform hover:scale-102"
                  style={{ backgroundColor: theme.primaryLight, border: `1.5px solid ${theme.border}` }}
                >
                  <img
                    src={card.heroImage}
                    alt="参考图"
                    className="max-h-44 w-auto object-contain rounded-xl drop-shadow-md"
                  />
                  <div
                    className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF' }}
                  >
                    商拍实物
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-auto py-3">
                <div
                  className="rounded-2xl p-4 flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: theme.primaryLight, border: `1px dashed ${theme.border}` }}
                >
                  <div className="text-3xl mb-1">📕</div>
                  <span className="text-xs font-bold" style={{ color: theme.primary }}>
                    小红书爆款图文推荐
                  </span>
                  <span className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                    向左滑动查阅详细测评参数与避坑清单 👉
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>
                #深度横评
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>
                #避坑指南
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: theme.bg, color: theme.textMuted }}>
                #买前必看
              </span>
            </div>
          </div>
        )}

        {/* 2. 五维雷达图卡 (Radar - 新垂类模板) */}
        {card.type === 'radar' && card.radar && (
          <div className="flex flex-col h-full justify-between py-1">
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-xl sm:text-2xl font-black leading-snug focus:outline-none"
                style={{ color: theme.text }}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
              >
                {card.title}
              </h3>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl shadow-sm text-xs font-black"
                style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{card.radar.score} 分</span>
              </div>
            </div>

            {/* 动态 SVG 雷达图 */}
            <div className="my-auto py-1">
              {renderRadarSvg(card.radar.axes)}
            </div>

            {/* 结论速览 */}
            <div
              className="rounded-xl p-3 border text-xs font-medium leading-relaxed"
              style={{ backgroundColor: theme.primaryLight, borderColor: theme.border, color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
            >
              <span className="font-bold block mb-0.5" style={{ color: theme.primary }}>💡 综合表现诊断：</span>
              {card.radar.summary}
            </div>
          </div>
        )}

        {/* 3. 美妆成分分析卡 (Ingredient - 新垂类模板) */}
        {card.type === 'ingredient' && card.ingredient && (
          <div className="flex flex-col h-full justify-between py-1">
            <h3
              className="text-xl sm:text-2xl font-black mb-2 leading-snug focus:outline-none"
              style={{ color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
            >
              {card.title}
            </h3>

            {/* 适用肤质 */}
            <div
              className="rounded-lg p-2 mb-2 text-xs font-semibold flex items-center gap-2 border"
              style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
            >
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: theme.primary }}>
                适用建议
              </span>
              <span className="text-[11px] truncate">{card.ingredient.targetSkin}</span>
            </div>

            {/* 成分列表 */}
            <div className="space-y-1.5 mb-2 flex-1 flex flex-col justify-center">
              {card.ingredient.items.map((ing, iIdx) => (
                <div
                  key={iIdx}
                  className="rounded-xl p-2.5 border flex items-center justify-between text-xs"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      ing.safety === 'safe' ? 'bg-emerald-500' : ing.safety === 'caution' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <div>
                      <div className="font-bold text-xs" style={{ color: theme.text }} contentEditable={isEditable} suppressContentEditableWarning>
                        {ing.name}
                      </div>
                      <div className="text-[10px]" style={{ color: theme.textMuted }} contentEditable={isEditable} suppressContentEditableWarning>
                        {ing.role}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: ing.safety === 'safe' ? '#ECFDF5' : ing.safety === 'caution' ? '#FEF3C7' : '#FFE4E6',
                      color: ing.safety === 'safe' ? '#047857' : ing.safety === 'caution' ? '#B45309' : '#BE123C'
                    }}
                  >
                    {ing.safety === 'safe' ? '安全有效' : ing.safety === 'caution' ? '注意耐受' : '致敏慎入'}
                  </span>
                </div>
              ))}
            </div>

            {/* 结论 */}
            <div
              className="text-[11px] p-2 rounded-lg font-medium"
              style={{ backgroundColor: theme.primaryLight, color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
            >
              <span className="font-bold" style={{ color: theme.primary }}>配方结论：</span>
              {card.ingredient.verdict}
            </div>
          </div>
        )}

        {/* 4. 读书思维金句卡 (Quote - 新垂类模板) */}
        {card.type === 'quote' && card.quote && (
          <div className="flex flex-col h-full justify-between py-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100" style={{ color: theme.primary }}>
                📖 《{card.quote.bookTitle}》
              </span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>@{card.quote.author}</span>
            </div>

            {/* 大字金句 */}
            <div
              className="my-auto py-3 px-4 rounded-2xl relative border shadow-sm"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <Quote className="w-8 h-8 opacity-20 absolute top-2 left-2" style={{ color: theme.primary }} />
              <p
                className="text-base sm:text-lg font-serif italic font-bold leading-relaxed relative z-10 text-center my-2"
                style={{ color: theme.text }}
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                {card.quote.goldenQuote}
              </p>
            </div>

            {/* 三层认知递进拆解 */}
            <div className="space-y-1.5 pt-2">
              {card.quote.threeLevels.map((lvl, lIdx) => (
                <div
                  key={lIdx}
                  className="rounded-xl p-2.5 border text-xs font-medium flex items-center gap-2"
                  style={{ backgroundColor: theme.primaryLight, borderColor: theme.border, color: theme.text }}
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: theme.primary }}>
                    {lIdx + 1}
                  </span>
                  <span className="truncate">{lvl}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. 对比卡 (Comparison) */}
        {card.type === 'comparison' && card.comparison && (
          <div className="flex flex-col h-full justify-between py-1">
            <h3
              className="text-xl sm:text-2xl font-black mb-3 leading-snug focus:outline-none"
              style={{ color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
            >
              {card.title}
            </h3>

            {/* 对比表格 */}
            <div
              className="rounded-xl overflow-hidden shadow-sm"
              style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}
            >
              <div className="grid grid-cols-3 text-xs font-black py-2.5 px-3 border-b" style={{ borderColor: theme.border, backgroundColor: theme.primaryLight }}>
                <span className="text-slate-400">对比维度</span>
                <span className="text-center truncate focus:outline-none" style={{ color: theme.primary }} contentEditable={isEditable} suppressContentEditableWarning>
                  {card.comparison.colA}
                </span>
                <span className="text-center truncate focus:outline-none" style={{ color: theme.textLight }} contentEditable={isEditable} suppressContentEditableWarning>
                  {card.comparison.colB}
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: theme.border }}>
                {card.comparison.rows.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-3 text-xs py-2 px-3 items-center">
                    <span className="font-bold truncate text-[11px] focus:outline-none" style={{ color: theme.textMuted }} contentEditable={isEditable} suppressContentEditableWarning>
                      {row.metric}
                    </span>
                    <span
                      className={`text-center font-medium text-[11px] px-1 rounded truncate focus:outline-none ${row.highlight === 'A' ? 'font-bold' : ''}`}
                      style={{
                        color: row.highlight === 'A' ? theme.primary : theme.text,
                        backgroundColor: row.highlight === 'A' ? theme.tagBg : 'transparent'
                      }}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                    >
                      {row.valA}
                    </span>
                    <span
                      className={`text-center font-medium text-[11px] px-1 rounded truncate focus:outline-none ${row.highlight === 'B' ? 'font-bold' : ''}`}
                      style={{
                        color: row.highlight === 'B' ? theme.primary : theme.textLight,
                        backgroundColor: row.highlight === 'B' ? theme.tagBg : 'transparent'
                      }}
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                    >
                      {row.valB}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] mt-2 flex items-center justify-between text-slate-400 font-medium px-1">
              <span>注：数据来源于自费实测综合统计</span>
              <span className="font-bold" style={{ color: theme.primary }}>高亮项更胜一筹 ✓</span>
            </div>
          </div>
        )}

        {/* 6. 细节拆解卡 (Detail) */}
        {card.type === 'detail' && card.detail && (
          <div className="flex flex-col h-full justify-between py-1">
            <h3
              className="text-xl sm:text-2xl font-black mb-3 leading-snug focus:outline-none"
              style={{ color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
            >
              {card.title}
            </h3>

            {/* 提示警示框 (Alert) */}
            {card.detail.alert && (
              <div
                className="rounded-xl p-3 mb-3 flex items-start gap-2.5 text-xs font-semibold focus:outline-none"
                style={{
                  backgroundColor: card.detail.alert.type === 'warning' ? '#FEF2F2' : theme.primaryLight,
                  border: `1px solid ${card.detail.alert.type === 'warning' ? '#FCA5A5' : theme.border}`,
                  color: card.detail.alert.type === 'warning' ? '#B91C1C' : theme.primary
                }}
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                {card.detail.alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                ) : (
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.primary }} />
                )}
                <span className="leading-relaxed">{card.detail.alert.text}</span>
              </div>
            )}

            {/* 3大要点分栏 */}
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {card.detail.points.map((pt, pIdx) => (
                <div
                  key={pIdx}
                  className="rounded-xl p-2.5 transition-colors"
                  style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
                    >
                      {pt.tag}
                    </span>
                    <span className="text-xs font-bold truncate focus:outline-none" style={{ color: theme.text }} contentEditable={isEditable} suppressContentEditableWarning>
                      {pt.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-2 focus:outline-none" style={{ color: theme.textLight }} contentEditable={isEditable} suppressContentEditableWarning>
                    {pt.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. 选购决策红黑榜 (Verdict) */}
        {card.type === 'verdict' && card.verdict && (
          <div className="flex flex-col h-full justify-between py-1">
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-xl sm:text-2xl font-black leading-snug focus:outline-none"
                style={{ color: theme.text }}
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
              >
                {card.title}
              </h3>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl shadow-sm text-xs font-black"
                style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{card.verdict.overallScore} 分</span>
              </div>
            </div>

            {/* 红黑榜并列 */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="rounded-xl p-2.5 bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1 mb-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 推荐亮点
                </span>
                <ul className="text-[10px] space-y-1 text-emerald-900 font-medium">
                  {card.verdict.pros.map((p, idx) => (
                    <li key={idx} className="truncate focus:outline-none" contentEditable={isEditable} suppressContentEditableWarning>• {p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl p-2.5 bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] font-black text-rose-700 flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> 劝退短板
                </span>
                <ul className="text-[10px] space-y-1 text-rose-900 font-medium">
                  {card.verdict.cons.map((c, idx) => (
                    <li key={idx} className="truncate focus:outline-none" contentEditable={isEditable} suppressContentEditableWarning>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 人群推荐清单 */}
            <div className="space-y-1.5 text-[11px]">
              <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 flex items-start gap-1.5">
                <span className="font-bold text-slate-800 shrink-0">🎯 闭眼入：</span>
                <span className="text-slate-600 font-medium line-clamp-1 focus:outline-none" contentEditable={isEditable} suppressContentEditableWarning>{card.verdict.recommendWho}</span>
              </div>
              <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 flex items-start gap-1.5">
                <span className="font-bold text-rose-600 shrink-0">🚫 劝退组：</span>
                <span className="text-slate-600 font-medium line-clamp-1 focus:outline-none" contentEditable={isEditable} suppressContentEditableWarning>{card.verdict.avoidWho}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. 总结结语互动卡 (Outro) */}
        {card.type === 'outro' && card.outro && (
          <div className="flex flex-col h-full justify-between py-1">
            <h3
              className="text-xl sm:text-2xl font-black mb-2 leading-snug focus:outline-none"
              style={{ color: theme.text }}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('title', e.currentTarget.textContent || '')}
            >
              {card.title}
            </h3>

            {/* 行动清单 */}
            <div
              className="rounded-xl p-3 space-y-2 mb-3"
              style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
            >
              <span className="text-xs font-bold block" style={{ color: theme.primary }}>
                📌 课代表终极提醒：
              </span>
              {card.outro.checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-medium" style={{ color: theme.text }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5" style={{ backgroundColor: theme.primary }}>
                    {idx + 1}
                  </span>
                  <span className="leading-tight focus:outline-none" contentEditable={isEditable} suppressContentEditableWarning>{item}</span>
                </div>
              ))}
            </div>

            {/* 互动提问与 CTA */}
            <div
              className="rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm"
              style={{ backgroundColor: theme.primaryLight, border: `1px solid ${theme.border}` }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1" style={{ color: theme.primary }}>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>讨论互动</span>
              </div>
              <p className="text-[11px] font-semibold mb-2 focus:outline-none" style={{ color: theme.text }} contentEditable={isEditable} suppressContentEditableWarning>
                {card.outro.interactionQuestion}
              </p>
              <div
                className="text-[11px] font-bold px-3 py-1 rounded-full text-white shadow-sm flex items-center gap-1 focus:outline-none"
                style={{ backgroundColor: theme.primary }}
                contentEditable={isEditable}
                suppressContentEditableWarning
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>{card.outro.ctaText}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 底部署名与水印栏 (Bottom Bar) ===== */}
      <div
        className="relative z-10 flex items-center justify-between pt-3 border-t text-[11px] font-medium mt-auto"
        style={{ borderColor: theme.border, color: theme.textMuted }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span className="font-bold focus:outline-none" style={{ color: theme.textLight }} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange('footerAuthor', e.currentTarget.textContent || '')}>
            {card.footerAuthor || '@测评研究所'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] tracking-wide">
          <span>小红书·爆款卡片</span>
        </div>
      </div>
    </div>
  );
};
