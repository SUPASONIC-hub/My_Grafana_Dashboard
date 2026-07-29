const palette = ["#5794f2", "#73bf69", "#f2cc0c", "#f2495c", "#b877d9", "#ff9830"];
const platforms = ["웹", "IOS", "AOS"];
const pages = ["홈", "웨딩홀 상세", "스드메 패키지", "견적 비교", "리뷰", "상담 신청", "이벤트"];
const keywords = ["스몰웨딩", "본식스냅", "드레스", "웨딩홀", "메이크업", "청첩장"];
const customerTypes = ["예비신부", "예비신랑", "동행가족", "플래너", "비회원"];
let state = { seed: 42, range: 30, user: "", live: true };
let timer;
const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("ko-KR");

function rand() {
  state.seed = (state.seed * 1664525 + 1013904223) % 4294967296;
  return state.seed / 4294967296;
}
function number(base, spread = 0.2) {
  const userBoost = state.user ? 0.72 + (state.user.length % 5) * 0.08 : 1;
  const rangeBoost = Math.sqrt(state.range / 30);
  return Math.round(base * userBoost * rangeBoost * (1 + (rand() - 0.5) * spread));
}
function pct(value) { return `${value.toFixed(1)}%`; }
function heatColor(value) {
  if (value >= 70) return "#73bf69";
  if (value >= 45) return "#f2cc0c";
  return "#f2495c";
}
function renderTable(id, columns, rows) {
  const head = columns.map((col) => `<th class="${col.num ? "num" : ""}">${col.label}</th>`).join("");
  const body = rows.map((row) => `<tr>${columns.map((col) => {
    const raw = row[col.key];
    const value = col.heat ? `<span class="heat" style="background:${heatColor(Number(raw))}">${col.format ? col.format(raw) : raw}</span>` : col.format ? col.format(raw) : raw;
    return `<td class="${col.num ? "num" : ""}">${value}</td>`;
  }).join("")}</tr>`).join("");
  $(id).innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
function makePlatformRows() {
  const values = platforms.map((platform, index) => ({ platform, sessions: number([62000, 42000, 38000][index], 0.28) }));
  const total = values.reduce((sum, row) => sum + row.sessions, 0);
  return [{ platform: "전체", sessions: total }, ...values].map((row) => ({
    ...row,
    share: row.platform === "전체" ? 100 : (row.sessions / total) * 100,
    duration: number(row.platform === "웹" ? 495 : row.platform === "IOS" ? 438 : 416, 0.18),
    pv: 2.4 + rand() * 2.2,
  }));
}
function lineSeries(points, base, volatility) {
  return Array.from({ length: points }, (_, index) => ({ label: `${String(index).padStart(2, "0")}:00`, value: Math.max(10, number(base + Math.sin(index / 2.4) * base * 0.28, volatility)) }));
}
function multiSeries(labels) {
  return labels.map((label, index) => ({ label, color: palette[index], points: lineSeries(24, 36 + index * 11, 0.34).map((point) => ({ ...point, value: point.value + index * 8 })) }));
}
function renderLineChart(id, series) {
  const width = 1000, height = 330, pad = 42;
  const all = series.flatMap((item) => item.points.map((point) => point.value));
  const max = Math.max(...all) * 1.12;
  const x = (i) => pad + (i / (series[0].points.length - 1)) * (width - pad * 1.5);
  const y = (v) => height - pad - (v / max) * (height - pad * 1.4);
  const grid = [0.25, 0.5, 0.75, 1].map((ratio) => `<line class="tick" x1="${pad}" y1="${height - pad - ratio * (height - pad * 1.4)}" x2="${width - pad / 2}" y2="${height - pad - ratio * (height - pad * 1.4)}"/>`).join("");
  const paths = series.map((item) => `<path d="${item.points.map((point, i) => `${i ? "L" : "M"} ${x(i)} ${y(point.value)}`).join(" ")}" fill="none" stroke="${item.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const labels = series[0].points.filter((_, i) => i % 4 === 0).map((point, i) => `<text x="${x(i * 4)}" y="${height - 9}" fill="#a7abb3" font-size="11" text-anchor="middle">${point.label}</text>`).join("");
  const legend = series.map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`).join("");
  $(id).innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="시계열 그래프">${grid}<line class="axis" x1="${pad}" y1="${height - pad}" x2="${width - pad / 2}" y2="${height - pad}"/>${paths}${labels}</svg><div class="legend">${legend}</div>`;
}
function renderBarChart(id, rows, labelKey, valueKeys) {
  const width = 1000, rowH = 42, height = Math.max(260, rows.length * rowH + 46), labelW = 210;
  const max = Math.max(...rows.flatMap((row) => valueKeys.map((key) => row[key.key])));
  const bars = rows.map((row, r) => {
    let offset = labelW;
    const label = `<text x="12" y="${r * rowH + 28}" fill="#d8d9da" font-size="12">${row[labelKey]}</text>`;
    const pieces = valueKeys.map((key, i) => {
      const w = (row[key.key] / max) * (width - labelW - 80);
      const rect = `<rect x="${offset}" y="${r * rowH + 10}" width="${w}" height="22" rx="2" fill="${key.color || palette[i]}" opacity="0.9"></rect>`;
      const text = w > 54 ? `<text x="${offset + w - 8}" y="${r * rowH + 26}" fill="#061016" font-size="12" font-weight="800" text-anchor="end">${fmt.format(row[key.key])}</text>` : "";
      offset += w;
      return rect + text;
    }).join("");
    return label + pieces;
  }).join("");
  const legend = valueKeys.map((key, i) => `<span><i style="background:${key.color || palette[i]}"></i>${key.label}</span>`).join("");
  $(id).innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="막대 그래프">${bars}</svg><div class="legend">${legend}</div>`;
}
function renderGauge(id, rows) {
  $(id).innerHTML = rows.map((row, index) => `<div class="gauge"><strong>${row.label}</strong><span class="bar-track"><span class="bar-fill" style="width:${row.value}%;background:${palette[index]}"></span></span><span>${pct(row.value)}</span></div>`).join("");
}
function buildData() {
  const platformRows = makePlatformRows();
  const totalSessions = platformRows[0].sessions;
  const avgDuration = Math.round(platformRows.slice(1).reduce((sum, row) => sum + row.duration, 0) / 3);
  const avgPv = platformRows.slice(1).reduce((sum, row) => sum + row.pv, 0) / 3;
  const zeroRate = 10 + rand() * 9;
  $("kpiSessions").textContent = fmt.format(totalSessions);
  $("kpiDuration").textContent = `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`;
  $("kpiPv").textContent = avgPv.toFixed(1);
  $("kpiZero").textContent = pct(zeroRate);
  $("kpiSessionsDelta").textContent = `+${pct(4 + rand() * 8)}`;
  $("kpiDurationDelta").textContent = `+${pct(2 + rand() * 5)}`;
  $("kpiPvDelta").textContent = `+${pct(1 + rand() * 4)}`;
  $("kpiZeroDelta").textContent = `-${pct(1 + rand() * 3)}`;
  renderTable("platformShare", [{ key: "platform", label: "플랫폼" }, { key: "sessions", label: "세션 수", num: true, format: fmt.format }, { key: "share", label: "비율", num: true, heat: true, format: pct }], platformRows);
  renderTable("durationTable", [{ key: "platform", label: "플랫폼" }, { key: "duration", label: "평균 체류시간", num: true, format: (v) => `${Math.floor(v / 60)}m ${v % 60}s` }, { key: "share", label: "세션 비중", num: true, heat: true, format: pct }], platformRows.slice(1));
  renderTable("pvTable", [{ key: "platform", label: "플랫폼" }, { key: "pv", label: "세션당 PV", num: true, format: (v) => v.toFixed(2) }, { key: "sessions", label: "세션 수", num: true, format: fmt.format }], platformRows.slice(1));
  renderTable("durationDistribution", [{ key: "bucket", label: "체류시간 구간" }, { key: "web", label: "웹", num: true, format: fmt.format }, { key: "ios", label: "IOS", num: true, format: fmt.format }, { key: "aos", label: "AOS", num: true, format: fmt.format }], ["0-30초", "30초-3분", "3-10분", "10분 이상"].map((bucket, i) => ({ bucket, web: number(4200 - i * 420, 0.32), ios: number(3200 - i * 300, 0.3), aos: number(2800 - i * 260, 0.3) })));
  renderTable("benchmarkTable", [{ key: "platform", label: "플랫폼" }, { key: "above", label: "기준 초과", num: true, heat: true, format: pct }, { key: "below", label: "기준 이하", num: true, format: pct }], platformRows.slice(1).map((row) => { const above = 42 + rand() * 22; return { platform: row.platform, above, below: 100 - above }; }));
  renderLineChart("trafficTrend", [{ label: "웹", color: palette[0], points: lineSeries(24, 4200, 0.46) }, { label: "IOS", color: palette[1], points: lineSeries(24, 2800, 0.42) }, { label: "AOS", color: palette[2], points: lineSeries(24, 2400, 0.38) }]);
  renderLineChart("pipelineTrend", multiSeries(customerTypes.slice(0, 4)));
  renderTable("memberTable", [{ key: "type", label: "고객 타입" }, { key: "members", label: "누적 회원", num: true, format: fmt.format }, { key: "active", label: "활성 세션", num: true, format: fmt.format }, { key: "rate", label: "활성 비중", num: true, heat: true, format: pct }], customerTypes.map((type, i) => ({ type, members: number(18000 - i * 2100, 0.26), active: number(5200 - i * 530, 0.3), rate: 38 + rand() * 34 })));
  renderTable("aboveAverageTable", [{ key: "type", label: "고객 타입" }, { key: "sessions", label: "초과 세션", num: true, format: fmt.format }, { key: "avg", label: "평균 체류시간", num: true }, { key: "users", label: "고객 수", num: true, format: fmt.format }], customerTypes.slice(0, 4).map((type, i) => ({ type, sessions: number(3400 - i * 280, 0.28), avg: `${7 + i}m ${number(22, 0.7)}s`, users: number(1480 - i * 110, 0.24) })));
  renderTable("profileTable", [{ key: "user", label: "유저 ID" }, { key: "type", label: "고객 타입" }, { key: "status", label: "상태" }, { key: "last", label: "최근 행동" }], Array.from({ length: 8 }, (_, i) => ({ user: state.user || `user-${String(41 + i).padStart(3, "0")}`, type: customerTypes[i % customerTypes.length], status: i % 3 ? "활성" : "상담 예정", last: pages[i % pages.length] })));
  renderTable("recommendTable", [{ key: "candidate", label: "추천 후보" }, { key: "reason", label: "추천 근거" }, { key: "score", label: "적합도", num: true, heat: true, format: pct }], ["웨딩홀 상담", "스드메 패키지", "본식스냅", "드레스 피팅", "청첩장 샘플"].map((candidate) => ({ candidate, reason: `${keywords[Math.floor(rand() * keywords.length)]} 탐색 빈도`, score: 54 + rand() * 38 })));
  renderTable("journeyTable", [{ key: "session", label: "세션" }, { key: "journey", label: "페이지 이동 경로" }, { key: "duration", label: "체류시간", num: true }], Array.from({ length: 7 }, (_, i) => ({ session: `s-${number(9000 + i, 0.02)}`, journey: pages.slice(i % 3, (i % 3) + 4).join(" > "), duration: `${4 + i}m ${number(18, 0.7)}s` })));
  const pageRows = pages.map((page, i) => ({ page, views: number(76000 - i * 6500, 0.28), sessions: number(34000 - i * 2800, 0.25), pv: 1.8 + rand() * 3.4, scroll: 34 + rand() * 54, deep: 18 + rand() * 42 }));
  renderTable("pageViewsTable", [{ key: "page", label: "페이지 제목" }, { key: "views", label: "전체 조회수", num: true, format: fmt.format }, { key: "sessions", label: "조회 세션 수", num: true, format: fmt.format }, { key: "pv", label: "세션당 PV", num: true, format: (v) => v.toFixed(2) }], pageRows);
  renderBarChart("entryExitChart", pageRows.slice(0, 6).map((row) => ({ page: row.page, entry: number(row.sessions * 0.34, 0.3), exit: number(row.sessions * 0.21, 0.3) })), "page", [{ key: "entry", label: "진입", color: palette[1] }, { key: "exit", label: "이탈", color: palette[3] }]);
  renderTable("scrollTable", [{ key: "page", label: "페이지 제목" }, { key: "views", label: "전체 조회수", num: true, format: fmt.format }, { key: "scroll", label: "평균 스크롤 깊이", num: true, heat: true, format: pct }, { key: "deep", label: "깊은 탐색 비율", num: true, heat: true, format: pct }], pageRows);
  renderBarChart("eventChart", ["페이지 조회", "버튼 클릭", "상품 클릭", "검색", "검색 결과 클릭", "콘텐츠 공유", "스크랩"].map((event, i) => ({ event, count: number(98000 - i * 9700, 0.35) })), "event", [{ key: "count", label: "이벤트 수", color: palette[0] }]);
  renderTable("searchTable", [{ key: "keyword", label: "검색어" }, { key: "count", label: "검색 수", num: true, format: fmt.format }, { key: "zero", label: "무결과율", num: true, heat: true, format: pct }], keywords.map((keyword, i) => ({ keyword, count: number(9200 - i * 730, 0.34), zero: 6 + rand() * 22 })));
  renderTable("keywordTypeTable", [{ key: "type", label: "고객 타입" }, { key: "top", label: "상위 검색어" }, { key: "share", label: "검색 비중", num: true, heat: true, format: pct }], customerTypes.map((type, i) => ({ type, top: keywords[i % keywords.length], share: 18 + rand() * 32 })));
  renderTable("ctaTable", [{ key: "target", label: "클릭 대상" }, { key: "clicks", label: "클릭 수", num: true, format: fmt.format }, { key: "ctr", label: "CTR", num: true, heat: true, format: pct }], ["상담 신청 CTA", "견적 비교 버튼", "메인 배너", "리뷰 더보기", "예약 문의"].map((target, i) => ({ target, clicks: number(18400 - i * 1650, 0.28), ctr: 8 + rand() * 21 })));
  renderTable("productTable", [{ key: "product", label: "상품·업체" }, { key: "clicks", label: "클릭 수", num: true, format: fmt.format }, { key: "users", label: "유저 수", num: true, format: fmt.format }], ["라움 웨딩홀", "아뜰리에 드레스", "브라이트 스냅", "블룸 메이크업", "오브제 플라워"].map((product, i) => ({ product, clicks: number(9600 - i * 810, 0.33), users: number(4200 - i * 290, 0.3) })));
  renderTable("qualityTable", [{ key: "keyword", label: "검색어" }, { key: "result", label: "평균 결과 수", num: true, format: (v) => v.toFixed(1) }, { key: "clickRate", label: "결과 클릭률", num: true, heat: true, format: pct }], keywords.map((keyword) => ({ keyword, result: 8 + rand() * 31, clickRate: 32 + rand() * 48 })));
  renderTable("conversionTable", [{ key: "keyword", label: "검색어" }, { key: "search", label: "검색 세션", num: true, format: fmt.format }, { key: "product", label: "상품 클릭 세션", num: true, format: fmt.format }, { key: "conversion", label: "전환율", num: true, heat: true, format: pct }], keywords.map((keyword, i) => { const search = number(6400 - i * 430, 0.3); const conversion = 18 + rand() * 36; return { keyword, search, product: Math.round((search * conversion) / 100), conversion }; }));
  renderGauge("scrapGauge", ["신규 스크랩", "유지", "취소", "재스크랩"].map((label, i) => ({ label, value: [38, 31, 14, 17][i] + (rand() - 0.5) * 8 })));
  renderTable("scrapSourceTable", [{ key: "status", label: "최종 상태" }, { key: "source", label: "발생 화면" }, { key: "count", label: "건수", num: true, format: fmt.format }], ["신규 스크랩", "유지", "취소", "재스크랩", "보류"].map((status, i) => ({ status, source: pages[(i + 1) % pages.length], count: number(3600 - i * 360, 0.32) })));
  renderBarChart("environmentChart", ["웹 데스크톱", "웹 모바일", "IOS 모바일", "AOS 모바일", "IOS 태블릿", "AOS 태블릿"].map((env, i) => ({ env, sessions: number(38000 - i * 4300, 0.32) })), "env", [{ key: "sessions", label: "세션 수", color: palette[2] }]);
}
function refresh() {
  state.seed = Date.now() % 4294967296;
  buildData();
}
$("userSearch").addEventListener("input", (event) => { state.user = event.target.value.trim(); state.seed = 42 + state.user.length * 97 + state.range; buildData(); });
$("rangeSelect").addEventListener("change", (event) => { state.range = Number(event.target.value); state.seed += state.range * 13; buildData(); });
$("refreshButton").addEventListener("click", refresh);
$("liveToggle").addEventListener("change", (event) => { state.live = event.target.checked; if (state.live) startTimer(); else clearInterval(timer); });
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => { if (state.live) refresh(); }, 8000);
}
buildData();
startTimer();
