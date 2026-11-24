# RedCard Studio (小红书干货/测评图文生成器)

专为**小红书干货、数码测评、美妆成分、好物横评、思维模型与避坑指南**打造的 AI 图文工作台。

---

## 🎬 30秒产品实操宣传片

https://github.com/user-attachments/assets/faa6a9ba-c859-456d-ba10-4461b877fb5b

---

## 全平台支持与安装指南 (Windows / Mac / Android / iPhone)

本项目现已全面升级为跨端架构，支持 3 种形态在所有设备上独立运行：

### 1. 🍎 iPhone / iPad (iOS) 独立安装
1. 在手机 Safari 浏览器中打开本项目网页（如部署到局域网或云端域名）；
2. 点击 Safari 底部中央的 **【分享】** 按钮（方框带向上箭头）；
3. 向下滚动并点击 **【添加到主屏幕】**（Add to Home Screen）；
4. 手机桌面上立刻生成独立 App 图标，点击即可享受全屏独立运行、离线缓存体验！

---

### 2. 🤖 Android (安卓手机) 独立安装
* **方式 A (PWA 极速安装，推荐)**：
  在手机 Chrome 或 Edge 浏览器打开网页，点击右上角菜单 `...` ➔ 选择 **【安装应用 / 添加到主屏幕】**。
* **方式 B (编译 Android 原生 APK)**：
  仓库已包含 Android 工程。使用 Node.js 24、JDK 21 和 Android SDK 36，安装依赖后同步前端资源并打开项目。
  ```bash
  npm ci
  npm run mobile:sync
  npx cap open android
  ```
  在 Android Studio 中点击 `Build APK` 即可导出 `.apk` 安装包。

---

### 3. 🪟 Windows 电脑端独立运行
* **方式 A (便携版)**：
  下载 GitHub Actions 的 `RedCard-Studio-Windows.zip`，完整解压后双击 `RedCard Studio.exe`。启动器使用 Edge 或 Chrome，并从同一目录的 `dist` 读取页面。
* **方式 B (桌面独立窗口应用 PWA)**：
  在 Edge 或 Chrome 浏览器地址栏右侧，点击出现的 **【安装 RedCard】** 小电脑图标，即可像原生软件一样在独立窗口脱离浏览器运行。
* **方式 C (Electron 独立客户端)**：
  本项目已就绪 `electron/main.cjs` 桌面入口，运行以下命令即可启动原生桌面程序窗口：
  ```bash
  npm run build
  npm run desktop:run
  ```

---

### 4. 🍏 Mac (苹果电脑) 独立运行
* **macOS Sonoma+**：在 Safari 浏览器中打开网址，点击顶部菜单栏 **【文件】 ➔ 【添加到程序坞】**，即可作为独立 Mac 软件放入 Dock 和 Launchpad。
* **Chrome 浏览器**：点击地址栏右侧的【安装】图标即可。
* **DMG 文件**：从 GitHub Actions 的 macOS 构建产物下载。直接分发时需另外配置 Apple 签名和公证。

---

## 核心功能清单

1. **端侧 AI 智能去背景 (Smart Matting)**：基于 Canvas 边缘检测与色距算法，零成本一键抠出商品主体并注入商业摄影级微阴影。
2. **多垂类专属模板生态**：
   * 📊 **五维雷达综合打分卡**：纯 SVG 矢量动态渲染，5 维指标自由微调；
   * 💄 **美妆成分分析避雷卡**：成分信号灯（安全/注意/慎入）与肤质适配建议；
   * 📖 **读书认知思维金句卡**：原著大字金句排版与三层逻辑架构；
   * ⚖️ **参数对决表 & 红黑榜决策卡**。
3. **卡片自由编排与局部重生 (Deck Orchestrator)**：
   * 自由加页、删页、复制、拖拽顺序，页码全量自动重算；
   * **单页局部重生**：仅刷新不满意的那一张卡片，其余页面与爆款文案完全不变。
4. **工作台外观 5 套皮肤**：经典黑曜红、素雅极简白、温润燕麦奶咖、深海夜阑蓝、松柏墨玉绿。
5. **高清无损导出**：2.5倍超采样 3:4 PNG，全套卡片一键打包 ZIP。

## 本地检查

```bash
npm ci
npm test
npm run build
node test_diagnostics.cjs
```
