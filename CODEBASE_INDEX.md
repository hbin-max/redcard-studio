# 🗺️ RedCard Studio 代码仓库全景指向与架构索引 (Codebase Map & Index)

> **文档说明**：本文档为工程级全景索引，详细梳理了项目中每一个文件、目录、配置及其核心职责，供开发人员与 AI 助手（Codex）快速查阅与精准定位。

---

## 一、目录结构总览 (Directory Tree)

```text
小红书帖子生成器/
├── .github/
│   └── workflows/
│       └── desktop-release.yml          # GitHub Actions 跨平台自动打包构建流水线 (Android APK / Win / Mac)
├── android/                             # Capacitor 生成的标准 Android 原生工程目录
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml      # 安卓核心清单文件 (包名 com.redcard.studio, 网络权限配置)
│   │   │   ├── assets/public/           # 自动同步的前端编译网页静态资源 (dist)
│   │   │   ├── java/com/redcard/studio/
│   │   │   │   └── MainActivity.java    # 安卓主入口 Activity
│   │   │   └── res/mipmap-*/            # 多尺寸高清应用启动图标 (ic_launcher.png)
│   │   └── build.gradle                 # 安卓 App 模块构建脚本
│   ├── build.gradle                     # 安卓项目级根构建脚本
│   ├── local.properties                 # 本地 SDK 路径指向 (已绑定本地 Android SDK)
│   └── variables.gradle                 # 安卓版本变量定义 (compileSdkVersion=35, targetSdkVersion=35)
├── electron/
│   └── main.cjs                         # Electron 桌面端备份入口与窗口配置脚本
├── public/                              # 前端公开静态资源
│   ├── icons/                           # PWA 与 Web 高清图标 (icon-192.png, icon-512.png, icon.svg)
│   ├── manifest.json                    # PWA 标准 Web 应用程序清单文件
│   ├── sw.js                            # PWA Service Worker 离线缓存服务
│   ├── RedCard_Studio.exe               # 编译好的独立 Windows 原生免安装绿色版可执行文件
│   └── 创建桌面快捷方式.bat             # 客户端网页内供用户直接下载的快捷方式生成脚本
├── src/                                 # 核心业务源码目录
│   ├── assets/                          # 静态演示图像与图标资源
│   ├── components/                      # 核心业务组件
│   │   ├── CardView.tsx                 # 卡片渲染总览组件 (包含行内编辑、5大垂类模板与编排工具栏)
│   │   ├── CopywritingSection.tsx       # 文案展示与一键复制面板 (包含3组钩子标题选择与标签生成)
│   │   └── Sidebar.tsx                  # 左侧全局参数控制栏 (主题预设、参考图上传、智能抠图开关)
│   ├── services/
│   │   └── aiGenerator.ts               # AI 智能生成调度引擎与离线本地爆款模板工厂函数
│   ├── utils/
│   │   ├── exportHelper.ts              # 2.5x 超采样高清 PNG 渲染与 JSZip 批量打包管线
│   │   └── imageMatting.ts              # 纯端侧 Canvas 颜色距离分割与软阴影合成算法
│   ├── App.tsx                          # 核心应用中枢 (Deck Orchestrator、跨端下载中心、主题切换)
│   ├── themes.ts                        # 6 套小红书卡片主题视觉设计 Token
│   ├── uiThemes.ts                      # 5 套工作台整体界面外观配色方案
│   ├── types.ts                         # 全局严格 TypeScript 数据类型定义
│   ├── index.css                        # Tailwind 基础样式与字体平滑配置
│   └── main.tsx                         # React 19 应用渲染挂载入口
├── app.ico                              # Windows 高清应用图标 (由 icon-192.png 生成)
├── capacitor.config.json                # Capacitor 移动端配置文件
├── index.html                           # 根 HTML 模板 (已注入 PWA 头部与视口控制)
├── launcher.cs                          # Windows 原生轻量启动器 C# 源码 (免 Electron，基于 HttpListener+Edge)
├── package.json                         # 项目依赖定义、打包脚本与 Electron-Builder 配置
├── RedCard Studio.exe                   # Windows 独立原生绿色版客户端 (10.7 KB，双击即开)
├── test_diagnostics.cjs                 # 7 项核心能力自动化全量诊断测试工具
├── vite.config.ts                       # Vite 构建配置 (已开启 0.0.0.0 局域网移动端访问)
├── scripts/
│   └── windows/                         # Windows 本地开发与发布辅助脚本
│       ├── 启动小红书图文工作台.bat             # Windows 1 键启动 Vite 开发服务器脚本
│       ├── 创建桌面快捷方式.bat                 # Windows 1 键在用户桌面生成红黑图标快捷方式脚本
│       ├── 在Android_Studio中打开项目.bat        # Windows 1 键在 Android Studio 中打开原生工程脚本
│       ├── 提取生成的APK到当前目录.bat          # Windows 1 键从 build 目录提取 APK 到根目录脚本
│       ├── 一键推送到GitHub_自动构建APK.bat    # 推送当前分支的已提交内容
│       └── create_shortcut.vbs         # Windows 桌面快捷方式生成器
├── HANDOFF_TO_CODEX.md                  # 致 Codex 的全面交接文件 (业务定位、历史演进、发布指导)
└── CODEBASE_INDEX.md                    # 本文件 (代码仓库全景指向与架构索引)
```

---

## 二、核心源码与职责矩阵 (Source File Index & Responsibilities)

### 1. 核心类型定义与数据结构 (`src/types.ts`)
- **`CardType`**：定义支持的卡片类型枚举：
  - `'cover'`：大字主标题干货封面卡
  - `'radar'`：五维雷达综合评分卡
  - `'ingredient'`：美妆/成分活性物分析与安全信号灯卡
  - `'quote'`：读书金句与认知思维进阶卡
  - `'comparison'`：参数双栏高亮对决卡
  - `'detail'`：细节避坑与警示提示框卡
  - `'verdict'`：选购决策红黑榜卡
  - `'outro'`：行动清单与点赞关注互动卡
- **`CardModel`**：单张卡片的完整数据模型，包含行内可编辑的所有文本字段、打分数值、页码、英雄图片（`heroImage`）及主题配色；
- **`GenerationConfig`**：生成参数模型（主题、细分需求、品类、卡片套数、卡片主题、作者名、参考图 ID 等）；
- **`PostCopy`**：小红书文案模型（包含 3 组高点击钩子标题、结构化正文、标签组）。

### 2. 视觉设计系统 (`src/themes.ts` & `src/uiThemes.ts`)
- **`src/themes.ts`**：
  - 定义了 6 套纯正小红书社区调性的卡片视觉 Token：`rose`（经典黑曜红）、`cream`（温暖奶油风）、`dark`（深色极客）、`mint`（清凉薄荷）、`ocean`（冷淡深海）、`lavender`（浪漫香芋紫）。
- **`src/uiThemes.ts`**：
  - 定义了 5 套独立的工作台界面主题系统（`dark-red`、`light-clean`、`warm-cream`、`midnight-navy`、`forest-green`），包含背景色、侧边栏色、操作面板色、边框色与主副文本对比度。

### 3. 端侧图像与智能算法 (`src/utils/`)
- **`src/utils/imageMatting.ts`**：
  - `removeBackgroundSmartly(dataUrl, tolerance)`：纯端侧 Canvas 色差聚类分割算法。通过取图片四角背景色样本，计算颜色曼哈顿/欧几里得距离，在 0 毫秒内消除纯色/渐变色背景。
  - `compositeMattedImage(mattedDataUrl, shadowOptions)`：自动生成软阴影合成层，让抠出的商品主体呈现悬浮立体质感。
- **`src/utils/exportHelper.ts`**：
  - `exportCardAsPng(element, fileName)`：基于 `html-to-image` 的 2.5x 超采样高清导出，规避锯齿，输出小红书推荐的高清画质。
  - `exportAllCardsAsZip(cards, topic, onProgress)`：自动遍历卡片组 DOM，批量高保真渲染并打包为 `.zip` 压缩包。

### 4. 业务逻辑与组件 (`src/components/` & `src/services/`)
- **`src/services/aiGenerator.ts`**：
  - `generateXiaohongshuContent(config, referenceImage)`：主生成调度器，支持云端大模型接口集成及强大的内置离线爆款结构化模板引擎；
  - `regenerateSingleCard(card, config)`：单页局部重新思考与生成卡片内容；
  - `createNewCardTemplate(type, index, config, heroImg)`：新卡片模板工厂函数。
- **`src/components/CardView.tsx`**：
  - 核心卡片渲染与 WYSIWYG 行内编辑组件；
  - 内置纯 SVG 矢量计算的 5 维雷达图数学渲染函数（根据分数自动计算五边形顶点坐标并绘制渐变多边形）；
  - 支持单页卡片上移、下移、复制、局部重生、删除与拖拽编排。
- **`src/components/Sidebar.tsx`**：
  - 参考图片上传器（包含客户端自动压缩下采样 `<1200px`，保障渲染性能）；
  - 一键智能抠图开关与抠图灵敏度调节；
  - 5 套垂类爆款场景预设（数码手机测评、美妆护肤成分、深度书籍拆解、好物红黑榜、职场干货思维）。
- **`src/components/CopywritingSection.tsx`**：
  - 3 组钩子标题切换选择器（痛点疑问型、反直觉揭秘型、数字干货型）；
  - 小红书爆款 Emoji 结构化正文编辑区与一键复制功能。
- **`src/App.tsx`**：
  - 应用顶层中枢；
  - 管理卡片编排状态、视图模式切换（单张焦点居中 vs 全局网格平铺）；
  - 顶部导航集成**全平台客户端下载与安装渠道中心**模态框。

---

## 三、跨端支持与构建配置文件指南

| 平台 / 工具 | 关键配置文件 | 运作机制说明 |
| :--- | :--- | :--- |
| **Android 客户端** | `android/`, `capacitor.config.json` | 基于 Capacitor 7，已同步最新 Web 资源与 Android 35 SDK 规范配置 |
| **Windows 独立端** | `launcher.cs`, `RedCard Studio.exe` | 10KB C# 独立宿主，利用本地 Edge `--app` 模式免装 Node 运行 |
| **GitHub Actions** | `.github/workflows/desktop-release.yml` | 包含 `build-android` (Ubuntu 打包 APK)、`build-windows`、`build-mac` (DMG) |
| **PWA 渐进式应用** | `public/manifest.json`, `public/sw.js` | 满足 PWA 标准，支持 Edge/Chrome 桌面安装及手机浏览器一键添加 |

---

## 四、本地一键便捷批处理脚本清单

1. **`scripts/windows/启动小红书图文工作台.bat`**：启动 Vite 本地开发热更新服务器；
2. **`scripts/windows/创建桌面快捷方式.bat`**：在 Windows 当前用户桌面上创建红黑图标的桌面快捷方式；
3. **`scripts/windows/一键推送到GitHub_自动构建APK.bat`**：将 main 或 master 上的已提交内容推送到 origin，由 GitHub Actions 触发打包；
4. **`scripts/windows/在Android_Studio中打开项目.bat`**：自动同步静态资源并在 Android Studio 中直接唤起 `android/` 原生工程；
5. **`scripts/windows/提取生成的APK到当前目录.bat`**：将 Android Studio 编译出来的 `app-debug.apk` 自动重命名并提取到项目根目录。

---
*索引完毕。Codex 可依据此结构快速定位所需文件并安全开展代码维护或发布操作。*
