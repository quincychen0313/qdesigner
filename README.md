# qDesinger — GitHub 版本

## 檔案內容
- docs/：已編譯網站，可用於 GitHub Pages 或其他靜態主機。
- native/：完整 PhotoCraft 0.7.0 Rust 原始碼，已套用本專案修改。
- native-patches/：自訂差異檔、來源 SHA-256 與先前驗證紀錄。
- tools/update_web_assets.py：重新編譯後，更新 docs/ 的 JS/WASM 與載入雜湊。

## 放上 GitHub
1. 解壓縮，把本資料夾「裡面的檔案」放進你的 GitHub repository；建議透過 GitHub Desktop 或 git 上傳。
2. 開啟 repository 的 Settings → Pages。
3. Source 選 Deploy from a branch；Branch 選 main；資料夾選 /docs，儲存。
4. 等待 GitHub Pages 發布完成，再開啟提供的網址。
不需要重新編譯，docs/ 已包含可用網站。若只是保存原始碼，可以略過 Pages。
官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 修改 Rust 引擎後重新編譯
環境：Rust 1.95.0、wasm32-unknown-unknown target、Trunk 0.21.14，以及上游列出的原生編譯相依套件。
在 native/apps/photocraft-web/ 執行 trunk build --release（若 NO_COLOR 不是 true/false，請先 unset NO_COLOR）。
完成後回到本資料夾執行：

```sh
python3 tools/update_web_assets.py
```

此腳本保留本站的 PDF 與 Actions 啟動邏輯，只換成同次編譯的 JS/WASM 並重算 SHA-384。
原始碼內的建置名稱仍用 photocraft，以維持上游相容；畫面名稱是 qDesinger。

## 使用與資料保存
以 HTTPS 網址開啟，請勿直接雙擊 index.html。需要支援 WebGPU 或 WebGL2 的瀏覽器；若無法開啟，可在網址後加 ?webgl 使用相容模式。
圖片編輯在使用者的裝置上進行。專案、圖片請自行另存或匯出，這個版本沒有文件自動復原或跨裝置同步。
換到新的網域後，瀏覽器儲存的個人設定與自訂 Actions 不會自動搬過去。
本站檔案沒有附加登入保護；若需要私人使用，請另設主機存取限制。

## 版本
qDesinger，來源提交 cbd2cfddb964940a4b1f25b0b30df9902223ba0d。
包含 Actions 分類側欄、寬度保存修正、26 個內建 Actions、PDF 匯出及 qDesinger 更名。
沿用 PhotoCraft 0.7.0 引擎。授權及原作者資訊保留在 LICENSE-MIT、LICENSE-APACHE、NOTICE、ATTRIBUTION.md 與 licenses/。
此交付包已檢查檔案完整性、JS/WASM 配對及載入雜湊；尚未在你的 GitHub／Hostinger 帳戶實際上線測試。
