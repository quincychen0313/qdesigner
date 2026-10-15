export async function loadEngine(manifest, progress = () => {}, fetcher = fetch) {
  const chunks = [];
  let received = 0;
  for (const [i, part] of manifest.parts.entries()) {
    progress(`正在下載編輯引擎 ${i + 1}/${manifest.parts.length}…`);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 90000);
    try {
      const response = await fetcher(new URL(part.file, import.meta.url), {signal: abort.signal});
      if (!response.ok) throw new Error(`${part.file}：HTTP ${response.status}。請確認所有分段檔已上傳至 index.html 同一層。`);
      const chunk = new Uint8Array(await response.arrayBuffer());
      if (chunk.length !== part.size) throw new Error(`${part.file} 檔案不完整。請重新上傳此檔案。`);
      chunks.push(chunk);
      received += chunk.length;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error(`${part.file} 下載逾時。請確認網路後重新載入。`);
      throw error;
    } finally { clearTimeout(timer); }
  }
  if (received !== manifest.size) throw new Error('引擎大小不符，請重新上傳完整網站檔案。');
  progress('正在驗證編輯引擎…');
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  if (!globalThis.crypto?.subtle) throw new Error('請使用 HTTPS 網址開啟網站，勿直接開啟下載的 HTML。');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  if (digest !== manifest.sha256) throw new Error('引擎檔案驗證失敗，請重新上傳完整網站檔案。');
  return bytes;
}
