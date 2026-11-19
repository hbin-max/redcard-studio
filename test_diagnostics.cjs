const assert = require('assert');

console.log('====================================================');
console.log('🧪 正在执行 RedCard Studio v2.0 进阶升级全量诊断测试...');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    failCount++;
  }
}

// 1. 验证卡片主题皮肤完整性
test('1. 验证小红书 6 套卡片预设主题完整性', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./src/themes.ts', 'utf-8');
  const requiredThemes = ['rose', 'cream', 'dark', 'mint', 'ocean', 'lavender'];
  for (const t of requiredThemes) {
    assert(content.includes(`${t}:`), `缺少主题定义: ${t}`);
  }
});

// 2. 验证工作台 5 套界面配色
test('2. 验证工作台界面 5 套外观配色方案', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./src/uiThemes.ts', 'utf-8');
  const requiredUiThemes = ['dark-red', 'light-clean', 'warm-cream', 'midnight-navy', 'forest-green'];
  for (const ut of requiredUiThemes) {
    assert(content.includes(`'${ut}':`), `缺少界面配色: ${ut}`);
  }
});

// 3. 验证进阶垂类卡片类型扩展 (Radar / Ingredient / Quote)
test('3. 验证进阶垂类卡片类型系统 (Radar / Ingredient / Quote / Comparison / Detail / Verdict / Outro)', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./src/types.ts', 'utf-8');
  const cardTypes = ['cover', 'comparison', 'detail', 'verdict', 'outro', 'radar', 'ingredient', 'quote'];
  for (const ct of cardTypes) {
    assert(content.includes(`'${ct}'`), `缺少卡片类型: ${ct}`);
  }
  assert(content.includes('RadarAxis'), '缺少雷达图类型定义');
  assert(content.includes('IngredientItem'), '缺少美妆成分类型定义');
  assert(content.includes('isMatted'), '缺少物料抠图状态定义');
});

// 4. 验证单页局部重生与卡片模板工厂函数
test('4. 验证单页局部重生与卡片工厂函数 (Deck Orchestrator API)', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./src/services/aiGenerator.ts', 'utf-8');
  assert(content.includes('export async function regenerateSingleCard'), '缺少单卡局部重生函数');
  assert(content.includes('export function createNewCardTemplate'), '缺少卡片模板工厂函数');
  assert(content.includes("case 'radar':"), '工厂函数缺少 radar 模板分支');
  assert(content.includes("case 'ingredient':"), '工厂函数缺少 ingredient 模板分支');
  assert(content.includes("case 'quote':"), '工厂函数缺少 quote 模板分支');
});

// 5. 验证端侧智能去背景与羽化边缘算法
test('5. 验证端侧智能抠图去背景算法 (Image Matting Engine)', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./src/utils/imageMatting.ts', 'utf-8');
  assert(content.includes('removeImageBackgroundClient'), '缺少抠图去背景函数');
  assert(content.includes('featherRange'), '缺少边缘羽化防毛刺参数');
  assert(content.includes('shadowBlur'), '缺少商拍立体阴影参数');
});

// 6. 验证生产构建完整性
test('6. 验证生产打包完整性 (dist build)', () => {
  const fs = require('fs');
  const path = require('path');
  assert(fs.existsSync(path.join(__dirname, 'dist', 'index.html')), '缺少 dist/index.html');
  const assets = fs.readdirSync(path.join(__dirname, 'dist', 'assets'));
  const hasJs = assets.some(f => f.endsWith('.js'));
  const hasCss = assets.some(f => f.endsWith('.css'));
  assert(hasJs, '生产构建产物缺少 bundle.js');
  assert(hasCss, '生产构建产物缺少 bundle.css');
});

// 7. 验证全平台 PWA / 桌面 / 移动端配置支持
test('7. 验证全平台应用配置 (PWA Manifest / Capacitor / Electron / Icons)', () => {
  const fs = require('fs');
  assert(fs.existsSync('./public/manifest.json'), '缺少 PWA manifest.json');
  assert(fs.existsSync('./public/sw.js'), '缺少 Service Worker sw.js');
  assert(fs.existsSync('./public/icons/icon-192.png'), '缺少 PWA 192 图标');
  assert(fs.existsSync('./public/icons/icon-512.png'), '缺少 PWA 512 图标');
  assert(fs.existsSync('./capacitor.config.json'), '缺少 Capacitor 移动端配置');
  assert(fs.existsSync('./electron/main.cjs'), '缺少 Electron 桌面端配置');
});

console.log('\n====================================================');
console.log(`📊 测试汇总: 共 ${passCount + failCount} 项测试，通过: ${passCount} 项，失败: ${failCount} 项`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
