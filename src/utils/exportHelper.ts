import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { CardModel } from '../types';

const cardExport = registerPlugin<{
  save(options: { name: string; mimeType: 'image/png' | 'application/zip'; base64: string }): Promise<void>;
}>('CardExport');

function safeFilename(value: string) {
  return value.replace(/[\/\\:*?"<>|\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 100);
}

async function renderCard(cardId: string) {
  const node = document.getElementById(`export-${cardId}`);
  if (!node) throw new Error(`找不到待导出的卡片 ${cardId}`);

  await document.fonts.ready;
  const png = await toPng(node, { pixelRatio: 2.5 });
  if (!png.startsWith('data:image/png;base64,')) throw new Error('卡片渲染失败');
  return png;
}

function download(url: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * 导出单张卡片为超清 PNG (3:4 标准比例)
 */
export async function exportCardAsPng(cardId: string, filename: string): Promise<void> {
  const png = await renderCard(cardId);
  const name = `${safeFilename(filename)}.png`;
  if (Capacitor.getPlatform() === 'android') {
    await cardExport.save({ name, mimeType: 'image/png', base64: png.split(',')[1] });
    return;
  }
  download(png, name);
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
  const folderName = `小红书图文_${safeFilename(topic) || '未命名'}`;
  const imgFolder = zip.folder(folderName) || zip;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    onProgress?.(i + 1, cards.length);
    const dataUrl = await renderCard(card.id);

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const pageStr = String(i + 1).padStart(2, '0');
    imgFolder.file(`P${pageStr}_${card.type}_${safeFilename(card.title.slice(0, 10))}.png`, base64Data, { base64: true });
  }

  const name = `${folderName}.zip`;
  if (Capacitor.getPlatform() === 'android') {
    const base64 = await zip.generateAsync({ type: 'base64' });
    await cardExport.save({ name, mimeType: 'application/zip', base64 });
    return;
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  download(url, name);
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * 复制文案至剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
