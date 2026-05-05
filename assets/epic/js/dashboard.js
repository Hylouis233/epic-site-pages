(function () {
    const config = window.EPIC_DASHBOARD_CONFIG || {};
    const state = {
        filters: {
            keyword: "",
            disease: "",
            continent: "",
            date_from: "",
            date_to: "",
        },
        page: 1,
        pageSize: 50,
        tableLoaded: false,
        overviewController: null,
        epietlController: null,
        mapController: null,
        tableController: null,
        map: null,
        markers: null,
        staticRecords: null,
        staticRecordsPromise: null,
        staticEpietlPayload: null,
        staticEpietlPromise: null,
    };

    const elements = {
        overviewGrid: document.getElementById("overview-grid"),
        diseaseSelect: document.getElementById("disease-select"),
        continentSelect: document.getElementById("continent-select"),
        keywordInput: document.getElementById("keyword-input"),
        dateFromInput: document.getElementById("date-from-input"),
        dateToInput: document.getElementById("date-to-input"),
        resetButton: document.getElementById("reset-filters"),
        filterSummary: document.getElementById("filter-summary-text"),
        lastUpdated: document.getElementById("last-updated"),
        heroStatus: document.getElementById("hero-status"),
        epietlMeta: document.getElementById("epietl-meta"),
        epietlMetrics: document.getElementById("epietl-metrics"),
        epietlSummaryText: document.getElementById("epietl-summary-text"),
        epietlCountryRisks: document.getElementById("epietl-country-risks"),
        epietlEventsMeta: document.getElementById("epietl-events-meta"),
        epietlEvents: document.getElementById("epietl-events"),
        mapMeta: document.getElementById("map-meta"),
        mapEmpty: document.getElementById("map-empty"),
        tablePanel: document.getElementById("table-panel"),
        tableMeta: document.getElementById("table-meta"),
        tablePlaceholder: document.getElementById("table-placeholder"),
        tableShell: document.getElementById("table-shell"),
        tableBody: document.getElementById("table-body"),
        tableCount: document.getElementById("table-count"),
        tablePageStatus: document.getElementById("table-page-status"),
        pagination: document.getElementById("pagination"),
        themeToggle: document.getElementById("theme-toggle"),
    };

    const tableColumns = [
        { key: "original_date", className: "table-cell--compact" },
        { key: "location", className: "table-cell--compact" },
        { key: "disease", className: "table-cell--compact" },
        { key: "description_cn", className: "table-cell--wide" },
        { key: "symptoms", className: "table-cell--wide" },
        { key: "measures", className: "table-cell--wide" },
        { key: "transmission", className: "table-cell--compact" },
        { key: "source_org", className: "table-cell--compact" },
        { key: "source", className: "table-cell--wide" },
    ];

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDateTime(value) {
        if (!value) {
            return "未知";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    }

    function formatCount(value) {
        return new Intl.NumberFormat("zh-CN").format(value || 0);
    }

    function renderSeverityPill(severity) {
        const normalized = String(severity || "").toLowerCase();
        const labelMap = {
            critical: "严重",
            high: "高",
            medium: "中",
            low: "低",
        };
        const label = labelMap[normalized] || "未分级";
        return `<span class="severity-pill severity-pill--${escapeHtml(normalized || "unknown")}">${escapeHtml(label)}</span>`;
    }

    function clampNumber(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return min;
        }
        return Math.min(Math.max(number, min), max);
    }

    function getGeoPoint(record) {
        if (!hasValidCoordinates(record)) {
            return null;
        }

        const x = typeof record.geo_x === "number"
            ? record.geo_x
            : ((record.longitude + 180) / 360) * 100;
        const y = typeof record.geo_y === "number"
            ? record.geo_y
            : ((90 - record.latitude) / 180) * 100;
        return {
            x: clampNumber(x, 0, 100),
            y: clampNumber(y, 0, 100),
        };
    }

    function renderAbstractGeoPlot(record, modifier) {
        const point = getGeoPoint(record || {});
        const className = ["geo-plot", modifier ? `geo-plot--${modifier}` : ""].filter(Boolean).join(" ");
        if (!point) {
            return `
                <div class="${className} geo-plot--empty" role="img" aria-label="定位待核验">
                    <svg viewBox="0 0 100 56" focusable="false" aria-hidden="true">
                        <rect x="1" y="1" width="98" height="54" rx="8"></rect>
                    </svg>
                </div>
            `;
        }

        return `
            <div class="${className}" role="img" aria-label="无边界定位图，点位为 ${escapeHtml(record.geo_coordinates || "")}">
                <svg viewBox="0 0 100 56" focusable="false" aria-hidden="true">
                    <rect x="1" y="1" width="98" height="54" rx="8"></rect>
                    <circle class="geo-plot__halo" cx="${point.x}" cy="${point.y}" r="7"></circle>
                    <circle class="geo-plot__point" cx="${point.x}" cy="${point.y}" r="3.2"></circle>
                </svg>
            </div>
        `;
    }

    function renderGeoSummary(record, modifier) {
        const status = record.geo_status_label || (hasValidCoordinates(record) ? "已生成定位" : "定位待核验");
        const precision = record.geo_precision || (hasValidCoordinates(record) ? "候选坐标" : "未定位");
        const coordinates = record.geo_coordinates || (
            hasValidCoordinates(record) ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}` : "无可用坐标"
        );
        const note = record.geo_note || "抽象无边界定位图，仅作态势索引。";
        return `
            <div class="geo-summary ${modifier ? `geo-summary--${modifier}` : ""}">
                ${renderAbstractGeoPlot(record, modifier)}
                <div class="geo-summary__body">
                    <div class="geo-summary__row">
                        <span class="geo-summary__status">${escapeHtml(status)}</span>
                        <span>${escapeHtml(precision)}</span>
                    </div>
                    <div class="geo-summary__coordinates">${escapeHtml(coordinates)}</div>
                    <div class="geo-summary__note">${escapeHtml(note)}</div>
                </div>
            </div>
        `;
    }

    function summarizeFilters() {
        const parts = [];
        if (state.filters.keyword) {
            parts.push(`关键词“${state.filters.keyword}”`);
        }
        if (state.filters.disease) {
            parts.push(`疾病 ${state.filters.disease}`);
        }
        if (state.filters.continent) {
            parts.push(`洲别 ${state.filters.continent}`);
        }
        if (state.filters.date_from) {
            parts.push(`起始 ${state.filters.date_from}`);
        }
        if (state.filters.date_to) {
            parts.push(`截止 ${state.filters.date_to}`);
        }
        return parts.length ? parts.join(" / ") : "未应用筛选。";
    }

    function updateFilterSummary() {
        elements.filterSummary.textContent = summarizeFilters();
    }

    function readFiltersFromDom() {
        state.filters.keyword = elements.keywordInput.value.trim();
        state.filters.disease = elements.diseaseSelect.value.trim();
        state.filters.continent = elements.continentSelect.value.trim();
        state.filters.date_from = elements.dateFromInput.value.trim();
        state.filters.date_to = elements.dateToInput.value.trim();
        updateFilterSummary();
    }

    function buildQuery(extraParams) {
        const searchParams = new URLSearchParams();
        const merged = Object.assign({}, state.filters, extraParams || {});
        Object.keys(merged).forEach((key) => {
            const value = merged[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                searchParams.set(key, String(value).trim());
            }
        });
        return searchParams.toString();
    }

    function isStaticMode() {
        return Boolean(config.staticDataUrl);
    }

    function getStaticGeneratedAt() {
        return config.generatedAt || "";
    }

    function normalizeDateSort(value) {
        const text = String(value || "").trim();
        if (!text) {
            return "";
        }
        const compactDigits = text.replace(/\D/g, "");
        if (compactDigits.length >= 8) {
            return `${compactDigits.slice(0, 4)}-${compactDigits.slice(4, 6)}-${compactDigits.slice(6, 8)}`;
        }
        const parts = text.match(/\d+/g) || [];
        if (parts.length >= 3 && parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
        return "";
    }

    function debounce(callback, delay) {
        let timer = null;
        return function () {
            const args = arguments;
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
                callback.apply(null, args);
            }, delay);
        };
    }

    function getActiveTheme() {
        return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }

    function applyTheme(theme) {
        const normalizedTheme = theme === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = normalizedTheme;
        if (elements.themeToggle) {
            const isDark = normalizedTheme === "dark";
            elements.themeToggle.textContent = isDark ? "浅色" : "深色";
            elements.themeToggle.setAttribute("aria-pressed", String(isDark));
        }
    }

    function setupThemeToggle() {
        applyTheme(getActiveTheme());
        if (!elements.themeToggle) {
            return;
        }
        elements.themeToggle.addEventListener("click", function () {
            const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
            try {
                window.localStorage.setItem("epic-theme", nextTheme);
            } catch (error) {
                // Local storage may be disabled in locked-down browsers.
            }
        });
    }

    function setHeroStatus(text, tone) {
        elements.heroStatus.textContent = text;
        elements.heroStatus.classList.remove("status--good", "status--danger");
        if (tone) {
            elements.heroStatus.classList.add(tone);
        }
    }

    function syncSelectOptions(selectElement, options, placeholder) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = placeholder;
        selectElement.appendChild(defaultOption);

        (Array.isArray(options) ? options : []).forEach((item) => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        selectElement.value = Array.from(selectElement.options).some((option) => option.value === currentValue)
            ? currentValue
            : "";
    }

    function matchesKeyword(record, keyword) {
        const keywordLower = String(keyword || "").trim().toLowerCase();
        if (!keywordLower) {
            return true;
        }

        const searchableParts = [
            record.original_date,
            record.location,
            record.disease,
            record.description_cn,
            record.source_org,
            record.source,
        ];
        return searchableParts.join(" ").toLowerCase().includes(keywordLower);
    }

    function applyClientFilters(records, filters) {
        return (Array.isArray(records) ? records : []).filter(function (record) {
            if (!matchesKeyword(record, filters.keyword)) {
                return false;
            }
            if (filters.disease && record.disease !== filters.disease) {
                return false;
            }
            if (filters.continent && record.continent !== filters.continent) {
                return false;
            }

            const dateSort = record.date_sort || normalizeDateSort(record.original_date);
            if (filters.date_from && (!dateSort || dateSort < filters.date_from)) {
                return false;
            }
            if (filters.date_to && (!dateSort || dateSort > filters.date_to)) {
                return false;
            }
            return true;
        });
    }

    function buildClientFilterOptions(records) {
        const allRecords = Array.isArray(records) ? records : [];
        const diseases = Array.from(new Set(allRecords.map(function (record) {
            return record.disease;
        }).filter(Boolean))).sort();
        const continents = Array.from(new Set(allRecords.map(function (record) {
            return record.continent;
        }).filter(Boolean))).sort();
        return { diseases, continents };
    }

    function buildClientOverviewPayload(records, filteredRecords) {
        const visibleRecords = Array.isArray(filteredRecords) ? filteredRecords : [];
        return {
            total_records: visibleRecords.length,
            disease_count: new Set(visibleRecords.map(function (record) {
                return record.disease;
            }).filter(Boolean)).size,
            continent_count: new Set(visibleRecords.map(function (record) {
                return record.continent;
            }).filter(Boolean)).size,
            latest_date: visibleRecords.find(function (record) {
                return record.original_date;
            })?.original_date || "",
            filter_options: buildClientFilterOptions(records),
            last_modified: getStaticGeneratedAt(),
        };
    }

    function hasValidCoordinates(record) {
        return typeof record.latitude === "number"
            && typeof record.longitude === "number"
            && record.latitude >= -90
            && record.latitude <= 90
            && record.longitude >= -180
            && record.longitude <= 180
            && !(Math.abs(record.latitude) < 1e-9 && Math.abs(record.longitude) < 1e-9);
    }

    function buildClientMapPayload(filteredRecords) {
        return (Array.isArray(filteredRecords) ? filteredRecords : []).filter(hasValidCoordinates).map(function (record) {
            return {
                id: record.id,
                original_date: record.original_date,
                disease: record.disease,
                location: record.location,
                latitude: record.latitude,
                longitude: record.longitude,
                description_cn: record.description_cn,
                continent: record.continent,
                source_org: record.source_org,
                geo_status: record.geo_status,
                geo_status_label: record.geo_status_label,
                geo_precision: record.geo_precision,
                geo_confidence: record.geo_confidence,
                geo_coordinates: record.geo_coordinates,
                geo_x: record.geo_x,
                geo_y: record.geo_y,
                geo_note: record.geo_note,
            };
        });
    }

    function buildClientTablePayload(filteredRecords, page, pageSize) {
        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.max(Number(pageSize) || 50, 1);
        const start = (safePage - 1) * safePageSize;
        const end = start + safePageSize;
        return {
            items: (Array.isArray(filteredRecords) ? filteredRecords : []).slice(start, end),
            total: Array.isArray(filteredRecords) ? filteredRecords.length : 0,
            page: safePage,
            page_size: safePageSize,
            last_modified: getStaticGeneratedAt(),
        };
    }

    function getClusterTone(count) {
        if (count >= 25) {
            return "critical";
        }
        if (count >= 12) {
            return "high";
        }
        if (count >= 6) {
            return "elevated";
        }
        if (count >= 3) {
            return "medium";
        }
        return "small";
    }

    function getClusterSize(count) {
        if (count >= 25) {
            return 58;
        }
        if (count >= 12) {
            return 54;
        }
        if (count >= 6) {
            return 50;
        }
        if (count >= 3) {
            return 46;
        }
        return 42;
    }

    function isCompactViewport() {
        return window.matchMedia("(max-width: 760px)").matches;
    }

    function createClusterIcon(cluster) {
        const count = cluster.getChildCount();
        const tone = getClusterTone(count);
        const size = getClusterSize(count);

        return L.divIcon({
            html: `<div class="cluster-badge cluster-badge--${tone}" title="${count} 个事件">${count}</div>`,
            className: "",
            iconSize: [size, size],
        });
    }

    function initMap() {
        state.map = L.map("map", {
            center: [24.5, 108],
            zoom: 3,
            minZoom: 1,
            maxZoom: 9,
            zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(state.map);
        state.map.attributionControl.setPrefix("");

        state.markers = L.markerClusterGroup({
            iconCreateFunction: createClusterIcon,
            showCoverageOnHover: false,
            maxClusterRadius: 70,
        });
        state.map.addLayer(state.markers);
    }

    async function fetchJsonUrl(requestUrl, controllerName) {
        if (state[controllerName]) {
            state[controllerName].abort();
        }

        const controller = new AbortController();
        state[controllerName] = controller;
        const response = await fetch(requestUrl, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async function fetchJson(configKey, controllerName, queryString) {
        const requestUrl = queryString ? `${config[configKey]}?${queryString}` : config[configKey];
        return fetchJsonUrl(requestUrl, controllerName);
    }

    async function loadStaticDataset() {
        if (Array.isArray(state.staticRecords)) {
            return state.staticRecords;
        }
        if (state.staticRecordsPromise) {
            return state.staticRecordsPromise;
        }
        state.staticRecordsPromise = fetchJsonUrl(config.staticDataUrl, "overviewController")
            .then(function (payload) {
                state.staticRecords = Array.isArray(payload) ? payload : [];
                return state.staticRecords;
            })
            .finally(function () {
                state.staticRecordsPromise = null;
            });
        return state.staticRecordsPromise;
    }

    async function loadStaticEpietlPayload() {
        if (state.staticEpietlPayload) {
            return state.staticEpietlPayload;
        }
        if (state.staticEpietlPromise) {
            return state.staticEpietlPromise;
        }
        state.staticEpietlPromise = fetchJsonUrl(config.staticEpietlUrl, "epietlController")
            .then(function (payload) {
                state.staticEpietlPayload = payload || {};
                return state.staticEpietlPayload;
            })
            .finally(function () {
                state.staticEpietlPromise = null;
            });
        return state.staticEpietlPromise;
    }

    function renderOverview(payload) {
        const cards = [
            { marker: "REC", label: "记录总数", value: formatCount(payload.total_records) },
            { marker: "DIS", label: "疾病类型", value: formatCount(payload.disease_count) },
            { marker: "CON", label: "洲别覆盖", value: formatCount(payload.continent_count) },
            { marker: "UPD", label: "最新日期", value: payload.latest_date || "暂无" },
        ];

        elements.overviewGrid.innerHTML = cards.map(function (card) {
            return `
                <article class="metric-card">
                    <span class="metric-card__marker">${card.marker}</span>
                    <p class="metric-card__label">${card.label}</p>
                    <h2 class="metric-card__value">${escapeHtml(card.value)}</h2>
                </article>
            `;
        }).join("");

        syncSelectOptions(elements.diseaseSelect, payload.filter_options && payload.filter_options.diseases, "全部疾病");
        syncSelectOptions(elements.continentSelect, payload.filter_options && payload.filter_options.continents, "全部洲别");
        elements.lastUpdated.textContent = formatDateTime(payload.last_modified);
        setHeroStatus(`当前筛选命中 ${formatCount(payload.total_records)} 条记录`, "status--good");
    }

    function renderMap(items) {
        elements.mapMeta.textContent = `当前地图点位 ${formatCount(items.length)} 个`;
        state.markers.clearLayers();

        if (!items.length) {
            elements.mapEmpty.classList.remove("hidden");
            state.map.setView([24.5, 108], 3);
            return;
        }

        elements.mapEmpty.classList.add("hidden");
        const points = [];

        items.forEach(function (item) {
            const marker = L.marker([item.latitude, item.longitude], { riseOnHover: true });
            marker.bindPopup(`
                <div class="popup-card">
                    <h3>${escapeHtml(item.disease || "未标注疾病")}</h3>
                    <p><strong>地点：</strong>${escapeHtml(item.location || "未知")}</p>
                    <p><strong>日期：</strong>${escapeHtml(item.original_date || "未知")}</p>
                    <p><strong>来源机构：</strong>${escapeHtml(item.source_org || "未知")}</p>
                    ${renderGeoSummary(item, "popup")}
                    <p>${escapeHtml(item.description_cn || "暂无更多描述。")}</p>
                </div>
            `, { maxWidth: 320 });
            state.markers.addLayer(marker);
            points.push([item.latitude, item.longitude]);
        });

        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
            if (isCompactViewport() && Math.abs(bounds.getEast() - bounds.getWest()) > 180) {
                state.map.setView([12, 8], 1, { animate: true });
                return;
            }
            state.map.fitBounds(bounds.pad(0.22), {
                animate: true,
                padding: [36, 36],
            });
        }
    }

    function renderEpietl(payload) {
        const meta = payload && payload.meta ? payload.meta : {};
        const riskSummary = payload && payload.risk_summary ? payload.risk_summary : {};
        const events = Array.isArray(payload && payload.events) ? payload.events : [];
        const countryRisks = Array.isArray(riskSummary.country_risks) ? riskSummary.country_risks : [];

        const metrics = [
            { marker: "CHN", label: "监测通道", value: formatCount(meta.channel_count) },
            { marker: "RPT", label: "累计报告", value: formatCount(meta.total_reports) },
            { marker: "PDG", label: "待处理", value: formatCount(meta.pending_reports) },
            { marker: "RSK", label: "风险事件", value: formatCount(events.length) },
        ];

        elements.epietlMetrics.innerHTML = metrics.map(function (card) {
            return `
                <article class="metric-card">
                    <span class="metric-card__marker">${card.marker}</span>
                    <p class="metric-card__label">${card.label}</p>
                    <h2 class="metric-card__value">${escapeHtml(card.value)}</h2>
                </article>
            `;
        }).join("");

        elements.epietlMeta.textContent = meta.fetched_at
            ? `公开快照 ${formatDateTime(meta.fetched_at)} · 风险窗口 ${formatCount(meta.dashboard_days)} 天`
            : "未同步 EpiETL 公共快照";

        elements.epietlSummaryText.textContent = meta.reports_analyzed
            ? `分析报告 ${formatCount(meta.reports_analyzed)} 份`
            : "暂无分析报告摘要";

        if (countryRisks.length) {
            elements.epietlCountryRisks.innerHTML = countryRisks.map(function (item) {
                return `
                    <article class="intel-item">
                        <div class="intel-item__row">
                            <strong>${escapeHtml(item.country || "未知地区")}</strong>
                            <span class="intel-item__score">${formatCount(item.score)}</span>
                        </div>
                        <div class="intel-item__row intel-item__row--meta">
                            ${renderSeverityPill(item.level)}
                            <span>${escapeHtml(item.top_pathogen || "未标注病原体")}</span>
                        </div>
                    </article>
                `;
            }).join("");
        } else {
            elements.epietlCountryRisks.innerHTML = '<div class="intel-empty">当前没有可展示的国家风险评分。</div>';
        }

        elements.epietlEventsMeta.textContent = events.length
            ? `展示前 ${formatCount(events.length)} 条公开事件`
            : "暂无事件快照";

        if (events.length) {
            elements.epietlEvents.innerHTML = events.map(function (item) {
                const regionText = Array.isArray(item.regions) && item.regions.length ? item.regions.join(" / ") : "未标注地区";
                const sourceLink = item.source_url
                    ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer" class="table-cell__link">查看来源</a>`
                    : "无来源链接";
                return `
                    <article class="intel-item">
                        <div class="intel-item__row">
                            <strong>${escapeHtml(item.title || "未命名事件")}</strong>
                            ${renderSeverityPill(item.severity)}
                        </div>
                        <p class="intel-item__summary">${escapeHtml(item.summary || "暂无摘要。")}</p>
                        <div class="intel-item__row intel-item__row--meta">
                            <span>${escapeHtml(item.pathogen || "未标注病原体")}</span>
                            <span>${escapeHtml(regionText)}</span>
                            <span>${escapeHtml(item.source_org || "未知机构")}</span>
                            <span>${sourceLink}</span>
                        </div>
                    </article>
                `;
            }).join("");
        } else {
            elements.epietlEvents.innerHTML = '<div class="intel-empty">当前没有可展示的公开风险事件。</div>';
        }
    }

    function renderTableRows(items) {
        elements.tableBody.innerHTML = "";
        if (!items.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = tableColumns.length;
            cell.textContent = "当前筛选条件下没有明细记录。";
            row.appendChild(cell);
            elements.tableBody.appendChild(row);
            return;
        }

        items.forEach(function (item) {
            const row = document.createElement("tr");
            tableColumns.forEach(function (column) {
                const cell = document.createElement("td");
                if (column.className) {
                    cell.classList.add(column.className);
                }

                if (column.key === "source" && item.source) {
                    const link = document.createElement("a");
                    link.href = item.source;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.className = "table-cell__link";
                    link.textContent = "查看来源";
                    cell.appendChild(link);
                } else if (column.key === "description_cn") {
                    cell.innerHTML = `
                        <div class="event-description">
                            <p>${escapeHtml(item.description_cn || "—")}</p>
                            ${renderGeoSummary(item, "table")}
                        </div>
                    `;
                } else {
                    cell.textContent = item[column.key] || "—";
                }
                row.appendChild(cell);
            });
            elements.tableBody.appendChild(row);
        });
    }

    function buildPagination(total, page, pageSize) {
        const totalPages = Math.max(Math.ceil(total / pageSize), 1);
        const info = document.createElement("div");
        info.textContent = `共 ${formatCount(total)} 条，当前第 ${page} / ${totalPages} 页`;

        const buttons = document.createElement("div");
        buttons.className = "pagination__buttons";

        function appendButton(text, disabled, onClick, active) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = text;
            button.disabled = !!disabled;
            if (active) {
                button.classList.add("is-active");
            }
            button.addEventListener("click", onClick);
            buttons.appendChild(button);
        }

        appendButton("上一页", page <= 1, function () {
            loadTable(page - 1);
        });

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);
        for (let current = startPage; current <= endPage; current += 1) {
            appendButton(String(current), false, function () {
                loadTable(current);
            }, current === page);
        }

        appendButton("下一页", page >= totalPages, function () {
            loadTable(page + 1);
        });

        elements.pagination.innerHTML = "";
        elements.pagination.appendChild(info);
        elements.pagination.appendChild(buttons);
    }

    async function loadOverview() {
        if (isStaticMode()) {
            try {
                const records = await loadStaticDataset();
                const filteredRecords = applyClientFilters(records, state.filters);
                renderOverview(buildClientOverviewPayload(records, filteredRecords));
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                setHeroStatus("摘要数据加载失败", "status--danger");
                elements.lastUpdated.textContent = "加载失败";
            }
            return;
        }

        try {
            const payload = await fetchJson("overviewUrl", "overviewController", buildQuery());
            renderOverview(payload);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            setHeroStatus("摘要数据加载失败", "status--danger");
            elements.lastUpdated.textContent = "加载失败";
        }
    }

    async function loadMap() {
        elements.mapMeta.textContent = "正在刷新地图点位";

        if (isStaticMode()) {
            try {
                const records = await loadStaticDataset();
                const filteredRecords = applyClientFilters(records, state.filters);
                renderMap(buildClientMapPayload(filteredRecords));
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                elements.mapMeta.textContent = "地图加载失败";
                elements.mapEmpty.classList.remove("hidden");
            }
            return;
        }

        try {
            const payload = await fetchJson("mapUrl", "mapController", buildQuery());
            renderMap(payload);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            elements.mapMeta.textContent = "地图加载失败";
            elements.mapEmpty.classList.remove("hidden");
        }
    }

    async function loadEpietl() {
        if (!config.epietlUrl && !config.staticEpietlUrl) {
            return;
        }

        try {
            const payload = isStaticMode()
                ? await loadStaticEpietlPayload()
                : await fetchJson("epietlUrl", "epietlController", "");
            renderEpietl(payload);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            elements.epietlMeta.textContent = "EpiETL 情报加载失败";
            elements.epietlSummaryText.textContent = "公开情报接口不可用";
            elements.epietlCountryRisks.innerHTML = '<div class="intel-empty">EpiETL 情报接口加载失败。</div>';
            elements.epietlEventsMeta.textContent = "加载失败";
            elements.epietlEvents.innerHTML = '<div class="intel-empty">请稍后重试。</div>';
        }
    }

    async function loadTable(page) {
        state.page = page || 1;
        state.tableLoaded = true;
        elements.tableMeta.textContent = "正在加载分页明细";
        elements.tablePlaceholder.classList.add("hidden");
        elements.tableShell.classList.remove("hidden");
        elements.tableBody.innerHTML = "<tr><td colspan=\"9\">正在加载明细，请稍候…</td></tr>";

        if (isStaticMode()) {
            try {
                const records = await loadStaticDataset();
                const filteredRecords = applyClientFilters(records, state.filters);
                const payload = buildClientTablePayload(filteredRecords, state.page, state.pageSize);
                renderTableRows(payload.items || []);
                elements.tableCount.textContent = `${formatCount(payload.total)} 条记录`;
                elements.tablePageStatus.textContent = `第 ${payload.page} 页 / 每页 ${payload.page_size} 条`;
                elements.tableMeta.textContent = `静态快照已加载，更新时间 ${formatDateTime(payload.last_modified)}`;
                buildPagination(payload.total || 0, payload.page || 1, payload.page_size || state.pageSize);
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                elements.tableMeta.textContent = "表格加载失败";
                elements.tableBody.innerHTML = "<tr><td colspan=\"9\">明细接口加载失败，请稍后重试。</td></tr>";
                elements.pagination.innerHTML = "";
            }
            return;
        }

        try {
            const payload = await fetchJson("tableUrl", "tableController", buildQuery({
                page: state.page,
                page_size: state.pageSize,
            }));
            renderTableRows(payload.items || []);
            elements.tableCount.textContent = `${formatCount(payload.total)} 条记录`;
            elements.tablePageStatus.textContent = `第 ${payload.page} 页 / 每页 ${payload.page_size} 条`;
            elements.tableMeta.textContent = `明细已加载，更新时间 ${formatDateTime(payload.last_modified)}`;
            buildPagination(payload.total || 0, payload.page || 1, payload.page_size || state.pageSize);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            elements.tableMeta.textContent = "表格加载失败";
            elements.tableBody.innerHTML = "<tr><td colspan=\"9\">明细接口加载失败，请稍后重试。</td></tr>";
            elements.pagination.innerHTML = "";
        }
    }

    function refreshDataAfterFilters() {
        state.page = 1;
        loadOverview();
        loadMap();
        if (state.tableLoaded) {
            loadTable(1);
        } else {
            elements.tableMeta.textContent = "滚动到此区域后自动加载";
        }
    }

    function setupFilterEvents() {
        const debouncedKeywordHandler = debounce(function () {
            readFiltersFromDom();
            refreshDataAfterFilters();
        }, 300);

        elements.keywordInput.addEventListener("input", debouncedKeywordHandler);
        elements.diseaseSelect.addEventListener("change", function () {
            readFiltersFromDom();
            refreshDataAfterFilters();
        });
        elements.continentSelect.addEventListener("change", function () {
            readFiltersFromDom();
            refreshDataAfterFilters();
        });
        elements.dateFromInput.addEventListener("change", function () {
            readFiltersFromDom();
            refreshDataAfterFilters();
        });
        elements.dateToInput.addEventListener("change", function () {
            readFiltersFromDom();
            refreshDataAfterFilters();
        });
        elements.resetButton.addEventListener("click", function () {
            elements.keywordInput.value = "";
            elements.diseaseSelect.value = "";
            elements.continentSelect.value = "";
            elements.dateFromInput.value = "";
            elements.dateToInput.value = "";
            readFiltersFromDom();
            refreshDataAfterFilters();
        });
    }

    function setupLazyTableLoad() {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !state.tableLoaded) {
                    loadTable(1);
                }
            });
        }, { rootMargin: "0px 0px 160px 0px", threshold: 0.15 });
        observer.observe(elements.tablePanel);
    }

    function bootstrap() {
        if (!isStaticMode() && (!config.overviewUrl || !config.mapUrl || !config.tableUrl)) {
            setHeroStatus("页面配置缺失，无法加载数据。", "status--danger");
            return;
        }

        updateFilterSummary();
        setupThemeToggle();
        initMap();
        setupFilterEvents();
        setupLazyTableLoad();
        loadOverview();
        loadEpietl();
        loadMap();
    }

    document.addEventListener("DOMContentLoaded", bootstrap);
})();
