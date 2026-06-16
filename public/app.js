const storageKey = "torAssistantState.v1";

const statuses = ["พบประกาศ", "กำลังตรวจ TOR", "รอเอกสาร", "พร้อมยื่น", "ยื่นแล้ว"];

const baseDocuments = [
  "หนังสือรับรองบริษัท",
  "สำเนาบัตรประชาชนกรรมการ/ผู้รับมอบอำนาจ",
  "ภพ.20 หรือเอกสารทะเบียนภาษีมูลค่าเพิ่ม",
  "หนังสือมอบอำนาจและติดอากรแสตมป์",
  "บัญชีเอกสารแนบ",
  "ใบเสนอราคา",
  "ข้อเสนอด้านเทคนิค",
  "แคตตาล็อกหรือรายละเอียดสินค้า/บริการ",
];

const documentRules = [
  { words: ["หลักประกัน", "ประกันซอง"], doc: "หลักประกันการเสนอราคา" },
  { words: ["ผลงาน", "สัญญา", "หนังสือรับรองผลงาน"], doc: "หนังสือรับรองผลงานย้อนหลัง" },
  { words: ["ใบอนุญาต", "ได้รับอนุญาต"], doc: "ใบอนุญาตที่เกี่ยวข้อง" },
  { words: ["บุคลากร", "วิศวกร", "ผู้เชี่ยวชาญ"], doc: "ประวัติบุคลากรและใบรับรองวิชาชีพ" },
  { words: ["ISO", "มาตรฐาน"], doc: "ใบรับรองมาตรฐาน/ISO" },
  { words: ["แผนดำเนินงาน", "ระยะเวลาดำเนินการ"], doc: "แผนดำเนินงานและกำหนดส่งมอบ" },
  { words: ["บัญชี", "งบการเงิน"], doc: "งบการเงินหรือเอกสารฐานะทางการเงิน" },
];

const riskRules = [
  {
    words: ["ผลงานย้อนหลัง", "ไม่น้อยกว่า", "ภายในระยะเวลา"],
    title: "ตรวจเงื่อนไขผลงานย้อนหลัง",
    detail: "TOR มีเงื่อนไขผลงานย้อนหลัง ควรเทียบมูลค่าและขอบเขตงานให้ตรงก่อนยื่น",
    score: 12,
  },
  {
    words: ["หลักประกัน", "ประกันซอง"],
    title: "ต้องเตรียมหลักประกัน",
    detail: "ควรตรวจวงเงิน รูปแบบหลักประกัน และวันหมดอายุให้ครอบคลุมวันยื่น",
    score: 9,
  },
  {
    words: ["ส่งมอบภายใน", "ระยะเวลา", "วันทำการ"],
    title: "ระยะเวลาส่งมอบอาจกดดัน",
    detail: "ควรประเมินกำลังผลิต ทีมงาน และเวลาตรวจรับให้รอบคอบ",
    score: 10,
  },
  {
    words: ["ปรับ", "ค่าปรับ"],
    title: "มีเงื่อนไขค่าปรับ",
    detail: "ควรคำนวณความเสี่ยงหากส่งมอบล่าช้าหรือแก้งานหลายรอบ",
    score: 8,
  },
  {
    words: ["ใบอนุญาต", "ISO", "มาตรฐาน"],
    title: "มีเอกสารรับรองเฉพาะ",
    detail: "ตรวจว่าเอกสารรับรองยังไม่หมดอายุและตรงกับชื่อบริษัทผู้ยื่น",
    score: 8,
  },
];

const demoTor = `โครงการจ้างพัฒนาระบบบริหารเอกสารอิเล็กทรอนิกส์ งบประมาณ 2,500,000 บาท
ผู้เสนอราคาต้องมีผลงานย้อนหลังด้านพัฒนาระบบสารสนเทศ ไม่น้อยกว่า 1,500,000 บาท ภายในระยะเวลา 3 ปี
ต้องยื่นหนังสือรับรองบริษัท ภพ.20 หนังสือมอบอำนาจ ใบเสนอราคา ข้อเสนอด้านเทคนิค แผนดำเนินงาน และประวัติบุคลากร
ต้องมีบุคลากรตำแหน่ง Project Manager, System Analyst และ Programmer
กำหนดส่งมอบภายใน 120 วัน และมีค่าปรับกรณีส่งมอบล่าช้า
ต้องวางหลักประกันการเสนอราคา และรับประกันผลงานหลังส่งมอบ 1 ปี`;

const $ = (id) => document.getElementById(id);

let state = {
  current: {
    title: "",
    agency: "",
    budget: "",
    deadline: "",
    category: "เทคโนโลยีสารสนเทศ",
    torText: "",
    analysis: null,
  },
  pipeline: [],
  documents: [
    { name: "หนังสือรับรองบริษัท", expiry: addDays(72) },
    { name: "ภพ.20", expiry: addDays(365) },
    { name: "หนังสือรับรองผลงาน", expiry: addDays(24) },
  ],
};

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  $("savedState").textContent = "บันทึกล่าสุดแล้ว";
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    state = { ...state, ...JSON.parse(raw) };
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function syncFormFromState() {
  $("bidTitle").value = state.current.title || "";
  $("agency").value = state.current.agency || "";
  $("budget").value = state.current.budget || "";
  $("deadline").value = state.current.deadline || "";
  $("category").value = state.current.category || "เทคโนโลยีสารสนเทศ";
  $("torText").value = state.current.torText || "";
}

function syncStateFromForm() {
  state.current.title = $("bidTitle").value.trim();
  state.current.agency = $("agency").value.trim();
  state.current.budget = $("budget").value.trim();
  state.current.deadline = $("deadline").value;
  state.current.category = $("category").value;
  state.current.torText = $("torText").value.trim();
  saveState();
}

function containsAny(text, words) {
  return words.some((word) => text.toLowerCase().includes(word.toLowerCase()));
}

function extractBudget(text, fallback) {
  if (fallback) return fallback;
  const match = text.match(/(?:งบประมาณ|ราคากลาง)[^\d]*(\d[\d,]*(?:\.\d+)?)/);
  return match ? `${match[1]} บาท` : "ไม่พบข้อมูล";
}

function extractDelivery(text) {
  const match = text.match(/(?:ส่งมอบ|ดำเนินงาน|ดำเนินการ)[^\d]*(\d{1,4})\s*(?:วัน|เดือน)/);
  return match ? `${match[1]} วัน/เดือนตามข้อความ TOR` : "ไม่พบข้อมูล";
}

function extractQualification(text) {
  const found = [];
  if (text.includes("ผลงาน")) found.push("มีผลงานย้อนหลังตรงตาม TOR");
  if (text.includes("บุคลากร")) found.push("มีบุคลากรตามตำแหน่งที่กำหนด");
  if (text.includes("ใบอนุญาต")) found.push("มีใบอนุญาตที่เกี่ยวข้อง");
  if (text.includes("ISO") || text.includes("มาตรฐาน")) found.push("มีใบรับรองมาตรฐาน");
  return found.length ? found.join(", ") : "ไม่พบเงื่อนไขคุณสมบัติชัดเจน";
}

function buildChecklist(text) {
  const docs = new Set(baseDocuments);
  documentRules.forEach((rule) => {
    if (containsAny(text, rule.words)) docs.add(rule.doc);
  });
  return [...docs].map((name) => ({ name, done: false }));
}

function buildRisks(text, deadline) {
  const risks = riskRules.filter((rule) => containsAny(text, rule.words));
  const days = getDaysLeft(deadline);
  if (days !== null && days < 7) {
    risks.push({
      title: "กำหนดยื่นใกล้มาก",
      detail: "ควรเร่งยืนยันผู้ลงนาม เอกสารหลักประกัน และเวลาส่งผ่านระบบ",
      score: 18,
    });
  }
  if (text.length < 150) {
    risks.push({
      title: "ข้อมูล TOR ยังน้อย",
      detail: "ควรเพิ่มข้อความ TOR ให้ครบก่อนใช้ผลประเมินตัดสินใจ",
      score: 10,
    });
  }
  return risks;
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

function analyzeCurrent() {
  syncStateFromForm();
  const text = state.current.torText;
  const checklist = buildChecklist(text);
  const risks = buildRisks(text, state.current.deadline);
  const riskScore = risks.reduce((sum, risk) => sum + risk.score, 0);
  const docPenalty = checklist.length > 10 ? 8 : 0;
  const missingDeadlinePenalty = state.current.deadline ? 0 : 8;
  const score = Math.max(0, Math.min(100, 88 - riskScore - docPenalty - missingDeadlinePenalty + Math.min(12, Math.floor(text.length / 180))));
  const decision = score >= 72 ? "ควรยื่น" : score >= 50 ? "ยื่นได้ แต่ต้องเตรียมเพิ่ม" : "ควรตรวจเงื่อนไขก่อนตัดสินใจ";

  state.current.analysis = {
    score,
    decision,
    riskLevel: score >= 72 ? "ต่ำ" : score >= 50 ? "กลาง" : "สูง",
    checklist,
    risks,
    summary: [
      { title: "ขอบเขตงาน", detail: state.current.title || guessScope(text) },
      { title: "หน่วยงาน", detail: state.current.agency || "ไม่พบข้อมูล" },
      { title: "งบประมาณ", detail: extractBudget(text, state.current.budget) },
      { title: "ระยะเวลาส่งมอบ", detail: extractDelivery(text) },
      { title: "คุณสมบัติเด่น", detail: extractQualification(text) },
    ],
  };
  saveState();
  renderAnalysis();
}

function guessScope(text) {
  const firstLine = text.split(/\n/).find((line) => line.trim().length > 8);
  return firstLine || "ไม่พบข้อมูล";
}

function renderAnalysis() {
  const analysis = state.current.analysis;
  if (!analysis) return;

  $("decisionText").textContent = analysis.decision;
  $("scoreValue").textContent = analysis.score;
  $("riskLevel").textContent = analysis.riskLevel;
  $("docCount").textContent = analysis.checklist.length;
  const days = getDaysLeft(state.current.deadline);
  $("daysLeft").textContent = days === null ? "-" : days < 0 ? "เลยกำหนด" : `${days} วัน`;

  $("summaryList").className = "summary-list";
  $("summaryList").innerHTML = analysis.summary
    .map((item) => `<article class="summary-item"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></article>`)
    .join("");

  $("checklistList").className = "checklist-list";
  $("checklistList").innerHTML = analysis.checklist
    .map(
      (item, index) =>
        `<label class="check-item"><input type="checkbox" data-check="${index}" ${item.done ? "checked" : ""}><span>${escapeHtml(item.name)}</span></label>`
    )
    .join("");

  $("riskList").className = "risk-list";
  $("riskList").innerHTML = analysis.risks.length
    ? analysis.risks
        .map((risk) => `<article class="risk-item"><strong>${escapeHtml(risk.title)}</strong><span>${escapeHtml(risk.detail)}</span></article>`)
        .join("")
    : `<div class="empty-state">ยังไม่พบความเสี่ยงสำคัญจากข้อความนี้</div>`;
}

function renderPipeline() {
  const board = $("pipelineBoard");
  board.innerHTML = statuses
    .map((status) => {
      const cards = state.pipeline.filter((bid) => bid.status === status);
      const cardHtml = cards.length
        ? cards
            .map(
              (bid) => `<article class="pipeline-card">
                <strong>${escapeHtml(bid.title)}</strong>
                <span>${escapeHtml(bid.agency || "ไม่ระบุหน่วยงาน")}</span>
                <span>${bid.deadline ? `ปิดรับ ${escapeHtml(bid.deadline)}` : "ยังไม่ระบุวันปิดรับ"}</span>
                <select data-pipeline="${bid.id}">
                  ${statuses.map((item) => `<option value="${item}" ${item === bid.status ? "selected" : ""}>${item}</option>`).join("")}
                </select>
              </article>`
            )
            .join("")
        : `<div class="empty-state">ยังไม่มีงาน</div>`;
      return `<div class="pipeline-column"><h4>${status}</h4>${cardHtml}</div>`;
    })
    .join("");

  $("todaySummary").textContent = state.pipeline.length
    ? `${state.pipeline.length} งานในกระดาน, ${state.pipeline.filter((bid) => bid.status === "พร้อมยื่น").length} งานพร้อมยื่น`
    : "ยังไม่มีงานที่บันทึก";
}

function renderDocuments() {
  const vault = $("documentVault");
  vault.innerHTML = state.documents
    .map((doc, index) => {
      const days = getDaysLeft(doc.expiry);
      const statusClass = days !== null && days < 0 ? "danger" : days !== null && days <= 30 ? "warn" : "";
      const label = days === null ? "ไม่ระบุวันหมดอายุ" : days < 0 ? "หมดอายุแล้ว" : days <= 30 ? `เหลือ ${days} วัน` : "พร้อมใช้";
      return `<article class="doc-item">
        <strong>${escapeHtml(doc.name)}</strong>
        <span>หมดอายุ: ${doc.expiry || "-"}</span>
        <span class="doc-status ${statusClass}">${label}</span>
        <button class="ghost-btn" data-remove-doc="${index}" type="button">ลบ</button>
      </article>`;
    })
    .join("");
}

function saveToPipeline() {
  syncStateFromForm();
  if (!state.current.title && !state.current.torText) {
    alert("กรอกชื่องานหรือข้อความ TOR ก่อนบันทึกเข้ากระดาน");
    return;
  }
  const title = state.current.title || guessScope(state.current.torText);
  state.pipeline.unshift({
    id: createId(),
    title,
    agency: state.current.agency,
    deadline: state.current.deadline,
    status: "กำลังตรวจ TOR",
    score: state.current.analysis?.score || 0,
  });
  saveState();
  renderPipeline();
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `bid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function exportSummary() {
  syncStateFromForm();
  if (!state.current.analysis) analyzeCurrent();
  const analysis = state.current.analysis;
  const lines = [
    "สรุปวิเคราะห์ TOR",
    `ชื่องาน: ${state.current.title || guessScope(state.current.torText)}`,
    `หน่วยงาน: ${state.current.agency || "-"}`,
    `งบประมาณ: ${extractBudget(state.current.torText, state.current.budget)}`,
    `วันปิดรับข้อเสนอ: ${state.current.deadline || "-"}`,
    `ผลประเมิน: ${analysis.decision} (${analysis.score}/100)`,
    "",
    "สาระสำคัญ",
    ...analysis.summary.map((item) => `- ${item.title}: ${item.detail}`),
    "",
    "Checklist เอกสาร",
    ...analysis.checklist.map((item) => `- ${item.name}`),
    "",
    "ความเสี่ยง",
    ...(analysis.risks.length ? analysis.risks.map((risk) => `- ${risk.title}: ${risk.detail}`) : ["- ไม่พบความเสี่ยงสำคัญ"]),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tor-summary.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  ["bidTitle", "agency", "budget", "deadline", "category", "torText"].forEach((id) => {
    $(id).addEventListener("input", () => {
      $("savedState").textContent = "กำลังบันทึก...";
      syncStateFromForm();
    });
  });

  $("torFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    $("torText").value = text;
    syncStateFromForm();
  });

  $("analyzeBtn").addEventListener("click", analyzeCurrent);
  $("saveToPipelineBtn").addEventListener("click", saveToPipeline);
  $("exportBtn").addEventListener("click", exportSummary);
  $("loadDemoBtn").addEventListener("click", () => {
    $("bidTitle").value = "จ้างพัฒนาระบบบริหารเอกสารอิเล็กทรอนิกส์";
    $("agency").value = "กรมตัวอย่าง";
    $("budget").value = "2,500,000 บาท";
    $("deadline").value = addDays(14);
    $("category").value = "เทคโนโลยีสารสนเทศ";
    $("torText").value = demoTor;
    syncStateFromForm();
    analyzeCurrent();
  });

  $("newBidBtn").addEventListener("click", () => {
    state.current = {
      title: "",
      agency: "",
      budget: "",
      deadline: "",
      category: "เทคโนโลยีสารสนเทศ",
      torText: "",
      analysis: null,
    };
    syncFormFromState();
    saveState();
    location.reload();
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      $(`${tab.dataset.tab}Tab`).classList.add("active");
    });
  });

  $("checklistList").addEventListener("change", (event) => {
    const index = event.target.dataset.check;
    if (index === undefined || !state.current.analysis) return;
    state.current.analysis.checklist[index].done = event.target.checked;
    saveState();
  });

  $("pipelineBoard").addEventListener("change", (event) => {
    const id = event.target.dataset.pipeline;
    if (!id) return;
    const bid = state.pipeline.find((item) => item.id === id);
    if (bid) bid.status = event.target.value;
    saveState();
    renderPipeline();
  });

  $("addDocBtn").addEventListener("click", () => $("docDialog").showModal());
  $("cancelDocBtn").addEventListener("click", () => $("docDialog").close());
  $("saveDocBtn").addEventListener("click", () => {
    const name = $("docName").value.trim();
    if (!name) return;
    state.documents.push({ name, expiry: $("docExpiry").value });
    $("docName").value = "";
    $("docExpiry").value = "";
    $("docDialog").close();
    saveState();
    renderDocuments();
  });

  $("documentVault").addEventListener("click", (event) => {
    const index = event.target.dataset.removeDoc;
    if (index === undefined) return;
    state.documents.splice(Number(index), 1);
    saveState();
    renderDocuments();
  });
}

loadState();
syncFormFromState();
bindEvents();
if (state.current.analysis) renderAnalysis();
renderPipeline();
renderDocuments();
