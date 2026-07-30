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
let activeViewDocMode = "summary";
let renderContext = "dashboard";
let renderRowLimit = null;
const chartObservers = new WeakMap();
const chartContainers = new Set();

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

function debounce(fn, delay = 180) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function pct(value) {
  return `${Number(value).toFixed(1)}%`;
}

function attrText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeSpark(score) {
  const bars = Array.from({ length: 18 }, (_, index) => {
    const hue = index < 5 ? colors.red : index < 11 ? colors.orange : index < 15 ? colors.yellow : colors.green;
    const opacity = index < Math.round(score / 6) ? 1 : 0.28;
    return `<i style="background:${hue};opacity:${opacity}"></i>`;
  }).join("");
  return `<span class="spark-cell">${bars}</span> <span class="score">${Math.round(score)}</span>`;
}

function dashboardRowCount(count) {
  if (renderContext !== "dashboard") return count;
  return Math.min(count, renderRowLimit || 18);
}

function generatedRows(count, factory) {
  const rows = Array.from({ length: dashboardRowCount(count) }, (_, index) => factory(index));
  rows.totalRows = count;
  return rows;
}

function renderTable(container, columns, rows) {
  const limit = renderRowLimit || 18;
  const totalRows = rows.totalRows || rows.length;
  const visibleRows = renderContext === "dashboard" && rows.length > limit ? rows.slice(0, limit) : rows;
  const head = columns.map((column) => `<th class="${column.num ? "num" : ""}" title="${attrText(column.label)}">${column.label}</th>`).join("");
  const body = visibleRows.map((row) => {
    const cells = columns.map((column) => {
      const raw = row[column.key];
      const value = column.render ? column.render(raw, row) : column.format ? column.format(raw) : raw;
      return `<td class="${column.num ? "num" : ""}" title="${attrText(raw)}">${value ?? ""}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const summary = visibleRows.length < totalRows ? `<div class="table-preview-note">Preview ${visibleRows.length} / ${totalRows} rows - View에서 전체 확인</div>` : "";
  container.innerHTML = `<div class="grafana-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${summary}</div>`;
}

function renderNoData(container) {
  container.innerHTML = `<div class="no-data">No data</div>`;
}

function chartSize(container, fallbackWidth, fallbackHeight) {
  return {
    width: Math.max(420, Math.round(container.clientWidth || fallbackWidth)),
    height: Math.max(160, Math.round(container.clientHeight || fallbackHeight)),
  };
}

function renderResponsiveChart(container, fallbackWidth, fallbackHeight, draw) {
  const paint = () => {
    const { width, height } = chartSize(container, fallbackWidth, fallbackHeight);
    if (container.dataset.chartWidth === String(width) && container.dataset.chartHeight === String(height)) return;
    container.dataset.chartWidth = String(width);
    container.dataset.chartHeight = String(height);
    container.innerHTML = draw(width, height);
  };
  paint();
  if (!("ResizeObserver" in window) || chartObservers.has(container)) return;
  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(paint);
  });
  observer.observe(container);
  chartObservers.set(container, observer);
  chartContainers.add(container);
}

function cleanupCharts(root = document) {
  root.querySelectorAll?.(".panel-body").forEach((container) => {
    chartObservers.get(container)?.disconnect();
    chartObservers.delete(container);
    chartContainers.delete(container);
  });
}

function renderLineChart(container, series) {
  renderResponsiveChart(container, 1200, 280, (width, height) => {
    const pad = { top: 8, right: 6, bottom: 25, left: 34 };
    const values = series.flatMap((item) => item.values);
    const max = Math.max(...values) * 1.18;
    const x = (index) => pad.left + (index / (series[0].values.length - 1)) * (width - pad.left - pad.right);
    const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
    const grid = Array.from({ length: 6 }, (_, index) => {
      const yy = pad.top + index * ((height - pad.top - pad.bottom) / 5);
      return `<line class="grid-line" x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}"></line>`;
    }).join("");
    const tickStep = width < 640 ? 6 : width < 920 ? 4 : 2;
    const ticks = Array.from({ length: Math.floor(24 / tickStep) + 1 }, (_, index) => index * tickStep).filter((hour) => hour <= 24).map((hour) => {
      const pointIndex = Math.min(series[0].values.length - 1, hour);
      const xx = x(pointIndex);
      return `<text class="axis-text" x="${xx}" y="${height - 10}" text-anchor="middle">${String(hour).padStart(2, "0")}:00</text>`;
    }).join("");
    const paths = series.map((item) => {
      const d = item.values.map((value, index) => `${index ? "L" : "M"} ${x(index)} ${y(value)}`).join(" ");
      const fill = `${d} L ${x(item.values.length - 1)} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z`;
      const points = item.values.map((value, index) => {
        const hour = `${String(index).padStart(2, "0")}:00`;
        const grouped = series.map((seriesItem) => `${seriesItem.color}|${seriesItem.name}|${fmt.format(seriesItem.values[index])}`).join(";;");
        return `<circle class="series-point" cx="${x(index)}" cy="${y(value)}" r="7" data-tip-title="${hour}" data-tip-series="${attrText(grouped)}"></circle>`;
      }).join("");
      return `<path class="series-fill" d="${fill}" fill="${item.color}" opacity="0.12"></path><path class="series-line" d="${d}" fill="none" stroke="${item.color}" stroke-width="2"></path>${points}`;
    }).join("");
    const legend = series.map((item) => `<span><i style="background:${item.color}"></i>${item.name}</span>`).join("");
    return `<div class="chart-frame"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="time series">${grid}${paths}${ticks}</svg><div class="legend">${legend}</div></div>`;
  });
}

function renderBarChart(container, rows, mode = "horizontal") {
  renderResponsiveChart(container, 1200, Math.max(220, rows.length * 24 + 28), (width, height) => {
    const left = Math.min(185, Math.max(118, Math.round(width * 0.14)));
    const max = Math.max(...rows.map((row) => row.value));
    const rowGap = Math.max(16, (height - 16) / rows.length);
    const barHeight = Math.max(8, Math.min(15, rowGap - 7));
    const bars = rows.map((row, index) => {
      const y = 8 + index * rowGap;
      const w = (row.value / max) * (width - left - 12);
      const color = row.color || palette[index % palette.length];
      return `<text class="axis-text" x="${left - 8}" y="${y + barHeight}" text-anchor="end">${row.label}</text>
        <rect x="${left}" y="${y}" width="${w}" height="${barHeight}" fill="${color}" data-tip="${attrText(`${row.label} / ${fmt.format(row.value)}`)}" data-tip-color="${attrText(color)}"></rect>
        <text class="axis-text bar-value" x="${Math.min(width - 4, left + w + 7)}" y="${y + barHeight - 1}" text-anchor="end">${fmt.format(row.value)}</text>`;
    }).join("");
    return `<div class="chart-frame"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${mode} bar chart">${bars}</svg></div>`;
  });
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
  return generatedRows(count, (index) => ({
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
  const paths = ["/", "/product/detail", "/product/studio", "/estimate/compare", "/review/detail", "/search/result", "/my/scrap"];
  return generatedRows(count, (index) => ({
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
    title: "1-1. 플랫폼별 세션 비중 (Session Share by Platform)",
    span: [1, 1, 12, 4],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    id: "os-duration",
    title: "1-2. 플랫폼별 평균 세션 체류시간 (Average Session Duration by Platform)",
    span: [13, 1, 12, 4],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", cellHeight: "sm" },
    render(container) {
      renderTable(container, [
        { key: "platform", label: "플랫폼" },
        { key: "avg", label: "평균 세션 체류시간" },
        { key: "median", label: "중앙값" },
        { key: "max", label: "최대값" },
        { key: "share", label: "비중", render: makeSpark },
      ], ["web", "ios", "aos"].map((platform, index) => ({
        platform,
        avg: `${number(7 + index, 0.45)} minutes`,
        median: `${number(4 + index, 0.4)} minutes`,
        max: `${number(44 + index * 8, 0.35)} minutes`,
        share: 48 + rand() * 46,
      })));
    },
  },
  {
    id: "active",
    title: "1-3. 시간별 활성 세션 추이 (Traffic Trend)",
    span: [1, 5, 24, 8],
    type: "timeseries",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    id: "pv-summary",
    title: "1-4. 플랫폼별 세션당 평균 PV (Average Page Views per Session by Platform)",
    span: [1, 13, 8, 4],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table" },
    render(container) {
      renderTable(container, [
        { key: "platform", label: "플랫폼" },
        { key: "pv", label: "평균 PV", num: true },
        { key: "sessions", label: "세션 수", num: true, format: fmt.format },
      ], ["web", "ios", "aos"].map((platform, index) => ({
        platform,
        pv: (2.1 + index * 0.4 + rand()).toFixed(2),
        sessions: number(42000 - index * 6200, 0.35),
      })));
    },
  },
  {
    id: "duration-bucket",
    title: "1-5. 플랫폼별 세션 체류시간 분포 (Session Duration Distribution by Platform)",
    span: [9, 13, 8, 4],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table" },
    render(container) {
      renderTable(container, [
        { key: "bucket", label: "구간" },
        { key: "web", label: "web", num: true, format: fmt.format },
        { key: "ios", label: "ios", num: true, format: fmt.format },
        { key: "aos", label: "aos", num: true, format: fmt.format },
      ], ["0-30s", "30s-3m", "3m-10m", "10m+"].map((bucket, index) => ({
        bucket,
        web: number(12400 - index * 1700, 0.3),
        ios: number(9600 - index * 1300, 0.3),
        aos: number(8100 - index * 1100, 0.3),
      })));
    },
  },
  {
    id: "threshold-summary",
    title: "1-6. 체류시간 기준 초과/이하 세션 비중 (Session Duration Above/Below Benchmark)",
    span: [17, 13, 8, 4],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", colorMode: "cell" },
    render(container) {
      renderTable(container, [
        { key: "platform", label: "플랫폼" },
        { key: "above", label: "기준 초과", render: makeSpark },
        { key: "below", label: "기준 이하", render: makeSpark },
      ], ["web", "ios", "aos"].map((platform) => {
        const above = 32 + rand() * 44;
        return { platform, above, below: 100 - above };
      }));
    },
  },
  {
    id: "pipeline",
    title: "2-1. 고객 유형 파이프라인 비중 변화 (Customer Type Pipeline Share Trend)",
    span: [1, 17, 24, 8],
    type: "timeseries",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "timeseries", stacking: "normal" },
    render(container) {
      renderLineChart(container, [
        { name: "new", color: colors.green, values: lineValues(900) },
        { name: "returning", color: colors.blue, values: lineValues(760) },
        { name: "active", color: colors.yellow, values: lineValues(680) },
        { name: "conversion", color: colors.red, values: lineValues(280) },
      ]);
    },
  },
  {
    id: "member-status",
    title: "2-2. 고객 타입별 누적 회원 현황 (Cumulative Members by Customer Type)",
    span: [1, 25, 12, 6],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table" },
    render(container) {
      renderTable(container, [
        { key: "type", label: "고객 타입" },
        { key: "users", label: "누적 회원", num: true, format: fmt.format },
        { key: "active", label: "활성 회원", num: true, format: fmt.format },
        { key: "rate", label: "활성 비중", render: makeSpark },
      ], ["신규", "재방문", "관심높음", "상담예정", "비회원"].map((type, index) => ({
        type,
        users: number(18400 - index * 2100, 0.32),
        active: number(6100 - index * 700, 0.35),
        rate: 22 + rand() * 64,
      })));
    },
  },
  {
    id: "above-average",
    title: "2-3. 평균 체류시간 초과 세션 유형별 요약 및 고객 목록 (Above-Average Session Summary by Customer Type)",
    span: [13, 25, 12, 6],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table" },
    render(container) {
      renderTable(container, [
        { key: "type", label: "고객 타입" },
        { key: "sessions", label: "초과 세션", num: true, format: fmt.format },
        { key: "duration", label: "평균 체류시간" },
        { key: "share", label: "비중", render: makeSpark },
      ], ["신규", "재방문", "관심높음", "상담예정"].map((type, index) => ({
        type,
        sessions: number(4200 - index * 530, 0.35),
        duration: `${number(8 + index, 0.4)} minutes`,
        share: 28 + rand() * 60,
      })));
    },
  },
  {
    id: "profile",
    title: "2-4. 유저 마스터 정보 (Status Profile)",
    span: [1, 31, 24, 11],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    span: [1, 42, 24, 7],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    title: "2-6. 유저 세션별 페이지 이동 경로 (User Session Page Journey)_개인 전용",
    span: [1, 49, 24, 9],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
        const paths = ["/", "/search", "/product/detail", "/estimate", "/consulting", "/my/scrap"];
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
    id: "page-performance",
    title: "3-1. 페이지별 세션당 평균 조회수(Pages by Views per Session)",
    span: [1, 58, 24, 8],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", links: true },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "순번", num: true },
        { key: "path", label: "페이지 경로", render: (value) => `<span class="link-cell">${value}</span>` },
        { key: "title", label: "페이지 제목" },
        { key: "pv", label: "전체 PV", num: true, format: fmt.format },
        { key: "session", label: "조회 세션 수", num: true, format: fmt.format },
        { key: "avg", label: "세션당 PV", num: true },
        { key: "scroll", label: "평균 스크롤", render: makeSpark },
        { key: "bounce", label: "이탈률", render: makeSpark },
      ], pageRows(45));
    },
  },
  {
    id: "entry",
    title: "3-2. 진입/이탈 페이지 분석 (Entry & Exit)",
    span: [1, 66, 24, 9],
    type: "barchart",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    id: "scroll-depth",
    title: "3-3. 페이지별 스크롤 탐색 깊이(Pages by Scroll Engagement)",
    span: [1, 1, 24, 16],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", links: true, colorMode: "cell" },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "순번", num: true },
        { key: "title", label: "페이지 제목" },
        { key: "path", label: "페이지 URL", render: (value) => `<span class="link-cell">${value}</span>` },
        { key: "pv", label: "전체 조회수", num: true, format: fmt.format },
        { key: "session", label: "조회 세션 수", num: true, format: fmt.format },
        { key: "scroll", label: "평균 스크롤 깊이", render: makeSpark },
        { key: "bounce", label: "깊은 탐색 비율", render: makeSpark },
      ], pageRows(55));
    },
  },
  {
    id: "search",
    title: "4-2. 검색어 및 무결과율 (Search Keywords & Zero-result Rate)",
    span: [1, 75, 12, 9],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    id: "keyword-type",
    title: "4-3. 고객 타입별 검색어(Search Keywords by Customer Type)",
    span: [13, 75, 12, 9],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", colorMode: "gradient-gauge" },
    render(container) {
      renderTable(container, [
        { key: "type", label: "고객 타입" },
        { key: "keyword", label: "검색어" },
        { key: "searches", label: "검색 수", num: true, format: fmt.format },
        { key: "rate", label: "결과 클릭률", render: makeSpark },
      ], Array.from({ length: 38 }, (_, index) => ({
        type: ["신규", "재방문", "관심높음", "상담예정"][index % 4],
        keyword: ["드레스", "스튜디오", "견적", "메이크업", "리뷰", "이벤트"][index % 6],
        searches: number(3200 - index * 48, 0.65),
        rate: 18 + rand() * 70,
      })));
    },
  },
  {
    id: "cta",
    title: "4-4. CTA·버튼·배너 클릭(CTA, Button & Banner Clicks)",
    span: [1, 84, 12, 8],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", colorMode: "cell" },
    render(container) {
      renderTable(container, [
        { key: "target", label: "클릭 대상" },
        { key: "page", label: "발생 화면" },
        { key: "clicks", label: "클릭 수", num: true, format: fmt.format },
        { key: "ctr", label: "CTR", render: makeSpark },
      ], Array.from({ length: 34 }, (_, index) => ({
        target: ["상담 신청", "견적 비교", "배너", "더보기", "예약 문의"][index % 5],
        page: ["/", "/search", "/product/detail", "/estimate"][index % 4],
        clicks: number(9800 - index * 160, 0.55),
        ctr: 8 + rand() * 48,
      })));
    },
  },
  {
    id: "product-click",
    title: "4-5. 상품·업체 클릭(Product & Vendor Clicks)",
    span: [13, 84, 12, 8],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", colorMode: "cell" },
    render(container) {
      renderTable(container, [
        { key: "category", label: "상품 카테고리" },
        { key: "product", label: "상품 식별값" },
        { key: "clicks", label: "클릭 수", num: true, format: fmt.format },
        { key: "users", label: "유저 수", num: true, format: fmt.format },
        { key: "score", label: "관심도", render: makeSpark },
      ], Array.from({ length: 34 }, (_, index) => ({
        category: ["드레스", "스튜디오", "메이크업", "홀", "기타"][index % 5],
        product: `TEMP_PRODUCT_${String(index + 1).padStart(3, "0")}`,
        clicks: number(7200 - index * 120, 0.62),
        users: number(3100 - index * 54, 0.55),
        score: 20 + rand() * 76,
      })));
    },
  },
  {
    id: "events",
    title: "4-1. 이벤트 유형별 발생 수 (Event Type Distribution)",
    span: [1, 92, 24, 8],
    type: "barchart",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    title: "4-6. 검색 결과 품질 지표 (Search Result Quality Metrics)",
    span: [1, 100, 12, 9],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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
    id: "conversion",
    title: "4-7. 검색어별 상품 클릭 전환 (Search-to-Product Click Conversion by Keyword)",
    span: [1, 1, 24, 17],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", colorMode: "gradient-gauge" },
    render(container) {
      renderTable(container, [
        { key: "rank", label: "순번", num: true },
        { key: "keyword", label: "검색어" },
        { key: "search", label: "검색 세션", num: true, format: fmt.format },
        { key: "result", label: "결과 클릭 세션", num: true, format: fmt.format },
        { key: "product", label: "상품 클릭 세션", num: true, format: fmt.format },
        { key: "conversion", label: "상품 클릭 전환율", render: makeSpark },
      ], Array.from({ length: 60 }, (_, index) => {
        const search = number(7200 - index * 82, 0.64);
        const conversion = 8 + rand() * 58;
        return {
          rank: index + 1,
          keyword: ["드레스", "스튜디오", "견적", "메이크업", "리뷰", "한복"][index % 6],
          search,
          result: Math.round(search * (0.28 + rand() * 0.42)),
          product: Math.round(search * conversion / 100),
          conversion,
        };
      }));
    },
  },
  {
    id: "scrap-gauge",
    title: "4-8. 스크랩 상태 요약 (Scrap Status Summary)",
    span: [1, 1, 24, 11],
    type: "bargauge",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "barGauge", displayMode: "lcd" },
    render(container) {
      renderBarChart(container, [
        { label: "스크랩 유지", value: number(4557, 0.2), color: colors.green },
        { label: "스크랩 추가", value: number(988, 0.32), color: colors.yellow },
        { label: "스크랩 취소", value: number(828, 0.36), color: colors.red },
        { label: "재스크랩", value: number(729, 0.35), color: colors.orange },
        { label: "상태 미확인", value: number(508, 0.4), color: colors.purple },
      ]);
    },
  },
  {
    id: "scrap-source",
    title: "4-9. 최종 스크랩 상태별 발생 화면 목록 (Latest Scrap Status by Source Page)",
    span: [13, 100, 12, 9],
    type: "table",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
    settings: { ...commonSettings, visualization: "table", noDataState: true },
    render(container) {
      renderTable(container, [
        { key: "status", label: "최종 스크랩 상태" },
        { key: "page", label: "발생 화면" },
        { key: "count", label: "건수", num: true, format: fmt.format },
        { key: "share", label: "비중", render: makeSpark },
      ], Array.from({ length: 34 }, (_, index) => ({
        status: ["유지", "추가", "취소", "재스크랩"][index % 4],
        page: ["/product/detail", "/search/result", "/my/scrap", "/review/detail"][index % 4],
        count: number(2200 - index * 37, 0.7),
        share: 12 + rand() * 76,
      })));
    },
  },
  {
    id: "environment",
    title: "5-1. 플랫폼·기기 환경별 세션 분포 (Platform & Device Environment)",
    span: [1, 109, 24, 10],
    type: "barchart",
    query: "보안 치환된 Query는 View 화면의 Query 탭에서 확인하세요.",
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

const layoutRows = [
  {
    title: "Row 1. 주요 접속 지표 요약 (Executive Summary)",
    items: [
      { id: "summary", x: 0, y: 0, w: 9, h: 6 },
      { id: "os-duration", x: 9, y: 0, w: 15, h: 6 },
      { id: "active", x: 0, y: 6, w: 24, h: 12 },
      { id: "pv-summary", x: 0, y: 18, w: 24, h: 6 },
      { id: "duration-bucket", x: 0, y: 24, w: 24, h: 6 },
      { id: "threshold-summary", x: 0, y: 30, w: 24, h: 6 },
    ],
  },
  {
    title: "Row 2. 고객 타입 및 회원 상태 (Customer Type & Member Status)",
    items: [
      { id: "pipeline", x: 0, y: 0, w: 24, h: 15 },
      { id: "member-status", x: 0, y: 15, w: 24, h: 9 },
      { id: "above-average", x: 0, y: 24, w: 24, h: 9 },
      { id: "profile", x: 0, y: 33, w: 24, h: 13 },
      { id: "recommend", x: 0, y: 46, w: 24, h: 7 },
      { id: "journey", x: 0, y: 53, w: 24, h: 11 },
    ],
  },
  {
    title: "Row 3. 화면·콘텐츠 성과 (Page & Content Performance)",
    items: [
      { id: "page-performance", x: 0, y: 0, w: 24, h: 12 },
      { id: "entry", x: 0, y: 12, w: 24, h: 13 },
      { id: "scroll-depth", x: 0, y: 25, w: 24, h: 12 },
    ],
  },
  {
    title: "Row 4. 행동·검색·클릭 분석 (Behavior, Search & Click Analytics)",
    items: [
      { id: "events", x: 0, y: 0, w: 24, h: 12 },
      { id: "search", x: 0, y: 12, w: 24, h: 12 },
      { id: "keyword-type", x: 0, y: 24, w: 24, h: 12 },
      { id: "cta", x: 0, y: 36, w: 24, h: 11 },
      { id: "product-click", x: 0, y: 47, w: 24, h: 11 },
      { id: "quality", x: 0, y: 58, w: 24, h: 11 },
      { id: "conversion", x: 0, y: 69, w: 24, h: 12 },
      { id: "scrap-gauge", x: 0, y: 81, w: 24, h: 7 },
      { id: "scrap-source", x: 0, y: 88, w: 24, h: 10 },
    ],
  },
  {
    title: "Row 5. UX 및 환경 데이터 (UX & Environment Metrics)",
    items: [
      { id: "environment", x: 0, y: 0, w: 24, h: 14 },
    ],
  },
];

const panelById = new Map(panels.map((panel) => [panel.id, panel]));

function panelDocKey(panel) {
  return panel.title.match(/^(\d+-\d+)/)?.[1] || panel.id;
}

function panelDoc(panel) {
  return window.panelDocumentation?.[panelDocKey(panel)];
}

function displayPanelTitle(panel, placement) {
  if (!placement) return panel.title;
  return panel.title.replace(/\s*\([^)]*\)/g, "").replace(/_개인 전용/g, "").trim();
}

function panelDocText(panel, mode) {
  const doc = panelDoc(panel);
  if (mode === "summary") return panelSummaryText(panel);
  if (!doc) return mode === "query" ? panel.query : JSON.stringify(panel.settings, null, 2);
  return mode === "query" ? doc.query : JSON.stringify(doc.panelSpec, null, 2);
}

function panelInsight(panel) {
  const doc = panelDoc(panel);
  const spec = doc?.panelSpec || {};
  const key = panelDocKey(panel);
  const columns = Array.isArray(spec.columns) ? spec.columns.map((column) => String(column).replaceAll("`", "")) : [];
  const thresholds = spec.fieldConfig?.defaults?.thresholds?.steps?.length || panel.settings?.thresholds?.length || 0;
  const overrides = Array.isArray(spec.fieldConfig?.overrides) ? spec.fieldConfig.overrides.length : 0;
  const grid = spec.gridPos || {};
  const prefix = key.split("-")[0];
  const purposeByPanel = {
    summary: "플랫폼별 세션 규모와 비중을 비교해 트래픽 유입 구조를 빠르게 판단합니다.",
    "os-duration": "플랫폼별 평균, 중앙값, 최대 체류시간을 비교해 이용 품질의 편차를 확인합니다.",
    active: "시간대별 활성 세션 추이를 라인 차트로 보여 피크 시간과 플랫폼별 변동성을 파악합니다.",
    "pv-summary": "세션당 평균 PV를 플랫폼별로 비교해 방문 깊이와 탐색 강도를 평가합니다.",
    "duration-bucket": "체류시간 구간 분포를 나눠 짧은 방문과 깊은 방문의 비중을 확인합니다.",
    "threshold-summary": "기준 체류시간 초과/이하 세션을 비교해 세션 품질을 임계값 기반으로 해석합니다.",
    pipeline: "고객 타입별 비중 변화를 시간 흐름으로 추적해 고객군 전환 흐름을 설명합니다.",
    "member-status": "고객 타입별 누적 회원과 활성 회원을 비교해 현재 고객 기반을 요약합니다.",
    "above-average": "평균 체류시간을 넘는 고객군을 분리해 관심도가 높은 세션 집단을 식별합니다.",
    profile: "고객 마스터와 행동 집계를 연결해 개인 단위 분석 데이터마트 구성을 보여줍니다.",
    recommend: "행동 점수를 기반으로 추천 후보를 산출해 분석 결과가 개인화 액션으로 이어지는 구조를 보여줍니다.",
    journey: "세션별 페이지 이동 경로를 펼쳐 사용자의 실제 탐색 흐름과 이탈 가능 지점을 확인합니다.",
    "page-performance": "페이지별 조회와 세션 성과를 비교해 핵심 콘텐츠의 기여도를 평가합니다.",
    entry: "진입 화면별 유입 규모를 막대 차트로 비교해 첫 접점의 집중도를 확인합니다.",
    "scroll-depth": "페이지별 스크롤 깊이와 깊은 탐색 비율을 연결해 콘텐츠 소비 품질을 평가합니다.",
    events: "이벤트 유형별 발생량을 비교해 행동 데이터 수집 범위와 주요 액션 비중을 보여줍니다.",
    search: "검색어별 검색 수와 무결과율을 함께 보여 검색 UX 개선 대상을 찾습니다.",
    "keyword-type": "고객 타입별 검색어 패턴을 비교해 고객군별 관심사의 차이를 확인합니다.",
    cta: "CTA, 버튼, 배너 클릭 성과를 비교해 화면 내 액션 유도 요소의 효과를 평가합니다.",
    "product-click": "상품 및 업체 클릭 데이터를 집계해 관심 상품군과 클릭 집중도를 분석합니다.",
    quality: "검색 결과 수, 첫 클릭 순위, 무결과율을 조합해 검색 결과 품질을 진단합니다.",
    conversion: "검색에서 결과 클릭, 상품 클릭까지 이어지는 전환 흐름을 키워드 단위로 확인합니다.",
    "scrap-gauge": "스크랩 유지, 추가, 취소 상태를 비교해 관심 행동의 현재 상태를 요약합니다.",
    "scrap-source": "최종 스크랩 상태가 발생한 화면을 분석해 관심 저장 행동의 맥락을 확인합니다.",
    environment: "플랫폼, 기기, 브라우저 환경별 세션 분포를 비교해 UX 대응 우선순위를 잡습니다.",
  };
  const purposeByRow = {
    "1": "플랫폼별 접속 규모, 체류시간, PV 품질을 한 화면에서 비교해 트래픽의 기본 상태를 판단합니다.",
    "2": "고객 타입과 행동 이력을 결합해 활성 고객군, 추천 후보, 개별 여정을 추적하는 분석 역량을 보여줍니다.",
    "3": "페이지 단위의 조회, 진입, 스크롤 깊이를 비교해 콘텐츠 성과와 UX 병목을 찾습니다.",
    "4": "검색, 클릭, CTA, 스크랩 이벤트를 연결해 행동 데이터가 전환 지표로 이어지는 과정을 설명합니다.",
    "5": "플랫폼과 기기 환경을 분리해 서비스 이용 환경의 편차를 점검합니다.",
  };
  const metricText = columns.length
    ? `${columns.slice(0, 6).join(", ")}${columns.length > 6 ? ` 외 ${columns.length - 6}개` : ""}`
    : `${spec.visualization || panel.type} 시각화 결과값`;
  const gridText = Number.isFinite(grid.w) && Number.isFinite(grid.h) ? `gridPos ${grid.w}x${grid.h}` : "responsive panel grid";
  const implementationParts = [
    `${spec.visualization || panel.settings?.visualization || panel.type} 패널`,
    gridText,
    `${columns.length}개 컬럼`,
    `${thresholds}단계 threshold`,
    `${overrides}개 field override`,
  ];
  return {
    purpose: purposeByPanel[panel.id] || purposeByRow[prefix] || "패널별 쿼리와 시각화 설정을 연결해 Grafana 구현 방식을 설명합니다.",
    metrics: metricText,
    implementation: implementationParts.join(" · "),
  };
}

function panelEvidence(panel) {
  const doc = panelDoc(panel);
  const spec = doc?.panelSpec || {};
  const columns = Array.isArray(spec.columns) ? spec.columns.length : 0;
  const thresholds = spec.fieldConfig?.defaults?.thresholds?.steps?.length || panel.settings?.thresholds?.length || 0;
  const overrides = Array.isArray(spec.fieldConfig?.overrides) ? spec.fieldConfig.overrides.length : 0;
  const queryLines = doc?.query ? doc.query.split(/\r?\n/).filter(Boolean).length : 0;
  return { columns, thresholds, overrides, queryLines };
}

function panelTechTags(panel) {
  const evidence = panelEvidence(panel);
  const tags = [panel.settings?.visualization || panel.type];
  if (evidence.thresholds) tags.push("threshold");
  if (evidence.overrides) tags.push("field override");
  if (panel.type === "table" && evidence.columns > 4) tags.push("table transform");
  if (panel.type === "timeseries") tags.push("time series");
  if (panel.type === "bargauge") tags.push("bar gauge");
  return [...new Set(tags.filter(Boolean))].slice(0, 4);
}

function panelSummaryText(panel) {
  const insight = panelInsight(panel);
  const evidence = panelEvidence(panel);
  const doc = panelDoc(panel);
  const spec = doc?.panelSpec || {};
  const tags = panelTechTags(panel).join(", ");
  return [
    `Analysis Goal`,
    insight.purpose,
    ``,
    `Data Modeling`,
    insight.metrics,
    ``,
    `Grafana Implementation`,
    insight.implementation,
    ``,
    `Technical Tags`,
    tags || "panel configuration",
    ``,
    `Security Sanitization`,
    `실제 테이블명과 컬럼명은 한글 의미명으로 치환하고, Query 탭에는 보안 치환된 SQL ${evidence.queryLines ? `${evidence.queryLines}라인` : "원문"}을 표시합니다.`,
    ``,
    `Evidence`,
    `Query 탭에는 보안 치환된 SQL ${evidence.queryLines ? `${evidence.queryLines}라인` : "원문"}이 표시됩니다.`,
    `Panel Spec 탭에는 ${spec.gridPos ? "gridPos, " : ""}fieldConfig, thresholds, override 설정이 표시됩니다.`,
  ].join("\n");
}

function panelSpecRows(panel) {
  const insight = panelInsight(panel);
  const evidence = panelEvidence(panel);
  return [
    ["Analysis Goal", insight.purpose],
    ["Data Modeling", insight.metrics],
    ["Grafana Implementation", insight.implementation],
    ["Security", "실제 테이블/컬럼/식별자는 의미 기반 한글명과 합성 ID로 치환했습니다."],
    ["Evidence", `Query ${fmt.format(evidence.queryLines)} lines · ${fmt.format(evidence.overrides)} overrides · ${fmt.format(evidence.thresholds)} thresholds`],
  ];
}

function renderViewDocs(panel, mode = activeViewDocMode) {
  activeViewDocMode = mode;
  const insight = panelInsight(panel);
  $("viewDocTitle").textContent = panel.title;
  $("viewPurpose").textContent = insight.purpose;
  $("viewMetrics").textContent = insight.metrics;
  $("viewImplementation").textContent = insight.implementation;
  const evidence = panelEvidence(panel);
  $("viewEvidenceBadges").innerHTML = [
    ["Query lines", evidence.queryLines],
    ["Overrides", evidence.overrides],
    ["Thresholds", evidence.thresholds],
    ["Columns", evidence.columns],
  ].map(([label, value]) => `<span><strong>${fmt.format(value)}</strong>${label}</span>`).join("");
  $("viewEvidenceBadges").insertAdjacentHTML("beforeend", panelTechTags(panel).map((tag) => `<em>${tag}</em>`).join(""));
  $("viewSpecList").innerHTML = panelSpecRows(panel).map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");
  const modeLabels = {
    summary: "Summary: purpose / metrics / implementation",
    query: "Query: sanitized SQL",
    spec: "Panel Spec: gridPos / fieldConfig / thresholds",
  };
  $("viewDocModeLabel").textContent = modeLabels[mode];
  $("viewSummaryTab").classList.toggle("active", mode === "summary");
  $("viewQueryTab").classList.toggle("active", mode === "query");
  $("viewSpecTab").classList.toggle("active", mode === "spec");
  $("viewDocBody").textContent = panelDocText(panel, mode);
}

function makePanel(panel, placement) {
  const node = $("panelTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.panelId = panel.id;
  if (placement) {
    node.style.gridColumn = `${placement.x + 1} / span ${placement.w}`;
    node.style.gridRow = `${placement.y + 1} / span ${placement.h}`;
  }
  node.querySelector("h2").textContent = displayPanelTitle(panel, placement);
  node.querySelector("h2").title = panel.title;
  if (["timeseries", "barchart", "bargauge"].includes(panel.type)) node.classList.add("chart-panel");
  node.querySelector(".panel-actions").insertAdjacentHTML("beforebegin", `<div class="panel-tech-tags">${panelTechTags(panel).map((tag) => `<span>${tag}</span>`).join("")}</div>`);
  const body = node.querySelector(".panel-body");
  const previousContext = renderContext;
  const previousRowLimit = renderRowLimit;
  renderContext = placement ? "dashboard" : "view";
  renderRowLimit = placement ? Math.max(5, Math.min(20, Math.floor((placement.h * 26 - 52) / 30))) : null;
  panel.render(body);
  renderContext = previousContext;
  renderRowLimit = previousRowLimit;
  node.querySelector(".panel-view-button").addEventListener("click", (event) => {
    event.stopPropagation();
    openPanelView(panel.id);
  });
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
  cleanupCharts(dashboard);
  dashboard.innerHTML = "";
  layoutRows.forEach((row) => {
    const section = document.createElement("section");
    section.className = "dashboard-section";
    const titlebar = document.createElement("div");
    titlebar.className = "row-titlebar";
    titlebar.textContent = row.title;
    const grid = document.createElement("div");
    grid.className = "row-grid";
    const rowHeight = Math.max(...row.items.map((item) => item.y + item.h));
    grid.style.gridTemplateRows = `repeat(${rowHeight}, 26px)`;
    row.items.forEach((item) => {
      const panel = panelById.get(item.id);
      if (panel) grid.appendChild(makePanel(panel, item));
    });
    section.append(titlebar, grid);
    dashboard.appendChild(section);
  });
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
  const panel = panelById.get(panelId);
  if (!panel) return;
  const slot = $("viewPanelSlot");
  cleanupCharts(slot);
  slot.innerHTML = "";
  const node = makePanel(panel);
  node.style.gridColumn = "";
  node.style.gridRow = "";
  slot.appendChild(node);
  renderViewDocs(panel);
  $("viewUserSearch").value = $("userSearch").value;
  $("panelView").hidden = false;
  document.body.style.overflow = "hidden";
}

function closePanelView() {
  cleanupCharts($("viewPanelSlot"));
  $("panelView").hidden = true;
  document.body.style.overflow = "";
  activePanelId = null;
}

function inspectPayload(panel, mode) {
  if (mode === "query") {
    return panelDocText(panel, "query");
  }
  return panelDocText(panel, "spec");
}

function openInspect(panelId, mode = activeInspectMode) {
  activePanelId = panelId;
  activeInspectMode = mode;
  const panel = panelById.get(panelId);
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
const debouncedRenderDashboard = debounce(renderDashboard, 180);
const debouncedRefreshView = debounce(() => {
  if (activePanelId) openPanelView(activePanelId);
}, 180);
$("userSearch").addEventListener("input", debouncedRenderDashboard);
$("viewUserSearch").addEventListener("input", (event) => {
  $("userSearch").value = event.target.value;
  debouncedRenderDashboard();
  debouncedRefreshView();
});
$("closeView").addEventListener("click", closePanelView);
$("viewCloseButton").addEventListener("click", closePanelView);
$("viewInspectButton").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "query");
});
document.addEventListener("pointerover", (event) => {
  const target = event.target.closest("[data-tip], [data-tip-series]");
  if (!target) return;
  let tip = $("chartTooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "chartTooltip";
    tip.className = "chart-tooltip";
    document.body.appendChild(tip);
  }
  if (target.dataset.tipSeries) {
    const rows = target.dataset.tipSeries.split(";;").map((line) => {
      const [color, name, value] = line.split("|");
      return `<span class="tooltip-row"><i style="background:${attrText(color)}"></i><b>${attrText(name)}</b><strong>${attrText(value)}</strong></span>`;
    }).join("");
    tip.innerHTML = `<div class="tooltip-title">${attrText(target.dataset.tipTitle)}</div>${rows}`;
  } else {
    tip.innerHTML = `<span class="tooltip-row"><i style="background:${attrText(target.dataset.tipColor || colors.blue)}"></i><b>${attrText(target.dataset.tip)}</b></span>`;
  }
  tip.hidden = false;
});
document.addEventListener("pointermove", (event) => {
  const tip = $("chartTooltip");
  if (!tip || tip.hidden) return;
  tip.style.left = `${Math.min(window.innerWidth - tip.offsetWidth - 12, event.clientX + 12)}px`;
  tip.style.top = `${Math.min(window.innerHeight - tip.offsetHeight - 8, Math.max(8, event.clientY - 34))}px`;
});
document.addEventListener("pointerout", (event) => {
  if (!event.target.closest("[data-tip], [data-tip-series]")) return;
  const tip = $("chartTooltip");
  if (tip) tip.hidden = true;
});
$("viewSummaryTab").addEventListener("click", () => {
  const panel = panelById.get(activePanelId);
  if (panel) renderViewDocs(panel, "summary");
});
$("viewQueryTab").addEventListener("click", () => {
  const panel = panelById.get(activePanelId);
  if (panel) renderViewDocs(panel, "query");
});
$("viewSpecTab").addEventListener("click", () => {
  const panel = panelById.get(activePanelId);
  if (panel) renderViewDocs(panel, "spec");
});
$("queryTab").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "query");
});
$("jsonTab").addEventListener("click", () => {
  if (activePanelId) openInspect(activePanelId, "json");
});

renderDashboard();
