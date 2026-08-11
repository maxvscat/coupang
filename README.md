# 作品預覽網站

給客戶看的展示頁，白色簡潔風格，可分頁、每頁多列，支援圖片或 YouTube 影片（點擊播放）、文字說明、Google 雲端下載連結。

## 檔案結構

- `index.html` — 客戶看的首頁，讀取 `data.json` 顯示內容，會部署到 GitHub Pages。
- `admin.html` — 後台編輯介面，**只能在本機執行，不會被部署、也不會出現在公開網站上**。
- `admin-server.js` — 本機小型伺服器，負責讀寫 `data.json` 與儲存上傳的圖片。
- `data.json` — 所有頁面/內容資料，index.html 和 admin.html 都是讀這份檔案。
- `assets/uploads/` — 後台上傳的圖片實際存放位置。
- `backup/` — 每次在後台按「儲存」時，自動保留前一版 `data.json` 備份。
- `start-admin.bat` — 雙擊啟動後台（本機網址 `http://127.0.0.1:4284/admin.html`）。
- `start-local-server.bat` — 雙擊在本機預覽 `index.html`（不含後台功能）。

## 日常編輯流程

1. 雙擊 `start-admin.bat`，會自動開瀏覽器進入後台。
2. 左側管理「頁面」：新增、改名（直接點文字框輸入）、上下排序、刪除。
3. 右側管理該頁的「內容列」：新增列 → 選擇「圖片」或「YouTube 影片」→ 上傳圖片或貼網址 → 填文字說明與（選填）Google 雲端下載連結 → 可上下排序、刪除。
4. 編輯完成按右上角「儲存全部變更」，資料會寫入 `data.json`（同時自動備份舊版本到 `backup/`）。
5. 想確認客戶看到的樣子，開新分頁到 `http://127.0.0.1:4284/index.html` 即可即時預覽。

## 發布到 GitHub Pages（客戶才看得到最新內容）

後台只在你自己電腦上執行，GitHub Pages 是純靜態網站，**存檔後還要把檔案推上 GitHub，客戶端才會看到更新**：

```
git add index.html data.json assets/uploads
git commit -m "更新作品內容"
git push
```

沒有新增圖片時，`assets/uploads` 可省略不加。首次部署記得把整個資料夾（含 `index.html`、`data.json`、`assets/`）都推上去，並在 GitHub 設定 Pages 來源。

## 注意事項

- `index.html` 用 `fetch('data.json')` 讀資料，**必須透過網頁伺服器開啟**（`start-admin.bat` 或 `start-local-server.bat`，或正式的 GitHub Pages 網址），直接雙擊 html 檔在瀏覽器打開會因瀏覽器安全限制讀不到資料。
- 後台網頁沒有密碼保護，僅以「路徑不公開」防護（未放在首頁連結、檔名 `admin.html` 不會顯示給訪客）。因為後台只能在本機執行、不會出現在 GitHub Pages 上，實務上訪客本來就無法連到它；但如果要更保險，可自行把 `admin.html` 改名成不易猜到的檔名（例如 `panel-7x2k.html`），`admin-server.js` 內對應那行也要一起改。
- 圖片上傳後會存成實體檔案在 `assets/uploads/`，`data.json` 只存路徑，檔案大小和 Git 都比較好處理（不會塞入大量 base64 文字）。
- YouTube 支援貼完整網址（含 `youtu.be`、`shorts` 等格式）或直接貼 11 碼影片 ID。
