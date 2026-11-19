import React, { useRef, useState } from 'react';
import type { GenerationConfig, ReferenceImage } from '../types';
import type { UiTheme } from '../uiThemes';
import { THEMES } from '../themes';
import { removeImageBackgroundClient } from '../utils/imageMatting';
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Settings2, 
  Palette, 
  Check, 
  Layers, 
  FileText,
  UserCheck,
  Wand2
} from 'lucide-react';

interface SidebarProps {
  config: GenerationConfig;
  onChangeConfig: (newConfig: GenerationConfig) => void;
  referenceImages: ReferenceImage[];
  onAddImage: (image: ReferenceImage) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImage: (image: ReferenceImage) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  uiTheme: UiTheme;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChangeConfig,
  referenceImages,
  onAddImage,
  onRemoveImage,
  onUpdateImage,
  onGenerate,
  isGenerating,
  uiTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [isMatting, setIsMatting] = useState(false);

  const colors = uiTheme.colors;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;

        // 针对超大尺寸手机/相机原图做自适应缩放压缩，防止卡死内存
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          let finalDataUrl = rawDataUrl;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          }

          const newImg: ReferenceImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            dataUrl: finalDataUrl,
            role: 'product'
          };
          onAddImage(newImg);
          if (!config.selectedImageId) {
            onChangeConfig({ ...config, selectedImageId: newImg.id });
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发客户端智能去背景 / AI 抠图
  const handleToggleMatting = async () => {
    const selectedImg = referenceImages.find(img => img.id === config.selectedImageId);
    if (!selectedImg) return;

    if (selectedImg.isMatted) {
      // 还原原图
      onUpdateImage({
        ...selectedImg,
        isMatted: false
      });
      return;
    }

    setIsMatting(true);
    try {
      const mattedUrl = await removeImageBackgroundClient(selectedImg.dataUrl);
      onUpdateImage({
        ...selectedImg,
        isMatted: true,
        mattedDataUrl: mattedUrl
      });
    } catch (err) {
      console.error('抠图处理失败:', err);
    } finally {
      setIsMatting(false);
    }
  };

  const selectedImage = referenceImages.find(img => img.id === config.selectedImageId);

  const categories = [
    { id: 'tech', label: '📱 数码产品深度测评', desc: '参数PK、红黑榜、雷达图' },
    { id: 'skincare', label: '💄 美妆成分护肤科普', desc: '成分信号灯、肤质避坑、雷达图' },
    { id: 'knowledge', label: '💡 读书笔记/思维模型', desc: '经典金句、底层逻辑导图' },
    { id: 'review', label: '⚖️ 方案/好物对比横评', desc: '优缺点权衡、买前必看' },
    { id: 'tutorial', label: '📖 保姆级教程/步骤拆解', desc: 'Step 1-2-3 流程指南' },
  ];

  return (
    <aside
      className="w-full lg:w-96 p-5 flex flex-col justify-between overflow-y-auto space-y-5 h-full transition-colors duration-300"
      style={{
        backgroundColor: colors.sidebarBg,
        borderColor: colors.border,
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        color: colors.text,
      }}
    >
      <div className="space-y-5">
        {/* 产品 Header */}
        <div
          className="flex items-center justify-between pb-4 border-b transition-colors"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ background: colors.btnPrimary }}
            >
              📕
            </div>
            <div>
              <h1 className="font-bold text-sm flex items-center gap-1.5" style={{ color: colors.text }}>
                RedCard Studio
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: colors.accentLight, color: colors.accent }}
                >
                  v2.0
                </span>
              </h1>
              <p className="text-[11px]" style={{ color: colors.textMuted }}>小红书干货/测评图文生成器</p>
            </div>
          </div>

          <button
            onClick={() => setShowApiSettings(!showApiSettings)}
            className="p-2 rounded-xl border transition"
            style={{
              backgroundColor: showApiSettings ? colors.accentLight : colors.inputBg,
              borderColor: showApiSettings ? colors.accent : colors.border,
              color: showApiSettings ? colors.accent : colors.textSecondary,
            }}
            title="API 设置 (可选在线大模型)"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* API 展开设置面板 */}
        {showApiSettings && (
          <div
            className="p-4 rounded-xl border space-y-3 text-xs"
            style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold" style={{ color: colors.text }}>在线大模型设置 (可选)</span>
              <span className="text-[10px]" style={{ color: colors.textMuted }}>留空则使用智能离线引擎</span>
            </div>
            <div>
              <label className="text-[11px] block mb-1" style={{ color: colors.textSecondary }}>API Base URL</label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={config.apiBaseUrl || ''}
                onChange={(e) => onChangeConfig({ ...config, apiBaseUrl: e.target.value })}
                className="w-full rounded-lg p-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: colors.sidebarBg,
                  borderColor: colors.border,
                  borderWidth: '1px',
                  color: colors.text
                }}
              />
            </div>
            <div>
              <label className="text-[11px] block mb-1" style={{ color: colors.textSecondary }}>API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={config.apiKey || ''}
                onChange={(e) => onChangeConfig({ ...config, apiKey: e.target.value })}
                className="w-full rounded-lg p-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: colors.sidebarBg,
                  borderColor: colors.border,
                  borderWidth: '1px',
                  color: colors.text
                }}
              />
            </div>
            <div>
              <label className="text-[11px] block mb-1" style={{ color: colors.textSecondary }}>Model Name</label>
              <input
                type="text"
                placeholder="gpt-4o / qwen-vl-max / deepseek-chat"
                value={config.modelName || 'gpt-4o-mini'}
                onChange={(e) => onChangeConfig({ ...config, modelName: e.target.value })}
                className="w-full rounded-lg p-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: colors.sidebarBg,
                  borderColor: colors.border,
                  borderWidth: '1px',
                  color: colors.text
                }}
              />
            </div>
          </div>
        )}

        {/* 1. 上传参考图片与端侧智能抠图 */}
        <div>
          <label className="text-xs font-bold mb-2 flex items-center justify-between" style={{ color: colors.text }}>
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" style={{ color: colors.accent }} />
              参考图片物料 ({referenceImages.length})
            </span>
            <span className="text-[10px]" style={{ color: colors.textMuted }}>支持实拍/截图</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {referenceImages.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.inputBg,
              }}
            >
              <Upload className="w-6 h-6 mb-1.5 transition" style={{ color: colors.accent }} />
              <span className="text-xs font-semibold" style={{ color: colors.text }}>点击上传参考图片</span>
              <span className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>实物图将自动嵌入卡片封面</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {referenceImages.map((img) => {
                  const isSelected = config.selectedImageId === img.id;
                  const displaySrc = img.isMatted && img.mattedDataUrl ? img.mattedDataUrl : img.dataUrl;
                  return (
                    <div
                      key={img.id}
                      onClick={() => onChangeConfig({ ...config, selectedImageId: img.id })}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition"
                      style={{
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: img.isMatted ? colors.accentLight : 'transparent'
                      }}
                    >
                      <img src={displaySrc} alt={img.name} className="w-full h-full object-contain p-1" />
                      {isSelected && (
                        <div
                          className="absolute top-1 left-1 text-white rounded-full p-0.5"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      {img.isMatted && (
                        <div className="absolute bottom-1 left-1 text-[9px] bg-emerald-600/90 text-white font-bold px-1 rounded shadow">
                          已去背景
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage(img.id);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.inputBg,
                    color: colors.textSecondary
                  }}
                >
                  <Upload className="w-4 h-4 mb-1" />
                  <span className="text-[10px]">添加更多</span>
                </div>
              </div>

              {/* 智能抠图 / 去背景操作条 */}
              {selectedImage && (
                <div className="pt-1">
                  <button
                    onClick={handleToggleMatting}
                    disabled={isMatting}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition active:scale-98 shadow-sm"
                    style={{
                      backgroundColor: selectedImage.isMatted ? '#ECFDF5' : colors.inputBg,
                      borderColor: selectedImage.isMatted ? '#10B981' : colors.border,
                      color: selectedImage.isMatted ? '#047857' : colors.accent,
                    }}
                  >
                    {isMatting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>AI 端侧抠图中...</span>
                      </>
                    ) : selectedImage.isMatted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>已开启智能抠图 (点击还原)</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>✨ AI 智能抠图 / 提取透明底主体</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. 主题与需求输入 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: colors.text }}>
              <FileText className="w-3.5 h-3.5" style={{ color: colors.accent }} />
              测评/干货主题
            </label>
            <input
              type="text"
              value={config.topic}
              onChange={(e) => onChangeConfig({ ...config, topic: e.target.value })}
              placeholder="例如：iPhone 16 与 15 深度横评对比"
              className="w-full rounded-xl p-2.5 text-xs focus:outline-none"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                borderWidth: '1px',
                color: colors.text
              }}
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: colors.text }}>
              简短核心需求与补充说明
            </label>
            <textarea
              value={config.details}
              onChange={(e) => onChangeConfig({ ...config, details: e.target.value })}
              rows={3}
              placeholder="例如：侧重日常续航和发热，预算5000-7000，希望给出明确避坑建议和红黑榜"
              className="w-full rounded-xl p-2.5 text-xs focus:outline-none resize-none leading-relaxed"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                borderWidth: '1px',
                color: colors.text
              }}
            />
          </div>
        </div>

        {/* 3. 卡片分类选择器 */}
        <div>
          <label className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: colors.text }}>
            <Layers className="w-3.5 h-3.5" style={{ color: colors.accent }} />
            卡片场景分类 (5 大热门垂类)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const active = config.category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => onChangeConfig({ ...config, category: cat.id as any })}
                  className="p-2.5 rounded-xl border text-xs cursor-pointer transition"
                  style={{
                    backgroundColor: active ? colors.accentLight : colors.inputBg,
                    borderColor: active ? colors.accent : colors.border,
                    color: active ? colors.accent : colors.textSecondary
                  }}
                >
                  <div className="font-semibold" style={{ color: active ? colors.accent : colors.text }}>
                    {cat.label}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: colors.textMuted }}>
                    {cat.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 卡片模板主题配色选择 */}
        <div>
          <label className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: colors.text }}>
            <Palette className="w-3.5 h-3.5" style={{ color: colors.accent }} />
            卡片内置风格 (3:4卡片皮肤)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(THEMES).map((th) => {
              const isSelected = config.theme === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => onChangeConfig({ ...config, theme: th.id })}
                  className="p-2 rounded-xl border cursor-pointer transition flex items-center gap-2"
                  style={{
                    backgroundColor: isSelected ? colors.accentLight : colors.inputBg,
                    borderColor: isSelected ? colors.accent : colors.border,
                    color: isSelected ? colors.text : colors.textSecondary
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: th.previewColor }}
                  />
                  <span className="text-[11px] truncate font-medium">{th.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 底部作者水印设置 */}
        <div>
          <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: colors.text }}>
            <UserCheck className="w-3.5 h-3.5" style={{ color: colors.accent }} />
            作者水印署名
          </label>
          <input
            type="text"
            value={config.authorName}
            onChange={(e) => onChangeConfig({ ...config, authorName: e.target.value })}
            placeholder="例如：测评研究所"
            className="w-full rounded-xl p-2.5 text-xs focus:outline-none"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              borderWidth: '1px',
              color: colors.text
            }}
          />
        </div>
      </div>

      {/* 底部一键生成按钮 */}
      <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !config.topic.trim()}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          style={{
            background: colors.btnPrimary,
            color: colors.btnPrimaryText,
          }}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>智能编排中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>⚡ 一键生成小红书图文</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
