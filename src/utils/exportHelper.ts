import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import type { CardModel } from '../types';

/**
 * 导出单张卡片为超清 PNG (3:4 标准比例)
 */
export async function exportCardAsPng(cardId: string, filename: string): Promise<void> {
  const node = document.getElementById(`redcard-${cardId}`);
  if (!node) {
    throw new Error(`找不到卡片元素: redcard-${cardId}`);
  }

  // 渲染为 2.5 倍高清晰度以确保手机上阅读绝对无噪点
  const dataUrl = await toPng(node, {
    pixelRatio: 2.5,
    quality: 0.98,
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * 批量将所有卡片打包为 ZIP 压缩包下载
 */
export async function exportAllCardsAsZip(
  cards: CardModel[],
  topic: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = `小红书图文_${topic.replace(/[\/\\:*?"<>|]/g, '_')}`;
  const imgFolder = zip.folder(folderName) || zip;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const node = document.getElementById(`redcard-${card.id}`);
    if (!node) continue;

    if (onProgress) {
      onProgress(i + 1, cards.length);
    }

    const dataUrl = await toPng(node, {
      pixelRatio: 2.5,
      quality: 0.98,
      cacheBust: true,
    });

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const pageStr = String(i + 1).padStart(2, '0');
    imgFolder.file(`P${pageStr}_${card.type}_${card.title.slice(0, 10)}.png`, base64Data, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.download = `${folderName}.zip`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 复制文案至剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
