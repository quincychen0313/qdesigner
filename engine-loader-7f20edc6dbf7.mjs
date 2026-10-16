// Small same-origin chunks, streamed progress, and bounded recovery on stalled transfers.
export async function loadEngine(manifest, progress = () => {}, fetcher = fetch, options = {}) {
  if (!globalThis.crypto?.subtle) throw new Error('請使用 HTTPS 網址開啟網站，勿直接開啟下載的 HTML。');
  const timeoutMs = options.timeoutMs ?? 30000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const bytes = new Uint8Array(manifest.size);
  let received = 0;
  const sha256 = async data => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), b => b.toString(16).padStart(2, '0')).join('');
  for (const [i, part] of manifest.parts.entries()) {
    if (received + part.size > bytes.length) throw new Error('引擎清單大小不符，請重新上傳完整網站檔案。');
    for (let attempt = 0; attempt <= retries; attempt++) {
      const abort = new AbortController();
      let reader;
      const report = count => {
        const loaded = received + count;
        const percent = Math.floor(loaded / manifest.size * 100);
        progress(`正在下載編輯引擎 ${percent}%（${(loaded / 1048576).toFixed(1)} / ${(manifest.size / 1048576).toFixed(1)} MB） · ${i + 1}/${manifest.parts.length}${attempt ? ` · 重試 ${attempt}/${retries}` : ''}`, {loaded, total: manifest.size, percent});
      };
      const timed = async promise => {
        let timer;
        try {
          return await Promise.race([promise, new Promise((_, reject) => {
            timer = setTimeout(() => {
              reject(new Error('網路未回應或下載中斷'));
              abort.abort();
            }, timeoutMs);
          })]);
        } finally { clearTimeout(timer); }
      };
      try {
        report(0);
        const url = new URL(part.file, import.meta.url);
        // Different URLs on retries also avoid a broken intermediary cache entry.
        if (attempt) url.searchParams.set('retry', `${Date.now()}-${attempt}`);
        const response = await timed(fetcher(url, {signal: abort.signal, cache: 'no-store'}));
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          error.permanent = response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status);
          throw error;
        }
        const chunk = new Uint8Array(part.size);
        let count = 0;
        if (response.body?.getReader) {
          reader = response.body.getReader();
          for (;;) {
            const {done, value} = await timed(reader.read());
            if (done) break;
            if (count + value.length > chunk.length) throw new Error('下載內容大小不符，可能收到錯誤頁面');
            chunk.set(value, count);
            count += value.length;
            report(count);
          }
        } else {
          const data = new Uint8Array(await timed(response.arrayBuffer()));
          if (data.length !== chunk.length) throw new Error('檔案不完整或下載內容不符');
          chunk.set(data);
          count = data.length;
          report(count);
        }
        if (count !== part.size) throw new Error('分段檔案不完整');
        if (part.sha256 && await sha256(chunk) !== part.sha256) throw new Error('分段檔案驗證失敗');
        bytes.set(chunk, received);
        received += count;
        break;
      } catch (error) {
        abort.abort();
        if (reader) reader.cancel().catch(() => {});
        if (error.permanent || attempt === retries) {
          throw new Error(`${part.file}：${error.message || error}。請確認網路，並將 ZIP 內全部檔案解壓、上傳至 index.html 同一層後重試。`);
        }
        progress(`第 ${i + 1}/${manifest.parts.length} 段下載中斷，正在重試 ${attempt + 1}/${retries}…`, {loaded: received, total: manifest.size, percent: Math.floor(received / manifest.size * 100)});
        if (retryDelayMs) await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      } finally {
        if (reader) { try { reader.releaseLock(); } catch {} }
      }
    }
  }
  if (received !== manifest.size) throw new Error('引擎大小不符，請重新上傳完整網站檔案。');
  progress('正在驗證編輯引擎…');
  if (await sha256(bytes) !== manifest.sha256) throw new Error('引擎檔案驗證失敗，請重新上傳完整網站檔案。');
  return bytes;
}
