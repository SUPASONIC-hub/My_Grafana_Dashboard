const colors = {
  blue: "#5794f2",
  green: "#73bf69",
  yellow: "#fade2a",
  orange: "#ff9830",
  red: "#f2495c",
  purple: "#b877d9",
};

const palette = [colors.blue, colors.green, colors.yellow, colors.orange, colors.red, colors.purple];
const fmt = new Intl.NumberFormat("ko-KR");
const $ = (id) => document.getElementById(id);
let seed = 26;
let activePanelId = null;
let activeInspectMode = "query";

function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function number(base, spread = 0.25) {
  return Math.max(0, Math.round(base * (1 + (rand() - 0.5) * spread)));
}

function pick(items, index) {
  return items[index % items.length];
}

function pct(value) {
  return `${Number(value).toFixed(1)}%`;
}

function makeSpark(score) {
  const bars = Array.from({ length: 18 }, (_, index) => {
    const hue = index < 5 ? colors.red : index < 11 ? colors.orange : index < 15 ? colors.yellow : colors.green;
    const opacity = index < Math.round(score / 6) ? 1 : 0.28;
    return `<i style="background:${hue};opacity:${opacity}"></i>`;
  }).join("");
  return `<span class="spark-cell">${bars}</span> <span class="score">${Math.round(score)}</span>`;
}

function renderTable(container, columns, rows) {
  const head = columns.map((column) => `<th class="${column.num ? "num" : ""}">${column.label}</th>`).join("");
  const body = rows.map((row) => {
    const cells = columns.map((column) => {
      const raw = row[column.key];
      const value = column.render ? column.render(raw, row) : column.format ? column.format(raw) : raw;
      return `<td class="${column.num ? "num" : ""}">${value ?? ""}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  container.innerHTML = `<div class="grafana-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderNoData(container) {
  container.innerHTML = `<div class="no-data">No data</div>`;
}

function renderLineChart(container, series) {
  const width = 1200;
  const height = 280;
  const pad = { top: 14, right: 22, bottom: 34, left: 46 };
  const values = series.flatMap((item) => item.values);
  const max = Math.max(...values) * 1.18;
  const x = (index) => pad.left + (index / (series[0].values.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
  const grid = Array.from({ length: 6 }, (_, index) => {
    const yy = pad.top + index * ((height - pad.top - pad.bottom) / 5);
    return `<line class="grid-line" x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}"></line>`;
  }).join("");
  const ticks = Array.from({ length: 13 }, (_, index) => {
    const xx = x(index * 2);
    return `<text class="axis-text" x="${xx}" y="${height - 10}" text-anchor="middle">${String(index * 2).padStart(2, "0")}:00</text>`;
  }).join("");
  const paths = series.map((item) => {
    const d = item.values.map((value, index) => `${index ? "L" : "M"} ${x(index)} ${y(value)}`).join(" ");
    const fill = `${d} L ${x(item.values.length - 1)} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z`;
    return `<path d="${fill}" fill="${item.color}" opacity="0.12"></path><path d="${d}" fill="none" stroke="${item.color}" stroke-width="2"></path>`;
  }).join("");
  const legend = series.map((item) => `<span><i style="background:${item.color}"></i>${item.name}</span>`).join("");
  container.innerHTML = `<div class="chart-frame"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="time series">${grid}${paths}${ticks}</svg><div class="legend">${legend}</div></div>`;
}

function renderBarChart(container, rows, mode = "horizontal") {
  const width = 1200;
  const height = Math.max(260, rows.length * 24 + 40);
  const left = 210;
  const max = Math.max(...rows.map((row) => row.value));
  const bars = rows.map((row, index) => {
    const y = 15 + index * 24;
    const w = (row.value / max) * (width - left - 60);
    return `<text class="axis-text" x="${left - 8}" y="${y + 13}" text-anchor="end">${row.label}</text>
      <rect x="${left}" y="${y}" width="${w}" height="14" fill="${row.color || palette[index % palette.length]}"></rect>
      <text class="axis-text" x="${left + w + 7}" y="${y + 12}">${fmt.format(row.value)}</text>`;
  }).join("");
  container.innerHTML = `<div class="chart-frame"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${mode} bar chart">${bars}</svg></div>`;
}

function lineValues(base, points = 24, spread = 0.85) {
  return Array.from({ length: points }, (_, index) => {
    const rhythm = Math.sin(index / 1.7) * base * 0.28 + Math.cos(index / 4) * base * 0.14;
    const spike = [5, 6, 18].includes(index) ? base * (0.8 + rand()) : 0;
    return Math.max(1, number(base + rhythm + spike, spread));
  });
}

function baseRows(count) {
  const users = ["M1000041124", "M1000043268", "M1000043736", "M1000028827", "M1000025039", "M1000043555", "M1000043312"];
  const platforms = ["aos", "ios", "web"];
  const types = ["NYYYYYN", "NNNNNNN", "YYYYYNN", "YNYNNN", "NNNYNN"];
  return Array.from({ length: count }, (_, index) => ({
    rank: index + 1,
    userId: pick(users, index) + String(index).padStart(2, "0"),
    status: pick(types, index),
    typeId: [26, 0, 58, 56, 40, 63][index % 6],
    sessions: number(14 + index * 2, 1.2),
    pv: number(240 + index * 21, 0.9),
    avgPv: (8 + rand() * 48).toFixed(1),
    duration: `${number(1 + (index % 28), 0.5)} minutes`,
    search: number(index % 11, 1.8),
    clicks: number(index % 17, 1.7),
    updated: `2026-07-30 04:01:${String(19 + (index % 39)).padStart(2, "0")}.${index % 10}`,
    first: `2026-0${5 + (index % 3)}-${String(9 + (index % 20)).padStart(2, "0")} ${String(index % 24).padStart(2, "0")}:43:55`,
    last: `2026-07-30 00:${String(index % 60).padStart(2, "0")}:${String(9 + index).padStart(2, "0")}`,
    platform: pick(platforms, index),
    reservation: index % 4 === 0 ? `2027-0${1 + (index % 9)}-${String(10 + index).padStart(2, "0")} 00:00:00.0` : "",
  }));
}

function recommendationRows() {
  const categories = ["드레스", "본식상품", "헤어-메이크업", "웨딩홀", "스튜디오"];
  const products = ["TEMP_플로리스", "TEMP_아멜리아그라피", "TEMP_하임", "TEMP_슈슈드 강남", "TEMP_아카이브B"];
  return categories.map((category, index) => ({
    rank: index + 1,
    category,
    categoryScore: 100,
    categoryLevel: "매우 높음",
    candidate: ["플로리스", "아멜리아그라피디자인", "하임", "슈슈드 강남", "아카이브B"][index],
    product: products[index],
    productType: "임시ID",
    productScore: 86,
    productLevel: "높음",
    pv: number(6400 + index * 1800, 0.6),
    searches: number(320 + index * 400, 1.1),
    inquiries: number(290 + index * 210, 1.2),
    clicks: number(900 + index * 500, 1.3),
    lastScore: 20,
    lastSearch: `2026-07-${30 - (index % 2)} 00:${String(index * 9).padStart(2, "0")}:37`,
  }));
}

function pageRows(count) {
  const paths = ["/", "/product/wedding-hall", "/product/studio", "/estimate/compare", "/review/detail", "/search/result", "/my/scrap"];
  return Array.from({ length: count }, (_, index) => ({
    rank: index + 1,
    path: pick(paths, index),
    title: ["홈", "웨딩홀 상세", "스튜디오 패키지", "견적 비교", "리뷰 상세", "검색 결과", "스크랩"][index % 7],
    pv: number(8800 - index * 130, 0.8),
    session: number(3100 - index * 70, 0.7),
    avg: (1.1 + rand() * 6.5).toFixed(2),
    scroll: 20 + rand() * 75,
    bounce: 4 + rand() * 42,
  }));
}

const commonSettings = {
  datasource: "BigQuery - anonymized demo",
  interval: "1h",
  timeRange: "2026-05-01 12:00:00 to 2026-07-31 11:59:59",
  theme: "grafana-dark",
  transparent: false,
};

const panels = [
  {
    id: "summary",
    title: "1-1. 플랫폼별 주요 접속 지표 Summary",
    span: [1, 1, 24, 4],
    type: "table",
    query: "SELECT platform, COUNT(DISTINCT session_id) sessions, COUNT(*) page_views, AVG(duration_sec) avg_duration FROM demo_events GROUP BY 1 ORDER BY sessions DESC;",
    settings: { ...commonSettings, visualization: "table", thresholds: [60, 80], unit: "short" },
    render(container) {
      renderTable(container, [
        { key: "platform", label: "플랫폼" },
        { key: "sessions", label: "총 세션 수", num: true, format: fmt.format },
        { key: "pv", label: "총 PV", num: true, format: fmt.format },
        { key: "avg", label: "세션당 평균 PV", num: true },
        { key: "duration", label: "평균 체류시간" },
        { key: "share", label: "세션 비중", render: makeSpark },
      ], ["웹", "IOS", "AOS"].map((platform, index) => ({
        platform,
        sessions: number([68920, 51880, 42710][index], 0.25),
        pv: number([180240, 131300, 112490][index], 0.24),
        avg: (2.2 + rand() * 2.1).toFixed(2),
        duration: `${number(7 + index, 0.4)} minutes`,
        share: 62 + rand() * 32,
      })));
    },
  },
  {
    id: "active",
    title: "1-2. 시간대별 활성 세션 수",
    span: [1, 5, 24, 8],
    type: "timeseries",
    query: "SELECT TIMESTAMP_TRUNC(event_time, HOUR) time, platform, COUNT(DISTINCT session_id) value FROM demo_events GROUP BY 1, 2 ORDER BY 1;",
    settings: { ...commonSettings, visualization: "timeseries", drawStyle: "line", fillOpacity: 12 },
    render(container) {
      renderLineChart(container, [
        { name: "web", color: colors.green, values: lineValues(2600) },
        { name: "ios", color: colors.blue, values: lineValues(1900) },
        { name: "aos", color: colors.yellow, values: lineValues(1700) },
      ]);
    },
  },
  {
    id: "profile",
    title: "2-4. 유저 마스터 정보 (Status Profile)",
    span: [1, 13, 24, 11],
    type: "table",
    query: "SELECT user_id, contract_status, user_type_id, sessions, page_views, avg_session_pv, last_visit_at FROM user_profile ORDER BY last_visit_at DESC LIMIT 100;",
    settings: { ...commonSettings, visualization: "table", frozenColumns: 2, cellHeight: "sm" },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "순번", num: true },
        { key: "userId", label: "유저 ID" },
        { key: "status", label: "계약 상태" },
        { key: "typeId", label: "유형 ID", num: true },
        { key: "sessions", label: "총 세션 수", num: true },
        { key: "pv", label: "총 PV", num: true },
        { key: "avgPv", label: "세션당 평균 PV", num: true },
        { key: "duration", label: "평균 세션 체류시간" },
        { key: "search", label: "검색 수", num: true },
        { key: "clicks", label: "상품 클릭 수", num: true },
        { key: "updated", label: "프로필 업데이트 시각" },
        { key: "first", label: "최초 방문 시각" },
        { key: "last", label: "마지막 방문 시각" },
        { key: "platform", label: "주 이용 플랫폼" },
        { key: "reservation", label: "예정 예식일", render: (value) => value || '<span class="status-flag"></span>' },
      ], baseRows(70));
    },
  },
  {
    id: "recommend",
    title: "2-5. 개인 행동 기반 추천 후보 (Behavior-based Recommendation Candidates)_개인 전용",
    span: [1, 24, 24, 7],
    type: "table",
    query: "WITH category_affinity AS (...) SELECT * FROM recommendation_candidates WHERE user_id = ${Search_UserID} ORDER BY category_score DESC, product_score DESC;",
    settings: { ...commonSettings, visualization: "table", colorMode: "cell", thresholds: [50, 75, 90] },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "추천 순위", num: true },
        { key: "category", label: "추천 카테고리" },
        { key: "categoryScore", label: "카테고리 관심도(100점)", render: makeSpark },
        { key: "categoryLevel", label: "카테고리 관심 수준" },
        { key: "candidate", label: "관심 상품 후보" },
        { key: "product", label: "상품 식별값" },
        { key: "productType", label: "식별값 유형" },
        { key: "productScore", label: "상품 관심도(100점)", render: makeSpark },
        { key: "productLevel", label: "상품 관심 수준" },
        { key: "pv", label: "카테고리 PV", num: true, format: fmt.format },
        { key: "searches", label: "검색 수", num: true, format: fmt.format },
        { key: "inquiries", label: "카테고리 진입 수", num: true, format: fmt.format },
        { key: "clicks", label: "상품 클릭 수", num: true, format: fmt.format },
        { key: "lastScore", label: "최근점수", num: true },
        { key: "lastSearch", label: "마지막 관심 시각" },
      ], recommendationRows());
    },
  },
  {
    id: "journey",
    title: "2-6. 유저 세션별 페이지 이동 경로",
    span: [1, 31, 24, 10],
    type: "table",
    query: "SELECT user_id, session_id, STRING_AGG(page_path, ' > ' ORDER BY event_time) journey, MIN(event_time) start_at, MAX(event_time) end_at FROM demo_events GROUP BY 1, 2;",
    settings: { ...commonSettings, visualization: "table", wrapText: false },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "순번", num: true },
        { key: "userId", label: "유저 ID" },
        { key: "session", label: "세션 ID" },
        { key: "journey", label: "페이지 이동 경로", render: (value) => `<span class="link-cell">${value}</span>` },
        { key: "duration", label: "체류시간" },
        { key: "pv", label: "PV", num: true },
      ], Array.from({ length: 32 }, (_, index) => {
        const paths = ["/", "/search", "/product/wedding-hall", "/estimate", "/consulting", "/my/scrap"];
        return {
          rank: index + 1,
          userId: `M10000${number(1000 + index, 0.2)}`,
          session: `s_${number(100000 + index, 0.01)}`,
          journey: paths.slice(index % 3, (index % 3) + 4).join(" > "),
          duration: `${number(3 + (index % 15), 0.5)} minutes`,
          pv: number(4 + (index % 18), 0.7),
        };
      }));
    },
  },
  {
    id: "entry",
    title: "3-2. 진입/이탈 페이지 분석",
    span: [1, 41, 12, 9],
    type: "barchart",
    query: "SELECT page_path, SUM(is_entry) entry_count, SUM(is_exit) exit_count FROM session_pages GROUP BY 1 ORDER BY entry_count DESC LIMIT 40;",
    settings: { ...commonSettings, visualization: "barChart", orientation: "horizontal" },
    render(container) {
      renderBarChart(container, pageRows(28).map((row, index) => ({
        label: row.path,
        value: row.pv,
        color: index % 4 === 0 ? colors.green : colors.yellow,
      })));
    },
  },
  {
    id: "search",
    title: "4-2. 검색어 및 무결과율",
    span: [13, 41, 12, 9],
    type: "table",
    query: "SELECT keyword, COUNT(*) searches, SAFE_DIVIDE(SUM(no_result), COUNT(*)) zero_result_rate FROM search_events GROUP BY 1 ORDER BY searches DESC;",
    settings: { ...commonSettings, visualization: "table", colorMode: "gradient-gauge" },
    render(container) {
      const keywords = ["스몰웨딩", "본식스냅", "드레스", "웨딩홀", "메이크업", "청첩장", "한복", "스튜디오", "혼주"];
      renderTable(container, [
        { key: "rank", label: "순위", num: true },
        { key: "keyword", label: "검색어" },
        { key: "searches", label: "검색 수", num: true, format: fmt.format },
        { key: "zero", label: "무결과율", render: makeSpark },
        { key: "clickRate", label: "결과 클릭률", render: makeSpark },
      ], Array.from({ length: 45 }, (_, index) => ({
        rank: index + 1,
        keyword: pick(keywords, index),
        searches: number(5200 - index * 70, 0.65),
        zero: 8 + rand() * 38,
        clickRate: 30 + rand() * 62,
      })));
    },
  },
  {
    id: "events",
    title: "4-1. 이벤트 유형별 발생 수",
    span: [1, 50, 24, 8],
    type: "barchart",
    query: "SELECT event_name, COUNT(*) event_count FROM demo_events GROUP BY 1 ORDER BY event_count DESC;",
    settings: { ...commonSettings, visualization: "barGauge", displayMode: "lcd" },
    render(container) {
      const events = ["page_view", "product_click", "search", "cta_click", "scrap_add", "share_click", "search_result_click", "banner_click"];
      renderBarChart(container, events.map((event, index) => ({
        label: event,
        value: number(124000 - index * 14300, 0.45),
        color: index % 3 === 0 ? colors.green : index % 3 === 1 ? colors.orange : colors.yellow,
      })));
    },
  },
  {
    id: "quality",
    title: "4-6. 검색 결과 품질 지표",
    span: [1, 58, 12, 9],
    type: "table",
    query: "SELECT keyword, AVG(result_count) avg_results, AVG(first_click_rank) first_click_rank, AVG(product_click_rate) product_click_rate FROM search_quality GROUP BY 1;",
    settings: { ...commonSettings, visualization: "table", colorMode: "cell" },
    render(container) {
      renderTable(container, [
        { key: "keyword", label: "검색어" },
        { key: "avg", label: "평균 결과 수", num: true },
        { key: "rank", label: "첫 클릭 순위", num: true },
        { key: "rate", label: "상품 클릭률", render: makeSpark },
        { key: "zero", label: "무결과율", render: makeSpark },
      ], pageRows(35).map((row, index) => ({
        keyword: ["드레스", "웨딩홀", "스튜디오", "메이크업", "부케", "상담"][index % 6],
        avg: (3 + rand() * 52).toFixed(1),
        rank: (1 + rand() * 8).toFixed(1),
        rate: 28 + rand() * 61,
        zero: 5 + rand() * 34,
      })));
    },
  },
  {
    id: "empty",
    title: "4-9. 최종 스크랩 상태별 발생 화면 목록",
    span: [13, 58, 12, 9],
    type: "table",
    query: "SELECT final_scrap_status, page_path, COUNT(*) FROM scrap_state_transitions GROUP BY 1, 2;",
    settings: { ...commonSettings, visualization: "table", noDataState: true },
    render: renderNoData,
  },
  {
    id: "environment",
    title: "5-1. 플랫폼·기기 환경별 세션 분포",
    span: [1, 67, 24, 10],
    type: "barchart",
    query: "SELECT platform, device_type, browser, COUNT(DISTINCT session_id) sessions FROM session_environment GROUP BY 1, 2, 3 ORDER BY sessions DESC;",
    settings: { ...commonSettings, visualization: "barChart", orientation: "horizontal", unit: "sessions" },
    render(container) {
      const envs = ["web / desktop / chrome", "ios / mobile / safari", "aos / mobile / chrome", "web / mobile / samsung", "ios / tablet / safari", "aos / tablet / chrome"];
      renderBarChart(container, envs.map((env, index) => ({
        label: env,
        value: number(52000 - index * 6100, 0.36),
        color: colors.yellow,
      })));
    },
  },
];

function makePanel(panel) {
  const node = $("panelTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.panelId = panel.id;
  node.style.gridColumn = `${panel.span[0]} / span ${panel.span[2]}`;
  node.style.gridRow = `${panel.span[1]} / span ${panel.span[3]}`;
  node.querySelector("h2").textContent = panel.title;
  const body = node.querySelector(".panel-body");
  panel.render(body);
  const menuButton = node.querySelector(".panel-menu-button");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPanelMenu(panel, menuButton);
  });
  return node;
}

function renderDashboard() {
  seed = 26 + $("userSearch").value.length * 101;
  const dashboard = $("dashboard");
  dashboard.innerHTML = "";
  panels.forEach((panel) => dashboard.appendChild(makePanel(panel)));
}

function closePanelMenu() {
  document.querySelector(".panel-menu")?.remove();
  document.querySelectorAll(".panel-menu-button").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function openPanelMenu(panel, anchor) {
  closePanelMenu();
  anchor.setAttribute("aria-expanded", "true");
  const rect = anchor.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "panel-menu";
  menu.innerHTML = `
    <button type="button" data-action="view"><span>◎</span><span>View</span><span class="shortcut">v</span></button>
    <button type="button" data-action="inspect"><span>◱</span><span>Edit</span><span class="shortcut">e</span></button>
    <button type="button" data-action="inspect"><span>⌯</span><span>Share</span><span class="chev">›</span></button>
    <button type="button" data-action="inspect"><span>◉</span><span>Explore</span><span class="shortcut">p x</span></button>
    <button type="button" data-action="inspect"><span>ⓘ</span><span>Inspect</span><span class="shortcut">i</span></button>
    <button type="button" data-action="inspect"><span>⬡</span><span>More...</span><span class="chev">›</span></button>
  `;
  menu.style.left = `${Math.max(6, Math.min(rect.left - 220, window.innerWidth - 260))}px`;
  menu.style.top = `${rect.bottom + 6}px`;
  menu.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    closePanelMenu();
    if (action === "view") openPanelView(panel.id);
    if (action === "inspect") openInspect(panel.id, "query");
  });
  document.body.appendChild(menu);
}

function openPanelView(panelId) {
  activePanelId = panelId;
  const panel = panels.find((item) => item.id === panelId);
  if (!panel) return;
  const slot = $("viewPanelSlot");
  slot.innerHTML = "";
  const node = makePanel(panel);
  node.style.gridColumn = "";
  node.style.gridRow = "";
  slot.appendChild(node);
  $("viewUserSearch").value = $("userSearch").value;
  $("panelView").hidden = false;
  document.body.style.overflow = "hidden";
}

function closePanelView() {
  $("panelView").hidden = true;
  document.body.style.overflow = "";
  activePanelId = null;
}

function inspectPayload(panel, mode) {
  if (mode === "query") {
    return panel.query;
  }
  return JSON.stringify({
    id: panel.id,
    title: panel.title,
    type: panel.type,
    gridPos: {
      x: panel.span[0] - 1,
      y: panel.span[1] - 1,
      w: panel.span[2],
      h: panel.span[3],
    },
    targets: [{ refId: "A", datasource: commonSettings.datasource, rawSql: panel.query }],
    fieldConfig: panel.settings,
  }, null, 2);
}

function openInspect(panelId, mode = activeInspectMode) {
  activePanelId = panelId;
  activeInspectMode = mode;
  const panel = panels.find((item) => item.id === panelId);
  if (!panel) return;
  $("inspectTitle").textContent = `${panel.title} - Inspect`;
  $("queryTab").classList.toggle("active", mode === "query");
  $("jsonTab").classList.toggle("active", mode === "json");
  $("inspectBody").textContent = inspectPayload(panel, mode);
  if (!$("inspectDialog").open) $("inspectDialog").showModal();
}

document.addEventListener("click", closePanelMenu);
document.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
  if (event.key === "Escape" && !$("inspectDialog").open && !$("panelView").hidden) closePanelView();
  if (event.key.toLowerCase() === "v") {
    const firstPanel = panels[0];
    if (firstPanel && $("panelView").hidden) openPanelView(firstPanel.id);
  }
});

$("refreshButton").addEventListener("click", renderDashboard);
$("userSearch").addEventListener("input", renderDashboard);
$("viewUserSearch").addEventListener("input", (event) => {
  $("userSearch").value = event.target.value;
  renderDashboard();
  if (activePanelId) openPanelView(activePanelId);
});
$("closeView").addEventListener("click", closePanelView);
$("viewCloseButton").addEventListener("click", closePanelView);
$("viewInspectButton").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "query");
});
$("queryTab").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "query");
});
$("jsonTab").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "json");
});

renderDashboard();
