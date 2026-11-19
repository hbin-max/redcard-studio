import { useState, useEffect, useRef } from 'react';
import type { CardModel, CardType, GenerationConfig, PostCopy, ReferenceImage } from './types';
import { UI_THEMES, type UiTheme } from './uiThemes';
import { generateXiaohongshuContent, regenerateSingleCard, createNewCardTemplate } from './services/aiGenerator';
import { Sidebar } from './components/Sidebar';
import { CardView } from './components/CardView';
import { CopywritingSection } from './components/CopywritingSection';
import { exportAllCardsAsZip, exportCardAsPng } from './utils/exportHelper';
import { 
  Download, 
  Archive, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  SlidersHorizontal,
  Sparkles,
  Info,
  Palette,
  Check,
  Plus,
  RefreshCw,
  Layers,
  Smartphone,
  Monitor,
  Apple,
  ArrowDownToLine,
  X
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<GenerationConfig>({
    topic: 'iPhone 16 与 15 深度测评对比',
    details: '侧重日常续航、发热温控与手感，给出明确避坑建议和红黑榜清单',
    category: 'tech',
    theme: 'rose',
    cardCount: 5,
    authorName: '数码避坑研究所',
  });

  const [uiThemeKey, setUiThemeKey] = useState<string>(() => {
    return localStorage.getItem('redcard_ui_theme') || 'dark-red';
  });

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAddCardMenu, setShowAddCardMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState<'win' | 'mac' | 'mobile'>('win');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);
  const addCardMenuRef = useRef<HTMLDivElement>(null);

  const currentUiTheme: UiTheme = UI_THEMES[uiThemeKey] || UI_THEMES['dark-red'];
  const colors = currentUiTheme.colors;

  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [copy, setCopy] = useState<PostCopy | null>(null);
  const [cards, setCards] = useState<CardModel[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  useEffect(() => {
    handleGenerate();

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
      if (addCardMenuRef.current && !addCardMenuRef.current.contains(e.target as Node)) {
        setShowAddCardMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUiTheme = (key: string) => {
    setUiThemeKey(key);
    localStorage.setItem('redcard_ui_theme', key);
    setShowThemePicker(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActiveCardIndex(0);
    try {
      const result = await generateXiaohongshuContent(config, referenceImages);
      setCopy(result.copy);
      setCards(result.cards);
      setActiveCardIndex(0);
    } catch (err) {
      console.error('生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddImage = (img: ReferenceImage) => {
    setReferenceImages(prev => [...prev, img]);
  };

  const handleUpdateImage = (updated: ReferenceImage) => {
    setReferenceImages(prev => prev.map(item => item.id === updated.id ? updated : item));
    // 同步刷新封面使用的图片
    const selectedSrc = updated.isMatted && updated.mattedDataUrl ? updated.mattedDataUrl : updated.dataUrl;
    setCards(prev => prev.map((c, idx) => idx === 0 ? { ...c, heroImage: selectedSrc } : c));
  };

  const handleRemoveImage = (id: string) => {
    setReferenceImages(prev => prev.filter(item => item.id !== id));
    if (config.selectedImageId === id) {
      setConfig(prev => ({ ...prev, selectedImageId: undefined }));
    }
  };

  const handleUpdateCard = (updated: CardModel) => {
    setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  // ===== 进阶空间 2: 卡片自由编排与管理 (Deck Orchestrator) =====
  
  // 1. 新增指定类型的卡片
  const handleAddNewCard = (type: CardType) => {
    const selectedImg = referenceImages.find(img => img.id === config.selectedImageId);
    const heroImg = selectedImg ? (selectedImg.isMatted && selectedImg.mattedDataUrl ? selectedImg.mattedDataUrl : selectedImg.dataUrl) : undefined;
    const newCard = createNewCardTemplate(type, cards.length, config, heroImg);
    
    const updatedCards = [...cards, newCard].map((c, idx, arr) => ({
      ...c,
      pageNum: idx + 1,
      totalPages: arr.length
    }));
    
    setCards(updatedCards);
    setActiveCardIndex(updatedCards.length - 1);
    setShowAddCardMenu(false);
  };

  // 2. 删除卡片
  const handleDeleteCard = (cardId: string) => {
    if (cards.length <= 1) return;
    const filtered = cards.filter(c => c.id !== cardId).map((c, idx, arr) => ({
      ...c,
      pageNum: idx + 1,
      totalPages: arr.length
    }));
    setCards(filtered);
    if (activeCardIndex >= filtered.length) {
      setActiveCardIndex(filtered.length - 1);
    }
  };

  // 3. 复制卡片
  const handleDuplicateCard = (cardId: string) => {
    const targetIdx = cards.findIndex(c => c.id === cardId);
    if (targetIdx === -1) return;
    const target = cards[targetIdx];
    const cloned: CardModel = {
      ...JSON.parse(JSON.stringify(target)),
      id: `card-${target.type}-${Date.now()}`
    };
    const nextList = [...cards];
    nextList.splice(targetIdx + 1, 0, cloned);
    const renumbered = nextList.map((c, idx, arr) => ({
      ...c,
      pageNum: idx + 1,
      totalPages: arr.length
    }));
    setCards(renumbered);
    setActiveCardIndex(targetIdx + 1);
  };

  // 4. 移动卡片 (调整顺序)
  const handleMoveCard = (cardId: string, direction: 'prev' | 'next') => {
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    if (direction === 'prev' && idx === 0) return;
    if (direction === 'next' && idx === cards.length - 1) return;

    const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
    const nextList = [...cards];
    const [moved] = nextList.splice(idx, 1);
    nextList.splice(targetIdx, 0, moved);

    const renumbered = nextList.map((c, i, arr) => ({
      ...c,
      pageNum: i + 1,
      totalPages: arr.length
    }));
    setCards(renumbered);
    setActiveCardIndex(targetIdx);
  };

  // 5. 单页局部重新生成
  const handleRegenerateSingleCard = async (cardId: string) => {
    const target = cards.find(c => c.id === cardId);
    if (!target) return;
    setRegeneratingCardId(cardId);
    try {
      const refreshed = await regenerateSingleCard(target, config, referenceImages);
      setCards(prev => prev.map(c => c.id === cardId ? refreshed : c));
    } catch (err) {
      console.error('单卡重生失败:', err);
    } finally {
      setRegeneratingCardId(null);
    }
  };

  // 导出单张
  const handleExportSingle = async () => {
    if (cards.length === 0) return;
    const current = cards[activeCardIndex];
    try {
      await exportCardAsPng(current.id, `小红书卡片_P${activeCardIndex + 1}_${current.title.slice(0, 10)}`);
    } catch (err) {
      console.error('单张导出失败:', err);
    }
  };

  // 批量打包 ZIP
  const handleExportZip = async () => {
    if (cards.length === 0) return;
    setExportProgress('正在打包渲染中...');
    try {
      await exportAllCardsAsZip(cards, config.topic, (curr, total) => {
        setExportProgress(`正在渲染第 ${curr}/${total} 张高清卡片...`);
      });
    } catch (err) {
      console.error('打包下载失败:', err);
    } finally {
      setExportProgress(null);
    }
  };

  const handleConfigChange = (newConfig: GenerationConfig) => {
    setConfig(newConfig);
    if (newConfig.theme !== config.theme) {
      setCards(prev => prev.map(c => ({ ...c, theme: newConfig.theme })));
    }
    if (newConfig.authorName !== config.authorName) {
      setCards(prev => prev.map(c => ({ ...c, footerAuthor: `@${newConfig.authorName}` })));
    }
  };

  const newCardTypeOptions: { type: CardType; label: string; desc: string; icon: string }[] = [
    { type: 'radar', label: '📊 五维雷达评分卡', desc: '纯矢量多边形综合打分', icon: '📊' },
    { type: 'ingredient', label: '💄 美妆成分分析卡', desc: '活性物配比与安全信号灯', icon: '🧪' },
    { type: 'quote', label: '📖 读书思维金句卡', desc: '大字原著金句与三层认知框架', icon: '📖' },
    { type: 'comparison', label: '⚖️ 核心参数对决卡', desc: '双栏高亮PK对比表格', icon: '⚖️' },
    { type: 'detail', label: '🔍 关键细节拆解卡', desc: '警示提示框与三大避坑要点', icon: '🔍' },
    { type: 'verdict', label: '🎯 选购决策红黑榜', desc: '闭眼入 vs 劝退组对照表', icon: '🎯' },
    { type: 'outro', label: '📌 互动课代表结语卡', desc: '终极行动清单与点赞引导', icon: '📌' },
  ];

  return (
    <div
      className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden transition-colors duration-300 font-sans"
      style={{
        backgroundColor: colors.appBg,
        color: colors.text,
      }}
    >
      {/* 左侧控制栏 */}
      <Sidebar
        config={config}
        onChangeConfig={handleConfigChange}
        referenceImages={referenceImages}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onUpdateImage={handleUpdateImage}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        uiTheme={currentUiTheme}
      />

      {/* 右侧主工作区 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 顶部操作工具条 */}
        <header
          className="h-14 px-6 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors duration-300 relative z-30"
          style={{
            backgroundColor: colors.headerBg,
            borderColor: colors.border,
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: colors.text }}>
              <Sparkles className="w-4 h-4" style={{ color: colors.accent }} />
              <span>3:4 比例画布 ({cards.length} 页)</span>
            </span>

            {/* 新增卡片下拉菜单 */}
            <div className="relative" ref={addCardMenuRef}>
              <button
                onClick={() => setShowAddCardMenu(!showAddCardMenu)}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition active:scale-95 shadow-sm"
                style={{
                  backgroundColor: colors.accentLight,
                  borderColor: colors.accent,
                  color: colors.accent
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加新卡片</span>
              </button>

              {showAddCardMenu && (
                <div
                  className="absolute left-0 top-9 w-64 rounded-2xl shadow-2xl p-2 border z-50 space-y-1 backdrop-blur-lg"
                  style={{
                    backgroundColor: colors.panelBg,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <div className="text-[10px] font-bold px-2.5 py-1 text-slate-400 border-b border-slate-700/40">
                    选择要插入的卡片模板
                  </div>
                  {newCardTypeOptions.map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => handleAddNewCard(opt.type)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer hover:bg-slate-700/20 transition"
                    >
                      <span className="text-base">{opt.icon}</span>
                      <div>
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-[10px]" style={{ color: colors.textMuted }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="hidden xl:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textMuted
              }}
            >
              <Info className="w-3.5 h-3.5" />
              <span>悬浮卡片可拖拽、单页重生与删除</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 跨端下载/安装应用按钮 */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition hover:opacity-90 active:scale-95 shadow-xs"
              style={{
                backgroundColor: colors.accentLight,
                borderColor: colors.accent,
                color: colors.accent
              }}
              title="下载客户端 / 跨端安装 (Windows / Mac / 移动端)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">下载客户端 / 跨端安装</span>
            </button>

            {/* 界面配色选择器 */}
            <div className="relative" ref={themePickerRef}>
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textSecondary
                }}
              >
                <Palette className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                <span>界面配色: {currentUiTheme.name}</span>
              </button>

              {showThemePicker && (
                <div
                  className="absolute right-0 top-11 w-56 rounded-2xl shadow-2xl p-2.5 border z-50 space-y-1 backdrop-blur-lg"
                  style={{
                    backgroundColor: colors.panelBg,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <div className="text-[11px] font-bold px-2.5 py-1.5 mb-1 border-b" style={{ borderColor: colors.border, color: colors.textMuted }}>
                    切换应用界面配色方案
                  </div>
                  {Object.values(UI_THEMES).map((th) => {
                    const isSelected = th.id === uiThemeKey;
                    return (
                      <div
                        key={th.id}
                        onClick={() => handleSelectUiTheme(th.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition"
                        style={{
                          backgroundColor: isSelected ? colors.accentLight : 'transparent',
                          color: isSelected ? colors.accent : colors.text,
                          fontWeight: isSelected ? 700 : 500
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                            style={{
                              backgroundColor: th.preview,
                              borderColor: th.colors.borderSubtle
                            }}
                          />
                          <span>{th.emoji} {th.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: colors.accent }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 视图切换 */}
            <div
              className="flex items-center p-1 rounded-xl border text-xs"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}
            >
              <button
                onClick={() => setViewMode('focus')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition"
                style={{
                  backgroundColor: viewMode === 'focus' ? colors.sidebarBg : 'transparent',
                  color: viewMode === 'focus' ? colors.text : colors.textMuted,
                  fontWeight: viewMode === 'focus' ? 700 : 500,
                  boxShadow: viewMode === 'focus' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>焦点轮播</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition"
                style={{
                  backgroundColor: viewMode === 'grid' ? colors.sidebarBg : 'transparent',
                  color: viewMode === 'grid' ? colors.text : colors.textMuted,
                  fontWeight: viewMode === 'grid' ? 700 : 500,
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>平铺全览</span>
              </button>
            </div>

            {/* 单张下载 */}
            <button
              onClick={handleExportSingle}
              disabled={cards.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.textSecondary
              }}
              title="下载当前卡片高清图"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出单张</span>
            </button>

            {/* 一键打包 ZIP 下载 */}
            <button
              onClick={handleExportZip}
              disabled={cards.length === 0 || !!exportProgress}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 active:scale-95"
              style={{
                background: colors.btnPrimary,
                color: colors.btnPrimaryText,
              }}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{exportProgress || `打包 ${cards.length} 张卡片 (ZIP)`}</span>
            </button>
          </div>
        </header>

        {/* 内容展示区 */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
          {/* 左侧：3:4 卡片预览区 (占 7 列) */}
          <div
            className="xl:col-span-7 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto border-b xl:border-b-0 xl:border-r transition-colors duration-300"
            style={{
              backgroundColor: colors.previewBg,
              borderColor: colors.border
            }}
          >
            {cards.length > 0 ? (
              viewMode === 'focus' ? (
                <div className="flex flex-col items-center justify-center my-auto w-full max-w-[380px] sm:max-w-[400px]">
                  {/* 轮播主体卡片 */}
                  <div className="w-full relative group">
                    {regeneratingCardId === cards[activeCardIndex].id && (
                      <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white text-xs gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                        <span>正在局部重新生成此卡片...</span>
                      </div>
                    )}

                    <CardView
                      card={cards[activeCardIndex]}
                      index={activeCardIndex}
                      total={cards.length}
                      isEditable={true}
                      onUpdateCard={handleUpdateCard}
                      onRegenerateCard={handleRegenerateSingleCard}
                      onDeleteCard={handleDeleteCard}
                      onDuplicateCard={handleDuplicateCard}
                      onMoveCard={handleMoveCard}
                    />

                    {/* 左右翻页按钮 */}
                    {activeCardIndex > 0 && (
                      <button
                        onClick={() => setActiveCardIndex(prev => prev - 1)}
                        className="absolute -left-5 top-1/2 -translate-y-1/2 p-2 rounded-full border shadow-xl transition"
                        style={{
                          backgroundColor: colors.panelBg,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {activeCardIndex < cards.length - 1 && (
                      <button
                        onClick={() => setActiveCardIndex(prev => prev + 1)}
                        className="absolute -right-5 top-1/2 -translate-y-1/2 p-2 rounded-full border shadow-xl transition"
                        style={{
                          backgroundColor: colors.panelBg,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* 底部缩略图导航 & 快速操作 */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-full">
                    {cards.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCardIndex(idx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border shadow-xs"
                        style={{
                          backgroundColor: activeCardIndex === idx ? colors.accent : colors.inputBg,
                          color: activeCardIndex === idx ? '#FFFFFF' : colors.textSecondary,
                          borderColor: activeCardIndex === idx ? colors.accent : colors.border,
                        }}
                      >
                        <span>P{idx + 1}</span>
                        <span className="text-[10px] opacity-80">
                          {c.type === 'cover' ? '封面' : c.type === 'radar' ? '雷达' : c.type === 'ingredient' ? '成分' : c.type === 'quote' ? '金句' : c.type === 'comparison' ? '对决' : c.type === 'detail' ? '要点' : c.type === 'verdict' ? '决策' : '结语'}
                        </span>
                      </button>
                    ))}

                    <button
                      onClick={() => setShowAddCardMenu(!showAddCardMenu)}
                      className="px-2 py-1 rounded-lg text-xs font-bold border border-dashed flex items-center gap-0.5 transition hover:scale-105"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.accent,
                        color: colors.accent
                      }}
                      title="插入新卡片"
                    >
                      <Plus className="w-3 h-3" />
                      <span>加页</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 平铺全览模式 */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl pb-8">
                  {cards.map((card, idx) => (
                    <div key={card.id} className="w-full relative">
                      <CardView
                        card={card}
                        index={idx}
                        total={cards.length}
                        isEditable={true}
                        onUpdateCard={handleUpdateCard}
                        onRegenerateCard={handleRegenerateSingleCard}
                        onDeleteCard={handleDeleteCard}
                        onDuplicateCard={handleDuplicateCard}
                        onMoveCard={handleMoveCard}
                      />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center my-auto" style={{ color: colors.textMuted }}>
                <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
                <span className="text-sm">正在加载中...</span>
              </div>
            )}
          </div>

          {/* 右侧：爆款文案编辑与复制区 (占 5 列) */}
          <div
            className="xl:col-span-5 p-4 sm:p-6 overflow-y-auto transition-colors duration-300"
            style={{ backgroundColor: colors.appBg }}
          >
            {copy ? (
              <CopywritingSection copy={copy} onUpdateCopy={setCopy} uiTheme={currentUiTheme} />
            ) : (
              <div className="p-8 text-center text-xs" style={{ color: colors.textMuted }}>文案准备中...</div>
            )}
          </div>
        </div>
      </main>

      {/* 跨平台安装/下载向导弹窗 */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: colors.panelBg, borderColor: colors.border, color: colors.text }}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <div>
                  <h3 className="font-bold text-sm">全平台客户端下载与安装渠道</h3>
                  <p className="text-[11px]" style={{ color: colors.textMuted }}>支持 Windows (.exe) / 苹果 Mac (.app / .dmg) / iPhone & Android</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/30 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 平台切换 Tab */}
            <div className="flex items-center gap-2 p-1 rounded-xl border text-xs font-bold" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
              <button
                onClick={() => setDownloadPlatform('win')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${downloadPlatform === 'win' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  backgroundColor: downloadPlatform === 'win' ? colors.panelBg : 'transparent',
                  color: downloadPlatform === 'win' ? colors.accent : colors.text,
                  border: downloadPlatform === 'win' ? `1px solid ${colors.border}` : 'none'
                }}
              >
                <Monitor className="w-4 h-4" />
                <span>Windows 电脑端</span>
              </button>

              <button
                onClick={() => setDownloadPlatform('mac')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${downloadPlatform === 'mac' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  backgroundColor: downloadPlatform === 'mac' ? colors.panelBg : 'transparent',
                  color: downloadPlatform === 'mac' ? colors.accent : colors.text,
                  border: downloadPlatform === 'mac' ? `1px solid ${colors.border}` : 'none'
                }}
              >
                <Apple className="w-4 h-4" />
                <span>Apple 苹果电脑 (Mac)</span>
              </button>

              <button
                onClick={() => setDownloadPlatform('mobile')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${downloadPlatform === 'mobile' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                style={{
                  backgroundColor: downloadPlatform === 'mobile' ? colors.panelBg : 'transparent',
                  color: downloadPlatform === 'mobile' ? colors.accent : colors.text,
                  border: downloadPlatform === 'mobile' ? `1px solid ${colors.border}` : 'none'
                }}
              >
                <Smartphone className="w-4 h-4" />
                <span>手机端 (iOS / 安卓)</span>
              </button>
            </div>

            {/* Tab 1: Windows 电脑端 */}
            {downloadPlatform === 'win' && (
              <div className="space-y-3 text-xs">
                {/* 渠道 A: 独立免安装绿色版 .exe */}
                <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold" style={{ color: colors.accent }}>
                      <span className="text-base">🪟</span>
                      <span className="text-sm">渠道 1：原生轻量 .exe (免安装绿色版)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">体积仅 10KB</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    使用原生 C# 独立进程封装，纯净无黑窗、无浏览器地址栏，自动释放系统内存。
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="/RedCard_Studio.exe"
                      download="RedCard_Studio.exe"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                      style={{ background: colors.btnPrimary, color: colors.btnPrimaryText }}
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>直接下载 RedCard_Studio.exe</span>
                    </a>
                  </div>
                </div>

                {/* 渠道 B: 桌面快捷方式一键生成 */}
                <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center gap-2 font-bold" style={{ color: colors.text }}>
                    <span className="text-base">⚡</span>
                    <span>渠道 2：一键在 Windows 桌面生成红黑图标快捷方式</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    项目根目录下已为您内置了 <strong>创建桌面快捷方式.bat</strong>，双击运行后立即在您的电脑桌面上生成专属高清图标！
                  </p>
                </div>

                {/* 渠道 C: PWA 原生应用 */}
                <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div>
                    <div className="font-bold text-xs" style={{ color: colors.text }}>渠道 3：Edge / Chrome PWA 桌面应用</div>
                    <div className="text-[11px]" style={{ color: colors.textMuted }}>在当前浏览器地址栏右侧点击“安装应用”图标，即刻常驻开始菜单与任务栏</div>
                  </div>
                  {deferredPrompt && (
                    <button
                      onClick={handleInstallClick}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 transition"
                      style={{ backgroundColor: colors.accentLight, borderColor: colors.accent, color: colors.accent }}
                    >
                      立即安装
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Apple 苹果电脑 (Mac) */}
            {downloadPlatform === 'mac' && (
              <div className="space-y-3 text-xs">
                {/* 渠道 A: Safari 原生 .app (强烈推荐) */}
                <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold" style={{ color: colors.accent }}>
                      <span className="text-base">🍏</span>
                      <span className="text-sm">官方推荐：Safari “添加到程序坞” (生成原生 .app)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: colors.accentLight, color: colors.accent, borderColor: colors.borderSubtle }}>macOS 官方能力</span>
                    </div>
                  </div>
                  <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: colors.textSecondary }}>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold shrink-0" style={{ color: colors.text }}>步骤 1:</span>
                      <span>在 Mac 电脑的 <strong>Safari 浏览器</strong> 中打开当前网址。</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold shrink-0" style={{ color: colors.text }}>步骤 2:</span>
                      <span>点击 Mac 顶部菜单栏 <strong>【文件 (File)】 ➔ 【添加到程序坞 (Add to Dock)】</strong>。</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold shrink-0" style={{ color: colors.text }}>步骤 3:</span>
                      <span>系统将在 Mac 的 <strong>应用程序 (Applications)</strong> 与 Launchpad 中自动生成 <strong>RedCard Studio.app</strong>！</span>
                    </div>
                  </div>
                  <div
                    className="p-2.5 rounded-lg border text-[11px] flex items-center gap-2 font-medium"
                    style={{
                      backgroundColor: currentUiTheme.type === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      borderColor: currentUiTheme.type === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
                      color: currentUiTheme.type === 'dark' ? '#34D399' : '#047857'
                    }}
                  >
                    <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>核心优势：完全免受 Apple Gatekeeper 拦截警告，享受 Mac 原生触控手势与离线秒开体验！</span>
                  </div>
                </div>

                {/* 渠道 B: GitHub Actions DMG 独立安装包 */}
                <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center gap-2 font-bold" style={{ color: colors.text }}>
                    <span className="text-base">📦</span>
                    <span>渠道 2：GitHub Actions 云端自动构建 DMG 安装包</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    项目已预置 <code>.github/workflows/desktop-release.yml</code>。推送代码到 GitHub 仓库后，GitHub 提供的苹果 macOS 服务器将全自动编译出 <strong>RedCard-Studio-mac.dmg</strong>。
                  </p>
                  <p className="text-[10px]" style={{ color: colors.textMuted }}>
                    💡 提示：双击未签名的 DMG 时若提示“无法验证开发者”，在【访达】➔【应用程序】中<strong>按住 Control 键点击图标并选择【打开】</strong>即可正常启动。
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: 手机端 (iPhone & Android) */}
            {downloadPlatform === 'mobile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* iPhone / iPad */}
                <div className="p-3.5 rounded-xl border space-y-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center gap-2 font-bold" style={{ color: colors.accent }}>
                    <span>🍎</span>
                    <span>iPhone / iPad (iOS)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    在 Safari 浏览器中打开本项目，点击底部的 <strong>【分享】</strong> 按钮，下拉选择 <strong>【添加到主屏幕】</strong>，即刻化身全屏独立 iOS App，支持离线缓存！
                  </p>
                </div>

                {/* Android */}
                <div className="p-3.5 rounded-xl border space-y-2.5" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold" style={{ color: colors.accent }}>
                      <span>🤖</span>
                      <span>Android (安卓手机)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: colors.accentLight, color: colors.accent, borderColor: colors.borderSubtle }}>WebAPK / 原生工程</span>
                  </div>
                  <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: colors.textSecondary }}>
                    <p>
                      <strong>方式 1（推荐 · 免未知来源告警）：</strong>用手机 Chrome/Edge 或自带浏览器打开，点击右上角 <strong>【...】 ➔ 【安装应用】</strong>，安卓底层会自动生成 WebAPK 原生独立应用。
                    </p>
                    <p>
                      <strong>方式 2（离线 APK 安装包）：</strong>项目内已生成标准安卓工程 <code>android/</code>，推送到 GitHub 可通过云端流水线自动下载 <code>.apk</code>，或用 Android Studio 直接导出。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 弹窗底部操作 */}
            <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: colors.border }}>
              <span className="text-[11px]" style={{ color: colors.textMuted }}>
                当前工作区已同步就绪
              </span>
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: colors.btnPrimary, color: colors.btnPrimaryText }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
