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
      ${doc.pham_vi ? `<p>${doc.pham_vi}</p>` : ""}
      ${renderKV(doc)}
      ${renderList("Nội dung chính", doc.noi_dung)}
      ${doc.diem_dang_chu_y ? `<div class="note-box">💡 <b>Điểm đáng chú ý:</b> ${doc.diem_dang_chu_y}</div>` : ""}
      ${doc.che_tai ? `<div class="note-box red">⚖️ <b>Chế tài / trách nhiệm:</b> ${doc.che_tai}</div>` : ""}
      <a class="source-link" href="https://github.com/hoanglong8/FOXAI-Data/blob/main/${doc.source_path}" target="_blank" rel="noopener">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
        Xem văn bản gốc trên GitHub: ${escapeHtml(doc.source_name)}
      </a>
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

document.addEventListener("DOMContentLoaded", () => {
  renderAllDocsInto("cat-luat", (d) => d.type === "luat" || d.type === "nghidinh");
  renderAllDocsInto("cat-khungkientruc", (d) => d.category === "khungkientruc");
  renderAllDocsInto("cat-hanoi", (d) => d.category === "hanoi");
  renderAllDocsInto("cat-tatca");
  renderGlossary();
  renderTimeline();

  document.getElementById("search-input").addEventListener("input", (e) => doSearch(e.target.value));
});
