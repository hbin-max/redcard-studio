/**
 * 客户端智能去背景与商拍阴影后处理引擎
 * 针对浅色底、白底、灰底以及高对比度实拍图进行端侧极速抠图与透明化
 */
export async function removeImageBackgroundClient(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // 自动采样四个边角的平均背景色
      const samplePoints = [
        0, // 左上
        (width - 1) * 4, // 右上
        ((height - 1) * width) * 4, // 左下
        ((height - 1) * width + (width - 1)) * 4 // 右下
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      for (const idx of samplePoints) {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      }
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      // 颜色相似度容差计算 (色差阈值)
      const tolerance = 48;
      const featherRange = 24;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 欧几里得色距
        const dist = Math.sqrt(
          (r - bgR) * (r - bgR) +
          (g - bgG) * (g - bgG) +
          (b - bgB) * (b - bgB)
        );

        if (dist <= tolerance) {
          // 完全背景透明
          data[i + 3] = 0;
        } else if (dist < tolerance + featherRange) {
          // 边缘羽化渐变过渡，消除毛刺与白边
          const alphaFactor = (dist - tolerance) / featherRange;
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // 注入商拍级柔和立体阴影
      const finalCanvas = document.createElement('canvas');
      // 预留阴影扩散边距
      finalCanvas.width = width + 40;
      finalCanvas.height = height + 40;
      const fCtx = finalCanvas.getContext('2d');

      if (fCtx) {
        fCtx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        fCtx.shadowBlur = 24;
        fCtx.shadowOffsetY = 16;
        fCtx.drawImage(canvas, 20, 10);
        resolve(finalCanvas.toDataURL('image/png'));
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.src = dataUrl;
  });
}
