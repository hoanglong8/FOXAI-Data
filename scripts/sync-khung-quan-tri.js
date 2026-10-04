// Dong bo noi dung ung dung "Khung Kien truc & Quan tri Du lieu Quoc gia" tu
// https://jamebone10072025-ecabinet.github.io/kientrucdulieu-app/ vao docs/phap-luat/khung-quan-tri-dl/
//
// Ung dung nguon la mot SPA da build (Vite) voi ten file JS/CSS doi theo tung lan build
// (content hash), nen script nay luon doc lai index.html moi nhat de biet chinh xac file
// can tai, roi dong bo thu muc assets/ cho khop (xoa file cu khong con duoc tham chieu).
//
// Chay thu cong: node scripts/sync-khung-quan-tri.js
// Chay dinh ky: xem .github/workflows/sync-khung-quan-tri.yml (hang thang)

const fs = require("fs");
const path = require("path");

const SOURCE_URL = "https://jamebone10072025-ecabinet.github.io/kientrucdulieu-app/";
const DEST_DIR = path.join(__dirname, "..", "docs", "phap-luat", "khung-quan-tri-dl");
const ASSETS_DIR = path.join(DEST_DIR, "assets");

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch that bai ${url}: HTTP ${res.status}`);
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch that bai ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Ung dung nguon nhung thang keys Google API truc tiep vao bundle JS (dung lam fallback
// khi /api/gemini/* khong phan hoi — vi du tren chinh ban GitHub Pages tinh cua ho).
// Day la thong tin dang nhap that, khong duoc phep dua vao repo cua chung ta (GitHub
// push protection se chan). Thay the bang placeholder ro rang de code van hop le cu phap
// nhung khong con dung duoc — tinh nang AI (voi goi API truc tiep) se bao loi thay vi
// am tham dung ten/khoa cua ben thu ba.
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{30,40}/g, // Google API key dang co dien
  /AQ\.[A-Za-z0-9_-]{20,80}/g, // Google API key gioi han theo service account
];
const REDACTED_PLACEHOLDER = "REDACTED_UPSTREAM_API_KEY";

function redactSecrets(text, fileName) {
  let out = text;
  let hits = 0;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, () => {
      hits += 1;
      return REDACTED_PLACEHOLDER;
    });
  }
  if (hits > 0) console.log(`  -> Da loai bo ${hits} chuoi giong API key trong ${fileName}`);
  return out;
}

async function main() {
  console.log(`Dang tai ${SOURCE_URL} ...`);
  const html = await fetchText(SOURCE_URL);

  const assetPaths = [...html.matchAll(/\.\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)/g)].map((m) => m[0]);
  const uniqueAssets = [...new Set(assetPaths)];
  if (!uniqueAssets.length) {
    throw new Error("Khong tim thay file assets/*.js hoac assets/*.css nao trong index.html nguon — cau truc trang nguon co the da doi, can kiem tra lai thu cong.");
  }
  console.log(`Tim thay ${uniqueAssets.length} asset:`, uniqueAssets.join(", "));

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // Xoa cac asset cu (ten file doi theo hash build) truoc khi ghi lai cho khop ban moi.
  for (const f of fs.readdirSync(ASSETS_DIR)) {
    fs.unlinkSync(path.join(ASSETS_DIR, f));
  }

  for (const rel of uniqueAssets) {
    const fileName = rel.replace("./assets/", "");
    const url = new URL(rel.replace("./", ""), SOURCE_URL).toString();
    console.log(`Dang tai ${url} ...`);
    const buf = await fetchBuffer(url);
    const isTextAsset = /\.(js|css)$/.test(fileName);
    const content = isTextAsset ? redactSecrets(buf.toString("utf8"), fileName) : buf;
    fs.writeFileSync(path.join(ASSETS_DIR, fileName), content);
  }

  fs.writeFileSync(path.join(DEST_DIR, "index.html"), redactSecrets(html, "index.html"), "utf8");

  console.log(`Da dong bo xong vao ${DEST_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
