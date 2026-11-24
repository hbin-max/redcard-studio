import React, { useState } from 'react';
import type { PostCopy } from '../types';
import type { UiTheme } from '../uiThemes';
import { copyToClipboard } from '../utils/exportHelper';
import { Copy, Check, Sparkles, Hash, Edit3 } from 'lucide-react';

interface CopywritingSectionProps {
  copy: PostCopy;
  onUpdateCopy: (updated: PostCopy) => void;
  uiTheme: UiTheme;
}

export const CopywritingSection: React.FC<CopywritingSectionProps> = ({ copy, onUpdateCopy, uiTheme }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isEditingBody, setIsEditingBody] = useState(false);

  const colors = uiTheme.colors;
  const currentTitle = copy.titles[copy.selectedTitleIndex] || copy.titles[0];

  const handleCopyFull = async () => {
    const fullText = `${currentTitle}\n\n${copy.body}\n\n${copy.tags.join(' ')}`;
    const success = await copyToClipboard(fullText);
    setCopyStatus(success ? 'copied' : 'error');
    if (success) setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleTitleSelect = (index: number) => {
    onUpdateCopy({
      ...copy,
      selectedTitleIndex: index
    });
  };

  const handleBodyChange = (newBody: string) => {
    onUpdateCopy({
      ...copy,
      body: newBody
    });
  };

  return (
    <div
      className="rounded-2xl p-5 shadow-lg space-y-4 border transition-colors duration-300"
      style={{
        backgroundColor: colors.panelBg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {/* 顶部标题区 */}
      <div
        className="flex items-center justify-between pb-3 border-b transition-colors"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-2">
          <span
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: colors.accentLight, color: colors.accent }}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-sm" style={{ color: colors.text }}>小红书爆款文案</h3>
        </div>

        <button
          onClick={handleCopyFull}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition shadow-sm"
          style={{
            background: colors.btnPrimary,
            color: colors.btnPrimaryText,
          }}
        >
          {copyStatus === 'copied' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>已复制全文</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制发布文案</span>
            </>
          )}
        </button>
      </div>
      {copyStatus === 'error' && <p role="status" className="text-xs" style={{ color: colors.textSecondary }}>复制失败，可手动选中文案复制。</p>}

      {/* 1. 3套备选爆款标题选择器 */}
      <div>
        <label
          className="text-xs font-semibold mb-2 block flex items-center justify-between"
          style={{ color: colors.textSecondary }}
        >
          <span>🎯 爆款标题库 (点击切换)</span>
          <span className="text-[11px]" style={{ color: colors.textMuted }}>
            已选第 {copy.selectedTitleIndex + 1} 种
          </span>
        </label>
        <div className="space-y-2">
          {copy.titles.map((title, idx) => {
            const isSelected = copy.selectedTitleIndex === idx;
            const styleLabels = ['💥 痛点反差型', '🔬 深度测评型', '📋 干货利益型'];
            return (
              <div
                key={idx}
                onClick={() => handleTitleSelect(idx)}
                className="p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5"
                style={{
                  backgroundColor: isSelected ? colors.accentLight : colors.inputBg,
                  borderColor: isSelected ? colors.accent : colors.border,
                  color: isSelected ? colors.text : colors.textSecondary,
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span
                  className="text-[10px] shrink-0 font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: isSelected ? colors.accent : colors.borderSubtle,
                    color: isSelected ? '#FFFFFF' : colors.textMuted
                  }}
                >
                  {styleLabels[idx] || `方案 ${idx + 1}`}
                </span>
                <span className="flex-1 leading-snug">{title}</span>
                {isSelected && (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 笔记正文 */}
      <div>
        <div
          className="flex items-center justify-between text-xs font-semibold mb-1.5"
          style={{ color: colors.textSecondary }}
        >
          <span>📝 笔记正文 (已格式化排版)</span>
          <button
            onClick={() => setIsEditingBody(!isEditingBody)}
            className="flex items-center gap-1 text-[11px] hover:underline"
            style={{ color: colors.accent }}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingBody ? '完成编辑' : '直接修改'}</span>
          </button>
        </div>

        {isEditingBody ? (
          <textarea
            value={copy.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={7}
            className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans leading-relaxed resize-y"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.accent,
              borderWidth: '1px',
              color: colors.text,
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditingBody(true)}
            className="w-full rounded-xl p-3 text-xs leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap cursor-pointer transition border"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            {copy.body}
          </div>
        )}
      </div>

      {/* 3. 标签推荐 */}
      <div>
        <label
          className="text-xs font-semibold mb-2 block flex items-center gap-1"
          style={{ color: colors.textSecondary }}
        >
          <Hash className="w-3.5 h-3.5" style={{ color: colors.accent }} />
          <span>推荐热门标签 (Tags)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {copy.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textSecondary,
              }}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
