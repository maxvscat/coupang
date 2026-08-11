// 本機後台伺服器：只在你自己的電腦上執行，不會被部署到 GitHub Pages。
// 用途：讓 admin.html 讀寫 data.json、儲存上傳的圖片、自動備份。
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4284);
const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, "data.json");
const BACKUP_DIR = path.join(ROOT, "backup");
const UPLOAD_DIR = path.join(ROOT, "assets", "uploads");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function writeJson(response, status, data) {
  const body = JSON.stringify(data);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    response.end(data);
  });
}

function readBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("資料太大"));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return { siteTitle: "作品預覽", siteSubtitle: "", pages: [] };
  }
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw || "{}");
}

function validateData(payload) {
  if (!payload || typeof payload !== "object") throw new Error("資料格式不正確");
  if (!Array.isArray(payload.pages)) throw new Error("pages 必須是陣列");
  payload.pages.forEach((page, index) => {
    if (!page || typeof page !== "object") throw new Error(`第 ${index + 1} 頁格式不正確`);
    if (typeof page.id !== "string" || !page.id) throw new Error(`第 ${index + 1} 頁缺少 id`);
    if (typeof page.name !== "string") throw new Error(`第 ${index + 1} 頁缺少名稱`);
    if (!Array.isArray(page.rows)) throw new Error(`第 ${index + 1} 頁的 rows 必須是陣列`);
  });
  return {
    siteTitle: String(payload.siteTitle || ""),
    siteSubtitle: String(payload.siteSubtitle || ""),
    pages: payload.pages
  };
}

function saveData(payload) {
  const clean = validateData(payload);
  ensureDirs();
  if (fs.existsSync(DATA_PATH)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(DATA_PATH, path.join(BACKUP_DIR, `data-${stamp}.json`));
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(clean, null, 2), "utf8");
  return { ok: true, pageCount: clean.pages.length };
}

function sanitizeFileName(name) {
  const ext = path.extname(name || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext) ? ext : ".jpg";
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `img-${stamp}${safeExt}`;
}

function saveUpload(payload) {
  if (!payload || !payload.dataBase64) throw new Error("缺少圖片資料");
  const match = String(payload.dataBase64).match(/^data:(.+?);base64,(.*)$/);
  if (!match) throw new Error("圖片格式不正確");
  ensureDirs();
  const fileName = sanitizeFileName(payload.filename);
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
  return { ok: true, path: `assets/uploads/${fileName}` };
}

function createServer() {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://127.0.0.1:${PORT}`);

    try {
      if (request.method === "GET" && requestUrl.pathname === "/api/data") {
        writeJson(response, 200, loadData());
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/data") {
        const body = await readBody(request, 20 * 1024 * 1024);
        writeJson(response, 200, saveData(JSON.parse(body)));
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/upload") {
        const body = await readBody(request, 20 * 1024 * 1024);
        writeJson(response, 200, saveUpload(JSON.parse(body)));
        return;
      }

      if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/admin.html")) {
        sendFile(response, path.join(ROOT, "admin.html"));
        return;
      }

      // 其餘 GET 一律當作靜態檔案（index.html、data.json、assets/uploads/*）
      if (request.method === "GET") {
        const safePath = path.normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, "");
        const filePath = path.join(ROOT, safePath);
        if (filePath.startsWith(ROOT) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          sendFile(response, filePath);
          return;
        }
      }

      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    } catch (error) {
      writeJson(response, 500, { ok: false, error: error.message });
    }
  });
}

if (require.main === module) {
  ensureDirs();
  createServer().listen(PORT, "127.0.0.1", () => {
    console.log(`後台伺服器已啟動：http://127.0.0.1:${PORT}/admin.html`);
    console.log(`預覽首頁：http://127.0.0.1:${PORT}/index.html`);
  });
}

module.exports = { createServer, loadData, saveData, saveUpload };
