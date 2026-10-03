// ------- Rendering engine for the legal reference hub -------
// DOCS and TERMS are defined in data.js

const typeLabel = {
  luat: "Luật",
  nghidinh: "Nghị định",
  "quyetdinh-tw": "Quyết định (TW)",
  "quyetdinh-hn": "Quyết định (Hà Nội)",
  kehoach: "Kế hoạch",
  nghiencuu: "Nghiên cứu nội bộ",
};

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderKV(doc) {
  const items = [
    ["Ngày ban hành", doc.ngay_ban_hanh],
    ["Ngày hiệu lực", doc.ngay_hieu_luc],
    ["Cơ quan ban hành", doc.co_quan],
    ["Cấu trúc", doc.cau_truc],
  ].filter((x) => x[1]);
  return `<div class="kv-grid">${items
    .map(
      (x) => `<div class="kv"><div class="k">${escapeHtml(x[0])}</div><div class="v">${escapeHtml(x[1])}</div></div>`
    )
    .join("")}</div>`;
}

function renderList(title, arr) {
  if (!arr || !arr.length) return "";
  return `<h4>${escapeHtml(title)}</h4><ul>${arr.map((li) => `<li>${li}</li>`).join("")}</ul>`;
}

function renderDocCard(doc) {
  return `
  <div class="doc-card" id="doc-${doc.id}" data-id="${doc.id}">
    <div class="doc-head" onclick="toggleDoc('${doc.id}')">
      <span class="doc-type ${doc.type}">${typeLabel[doc.type] || doc.type}</span>
      <div class="title-block">
        <div class="so-hieu">${escapeHtml(doc.so_hieu)}</div>
        <div class="ten-tat">${escapeHtml(doc.ten_tat)}</div>
      </div>
      <div class="meta-right">
        ${doc.ngay_hieu_luc ? `<span>Hiệu lực: ${escapeHtml(doc.ngay_hieu_luc)}</span>` : ""}
        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
    <div class="doc-body">
      <div class="source-links source-links-top">
        ${doc.official_url ? `<a class="source-link official" href="${escapeHtml(doc.official_url)}" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          Xem văn bản gốc chính thức (${escapeHtml(doc.official_url.includes("vanban.hanoi.gov.vn") ? "Cổng TTĐT TP Hà Nội" : doc.official_url.includes("congbao.chinhphu.vn") ? "Công báo Chính phủ — tìm kiếm" : "CSDL quốc gia về pháp luật")})
        </a>` : `<div class="source-note">ℹ️ Tài liệu nghiên cứu nội bộ, không phải văn bản pháp luật — không có nguồn phát hành chính thức.</div>`}
        <a class="source-link" href="https://github.com/hoanglong8/FOXAI-Data/blob/main/${doc.source_path}" target="_blank" rel="noopener">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          Bản PDF đã xử lý (lưu trên GitHub): ${escapeHtml(doc.source_name)}
        </a>
      </div>
      ${doc.pham_vi ? `<p>${doc.pham_vi}</p>` : ""}
      ${renderKV(doc)}
      ${renderList("Nội dung chính", doc.noi_dung)}
      ${doc.diem_dang_chu_y ? `<div class="note-box">💡 <b>Điểm đáng chú ý:</b> ${doc.diem_dang_chu_y}</div>` : ""}
      ${doc.che_tai ? `<div class="note-box red">⚖️ <b>Chế tài / trách nhiệm:</b> ${doc.che_tai}</div>` : ""}
    </div>
  </div>`;
}

function toggleDoc(id) {
  const el = document.getElementById("doc-" + id);
  if (!el) return;
  const wasOpen = el.classList.contains("open");
  el.classList.toggle("open", !wasOpen);
}

function renderCategory(containerId, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const docs = DOCS.filter((d) => d.type === type);
  el.innerHTML = docs.map(renderDocCard).join("");
}

function renderAllDocsInto(containerId, filterFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const docs = filterFn ? DOCS.filter(filterFn) : DOCS;
  el.innerHTML = docs.map(renderDocCard).join("");
}

function renderGlossary() {
  const el = document.getElementById("glossary-grid");
  if (!el) return;
  el.innerHTML = TERMS.map(
    (t) => `<div class="term-card">
      <div class="term">${escapeHtml(t.term)}</div>
      <div class="def">${t.def}</div>
      <div class="src">Nguồn: ${escapeHtml(t.src)}</div>
    </div>`
  ).join("");
}

function parseVNDate(s) {
  if (!s) return null;
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function renderTimeline() {
  const el = document.getElementById("timeline");
  if (!el) return;
  const withDate = DOCS
    .map((d) => ({ d, date: parseVNDate(d.ngay_hieu_luc_short || d.ngay_ban_hanh) }))
    .filter((x) => x.date)
    .sort((a, b) => a.date - b.date);
  el.innerHTML = withDate
    .map(
      ({ d }) => `<div class="tl-item">
        <div class="tl-date">${escapeHtml(d.ngay_hieu_luc_short || d.ngay_ban_hanh)}</div>
        <div class="tl-title">${escapeHtml(d.so_hieu)}</div>
        <div class="tl-desc">${escapeHtml(d.ten_tat)}</div>
      </div>`
    )
    .join("");
}

// ------- Tabs -------
function showTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("panel-" + tabId).classList.add("active");
  document.getElementById("tab-" + tabId).classList.add("active");
  document.getElementById("search-results").classList.remove("active");
  document.getElementById("tabs-scope").style.display = "";
  document.querySelector("main").classList.remove("search-mode");
  document.getElementById("search-input").value = "";
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ------- Search -------
function buildSearchIndex(doc) {
  return [doc.so_hieu, doc.ten_tat, doc.co_quan, doc.pham_vi, (doc.noi_dung || []).join(" "), doc.diem_dang_chu_y]
    .join(" ")
    .toLowerCase();
}

function doSearch(q) {
  const resultsEl = document.getElementById("search-results");
  const tabsScope = document.getElementById("tabs-scope");
  const mainEl = document.querySelector("main");
  q = q.trim().toLowerCase();
  if (!q) {
    resultsEl.classList.remove("active");
    tabsScope.style.display = "";
    mainEl.classList.remove("search-mode");
    return;
  }
  tabsScope.style.display = "none";
  mainEl.classList.add("search-mode");
  resultsEl.classList.add("active");
  const matches = DOCS.filter((d) => buildSearchIndex(d).includes(q));
  const termMatches = TERMS.filter((t) => (t.term + " " + t.def).toLowerCase().includes(q));
  let html = "";
  if (!matches.length && !termMatches.length) {
    html = `<div class="search-empty">Không tìm thấy kết quả cho "<b>${escapeHtml(q)}</b>". Thử từ khóa khác như "dữ liệu mở", "NDOP", "AI", "định danh"...</div>`;
  } else {
    html += `<div class="section-title"><h3>Kết quả tìm kiếm</h3><span class="count">${matches.length + termMatches.length} kết quả</span></div>`;
    html += `<div class="doc-list">${matches.map(renderDocCard).join("")}</div>`;
    if (termMatches.length) {
      html += `<div class="section-title"><h3>Thuật ngữ liên quan</h3></div><div class="glossary-grid">`;
      html += termMatches
        .map((t) => `<div class="term-card"><div class="term">${escapeHtml(t.term)}</div><div class="def">${t.def}</div></div>`)
        .join("");
      html += `</div>`;
    }
  }
  resultsEl.innerHTML = html;
  // re-bind onclick handlers work automatically since we use inline onclick in renderDocCard
}

// ------- Theme (light / dark / system) -------
const THEME_KEY = "foxai-theme-pref";
const systemDarkMql = window.matchMedia("(prefers-color-scheme: dark)");

function effectiveTheme(pref) {
  if (pref === "system") return systemDarkMql.matches ? "dark" : "light";
  return pref;
}

function applyTheme(pref) {
  document.documentElement.setAttribute("data-theme", effectiveTheme(pref));
  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.themeChoice === pref);
  });
}

function setTheme(pref) {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(saved);
  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.addEventListener("click", () => setTheme(b.dataset.themeChoice));
  });
  systemDarkMql.addEventListener("change", () => {
    const current = localStorage.getItem(THEME_KEY) || "dark";
    if (current === "system") applyTheme("system");
  });
}

// ------- Trợ lý AI (BYOK — khoá API do người dùng tự nhập, lưu & gửi trực tiếp từ trình duyệt) -------
const AI_KEYS = {
  provider: "foxai-ai-provider",
  apiKey: "foxai-ai-key",
  model: "foxai-ai-model",
};
const AI_DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5",
  gemini: "gemini-2.0-flash",
};
let aiChatHistory = [];

function aiSystemPrompt() {
  const list = DOCS.map((d) => `- ${d.so_hieu}: ${d.ten_tat}`).join("\n");
  return `Bạn là trợ lý tra cứu pháp luật Việt Nam về dữ liệu số và trí tuệ nhân tạo, phục vụ người dùng trang "Cẩm nang Pháp luật Dữ liệu & AI Việt Nam" của FoxAI. Trả lời ngắn gọn, chính xác, bằng tiếng Việt, và luôn nhắc người dùng đối chiếu văn bản gốc khi cần áp dụng thực tế vì nội dung trang chỉ mang tính tham khảo. Danh sách văn bản đã được hệ thống hoá trên trang:\n${list}`;
}

function aiRenderMessages() {
  const el = document.getElementById("ai-messages");
  if (!el) return;
  el.innerHTML = aiChatHistory
    .map(
      (m) =>
        `<div class="ai-msg ${m.role}"><div class="ai-bubble">${escapeHtml(m.content).replace(/\n/g, "<br>")}</div></div>`
    )
    .join("");
  el.scrollTop = el.scrollHeight;
}

function aiSetStatus(text, isError) {
  const el = document.getElementById("ai-status");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("error", !!isError);
}

async function aiCallOpenAI(apiKey, model, messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 300));
  const data = await res.json();
  return data.choices[0].message.content;
}

async function aiCallAnthropic(apiKey, model, system, history) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model, max_tokens: 1024, system, messages: history }),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 300));
  const data = await res.json();
  return data.content.map((c) => c.text || "").join("");
}

async function aiCallGemini(apiKey, model, system, history) {
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: system }] } }),
    }
  );
  if (!res.ok) throw new Error((await res.text()).slice(0, 300));
  const data = await res.json();
  return data.candidates[0].content.parts.map((p) => p.text || "").join("");
}

async function aiSend() {
  const input = document.getElementById("ai-input");
  const text = input.value.trim();
  if (!text) return;
  const provider = document.getElementById("ai-provider").value;
  const apiKey = document.getElementById("ai-key").value.trim();
  const model = document.getElementById("ai-model").value.trim() || AI_DEFAULT_MODEL[provider];
  if (!apiKey) {
    aiSetStatus("Vui lòng nhập API key trước khi hỏi.", true);
    return;
  }
  aiChatHistory.push({ role: "user", content: text });
  aiRenderMessages();
  input.value = "";
  aiSetStatus("Đang hỏi " + provider + "…");
  try {
    let reply;
    if (provider === "openai") {
      reply = await aiCallOpenAI(apiKey, model, [{ role: "system", content: aiSystemPrompt() }, ...aiChatHistory]);
    } else if (provider === "anthropic") {
      reply = await aiCallAnthropic(apiKey, model, aiSystemPrompt(), aiChatHistory);
    } else {
      reply = await aiCallGemini(apiKey, model, aiSystemPrompt(), aiChatHistory);
    }
    aiChatHistory.push({ role: "assistant", content: reply });
    aiRenderMessages();
    aiSetStatus("");
  } catch (err) {
    aiSetStatus("Lỗi khi gọi API: " + err.message, true);
  }
}

function aiOpenModal() {
  document.getElementById("ai-modal").classList.add("open");
}
function aiCloseModal() {
  document.getElementById("ai-modal").classList.remove("open");
}

function initAIAssistant() {
  const providerEl = document.getElementById("ai-provider");
  const keyEl = document.getElementById("ai-key");
  const modelEl = document.getElementById("ai-model");

  providerEl.value = localStorage.getItem(AI_KEYS.provider) || "openai";
  keyEl.value = localStorage.getItem(AI_KEYS.apiKey) || "";
  modelEl.value = localStorage.getItem(AI_KEYS.model) || AI_DEFAULT_MODEL[providerEl.value];
  modelEl.placeholder = AI_DEFAULT_MODEL[providerEl.value];

  providerEl.addEventListener("change", () => {
    modelEl.placeholder = AI_DEFAULT_MODEL[providerEl.value];
    if (!modelEl.value) modelEl.value = AI_DEFAULT_MODEL[providerEl.value];
    localStorage.setItem(AI_KEYS.provider, providerEl.value);
  });
  keyEl.addEventListener("change", () => localStorage.setItem(AI_KEYS.apiKey, keyEl.value.trim()));
  modelEl.addEventListener("change", () => localStorage.setItem(AI_KEYS.model, modelEl.value.trim()));

  document.getElementById("btn-ai-assistant").addEventListener("click", aiOpenModal);
  document.getElementById("ai-modal-close").addEventListener("click", aiCloseModal);
  document.getElementById("ai-modal").addEventListener("click", (e) => {
    if (e.target.id === "ai-modal") aiCloseModal();
  });
  document.getElementById("ai-send").addEventListener("click", aiSend);
  document.getElementById("ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      aiSend();
    }
  });
  document.getElementById("ai-clear").addEventListener("click", () => {
    aiChatHistory = [];
    aiRenderMessages();
    aiSetStatus("");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAllDocsInto("cat-luat", (d) => d.type === "luat" || d.type === "nghidinh");
  renderAllDocsInto("cat-khungkientruc", (d) => d.category === "khungkientruc");
  renderAllDocsInto("cat-hanoi", (d) => d.category === "hanoi");
  renderAllDocsInto("cat-tatca");
  renderGlossary();
  renderTimeline();

  document.getElementById("search-input").addEventListener("input", (e) => doSearch(e.target.value));

  initTheme();
  initAIAssistant();
});
