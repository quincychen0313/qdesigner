import {PDF_TRANSFER} from './builtin-actions.mjs';

// Lossless, flattened RGB PDF. No Photoshop editing data or layers are claimed.
export function makePDF(width, height, pixels, compressed = false) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('無效的 PDF 尺寸');
  const encode = text => new TextEncoder().encode(text);
  const parts = [], offsets = [0];
  let length = 0;
  const append = value => {const bytes = typeof value === 'string' ? encode(value) : value; parts.push(bytes); length += bytes.length;};
  const object = (id, content) => {offsets[id] = length; append(`${id} 0 obj\n${content}\nendobj\n`);};
  const scale = Math.min(0.5, 14400 / Math.max(width, height));
  const w = +(width * scale).toFixed(3), h = +(height * scale).toFixed(3);
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 ${compressed ? '/Filter /FlateDecode ' : ''}/Length ${pixels.length} >>\nstream\n`);
  append(pixels); append('\nendstream\nendobj\n');
  const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
  object(5, `<< /Length ${encode(content).length} >>\nstream\n${content}endstream`);
  const xref = length;
  append('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, {type: 'application/pdf'});
}

async function pngToPDF(blob) {
  const image = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) throw new Error('無法建立 PDF 影像');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let rgb = new Uint8Array(image.width * image.height * 3);
    for (let a = 0, b = 0; a < rgba.length; a += 4) {rgb[b++] = rgba[a]; rgb[b++] = rgba[a + 1]; rgb[b++] = rgba[a + 2];}
    let compressed = false;
    if (typeof CompressionStream !== 'undefined') {
      rgb = new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
      compressed = true;
    }
    return makePDF(image.width, image.height, rgb, compressed);
  } finally {image.close();}
}

export function installPDFExport(notify) {
  document.addEventListener('click', event => {
    const anchor = event.target;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.download !== PDF_TRANSFER || !anchor.href.startsWith('blob:')) return;
    event.preventDefault();
    // Fetch before upstream revokes its temporary PNG URL.
    const source = fetch(anchor.href).then(response => response.blob());
    notify('正在製作合併圖層的 PDF…');
    source.then(pngToPDF).then(blob => {
      const url = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url; download.download = 'qDesinger.pdf';
      document.body.append(download); download.click(); download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      notify('PDF 已產生；若瀏覽器詢問，請允許下載。');
    }).catch(error => notify(`PDF 匯出失敗：${error.message}`, true));
  }, true);
}
