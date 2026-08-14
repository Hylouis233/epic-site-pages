(function () {
    const config = window.EPIC_DASHBOARD_CONFIG || {};

    function t(english, chinese) {
        const i18n = window.EPIC_I18N;
        return i18n && typeof i18n.t === "function" ? i18n.t(english, chinese) : english;
    }

    function currentLocale() {
        const i18n = window.EPIC_I18N;
        return i18n && typeof i18n.isChinese === "function" && i18n.isChinese() ? "zh-CN" : "en-US";
    }

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
        manifestController: null,
        epietlController: null,
        mapController: null,
        tableController: null,
        staticRecords: null,
        staticRecordsPromise: null,
        staticManifestPayload: null,
        staticManifestPromise: null,
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
        filterResult: document.getElementById("filter-result"),
        heroStatus: document.getElementById("hero-status"),
        siteStatus: document.getElementById("site-status"),
        statusLabel: document.getElementById("status-label"),
        statusMessage: document.getElementById("status-message"),
        statusBanner: document.getElementById("status-banner"),
        statusDetail: document.getElementById("status-detail"),
        briefStatus: document.getElementById("brief-status"),
        heroRecordCount: document.getElementById("hero-record-count"),
        dataAsOf: document.getElementById("data-as-of"),
        lastSuccessfulIngest: document.getElementById("last-successful-ingest"),
        stalenessHours: document.getElementById("staleness-hours"),
        schemaVersion: document.getElementById("schema-version"),
        buildGenerated: document.getElementById("build-generated"),
        dataRecordCount: document.getElementById("data-record-count"),
        dataSourceCount: document.getElementById("data-source-count"),
        agentMatchCount: document.getElementById("agent-match-count"),
        epietlMeta: document.getElementById("epietl-meta"),
        epietlMetrics: document.getElementById("epietl-metrics"),
        epietlSummaryText: document.getElementById("epietl-summary-text"),
        epietlCountryRisks: document.getElementById("epietl-country-risks"),
        epietlEventsMeta: document.getElementById("epietl-events-meta"),
        epietlEvents: document.getElementById("epietl-events"),
        map: document.getElementById("map"),
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
        copyFilterLink: document.getElementById("copy-filter-link"),
    };

    const tableColumns = [
        { key: "original_date", className: "table-cell--compact" },
        { key: "location", className: "table-cell--compact" },
        { key: "disease", className: "table-cell--compact" },
        { key: "description_cn", className: "table-cell--wide" },
        { key: "metrics", className: "table-cell--metric" },
        { key: "source", className: "table-cell--source" },
        { key: "quality", className: "table-cell--quality" },
        { key: "event", className: "table-cell--action" },
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
            return t("Unknown", "未知");
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString(currentLocale(), {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    }

    function formatDate(value) {
        if (!value) {
            return t("Unknown", "未知");
        }
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }
        return date.toLocaleDateString(currentLocale(), { year: "numeric", month: "2-digit", day: "2-digit" });
    }

    function formatHours(value) {
        const hours = Number(value);
        if (!Number.isFinite(hours)) {
            return t("Unknown", "未知");
        }
        if (hours >= 48) {
            return t(
                `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`,
                `${Math.floor(hours / 24)} 天 ${Math.round(hours % 24)} 小时`,
            );
        }
        return t(`${Math.round(hours)}h`, `${Math.round(hours)} 小时`);
    }

    function formatCount(value) {
        return new Intl.NumberFormat(currentLocale()).format(value || 0);
    }

    function renderSeverityPill(severity) {
        const normalized = String(severity || "").toLowerCase();
        const labelMap = {
            critical: t("Critical", "严重"),
            high: t("High", "高"),
            medium: t("Medium", "中"),
            low: t("Low", "低"),
        };
        const label = labelMap[normalized] || t("Unrated", "未分级");
        return `<span class="severity-pill severity-pill--${escapeHtml(normalized || "unknown")}">${escapeHtml(label)}</span>`;
    }

    function clampNumber(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return min;
        }
        return Math.min(Math.max(number, min), max);
    }

    function lonLatToWorldPoint(longitude, latitude) {
        const safeLongitude = clampNumber(longitude, -180, 180);
        const safeLatitude = clampNumber(latitude, -85.05112878, 85.05112878);
        const sine = Math.sin((safeLatitude * Math.PI) / 180);
        return {
            x: ((safeLongitude + 180) / 360) * 100,
            y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * 100,
        };
    }

    function getGeoPoint(record) {
        if (!hasValidCoordinates(record)) {
            return null;
        }

        const point = lonLatToWorldPoint(record.longitude, record.latitude);
        return {
            x: clampNumber(point.x, 0, 100),
            y: clampNumber(point.y, 0, 100),
        };
    }

    function renderLocationMiniMap(record, modifier) {
        if (!hasValidCoordinates(record || {})) {
            return "";
        }

        const locationLabel = record.location || record.continent || t("Event location", "事件地点");
        const className = ["location-mini-map", modifier ? `location-mini-map--${modifier}` : ""].filter(Boolean).join(" ");
        return `
            <div class="${className}" role="img" aria-label="${escapeHtml(t(`${locationLabel} mini map`, `${locationLabel} 微缩地图`))}">
                <span class="location-mini-map__grid" aria-hidden="true"></span>
                <span class="location-mini-map__marker" style="--x:${getGeoPoint(record).x}%; --y:${getGeoPoint(record).y}%;"></span>
            </div>
        `;
    }

    function renderWorldLayer() {
        return `
            <div class="abstract-world" aria-hidden="true">
                <svg viewBox="0 0 1000 500" preserveAspectRatio="none">
                    <g class="abstract-world__grid">
                        <path d="M0 100H1000M0 200H1000M0 300H1000M0 400H1000" />
                        <path d="M125 0V500M250 0V500M375 0V500M500 0V500M625 0V500M750 0V500M875 0V500" />
                    </g>
                    <g class="abstract-world__land">
                        <path d="M62 128L111 78l83-29 77 18 55 47-17 44-47 20-22 58-55 16-61-44-42-13z" />
                        <path d="M238 260l48 27 28 82-14 77-34 39-22-73-39-61 7-58z" />
                        <path d="M435 119l52-43 74 9 29 32 49-11 70 24 112 14 70 62-40 56-88-8-45 38-76-29-52 21-79-36-20-70-49-20z" />
                        <path d="M475 252l92 6 40 55-18 91-61 59-45-80-39-66z" />
                        <path d="M809 356l64-34 61 23-5 52-69 26-51-24z" />
                    </g>
                    <path class="abstract-world__route" d="M146 168C308 61 524 388 848 231" />
                </svg>
                <span class="abstract-world__label abstract-world__label--one">PUBLIC-SOURCE SIGNALS</span>
                <span class="abstract-world__label abstract-world__label--two">LOW-PRECISION OVERVIEW</span>
            </div>
        `;
    }

    function summarizeFilters() {
        const parts = [];
        if (state.filters.keyword) {
            parts.push(t(`Keyword “${state.filters.keyword}”`, `关键词“${state.filters.keyword}”`));
        }
        if (state.filters.disease) {
            parts.push(t(`Disease ${state.filters.disease}`, `疾病 ${state.filters.disease}`));
        }
        if (state.filters.continent) {
            parts.push(t(`Continent ${state.filters.continent}`, `洲别 ${state.filters.continent}`));
        }
        if (state.filters.date_from) {
            parts.push(t(`From ${state.filters.date_from}`, `起始 ${state.filters.date_from}`));
        }
        if (state.filters.date_to) {
            parts.push(t(`Through ${state.filters.date_to}`, `截止 ${state.filters.date_to}`));
        }
        return parts.length ? parts.join(" / ") : t("No filters applied.", "未应用筛选。");
    }

    function updateFilterSummary() {
        elements.filterSummary.textContent = summarizeFilters();
    }

    function syncFiltersToUrl() {
        const query = buildQuery();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || "#events"}`;
        window.history.replaceState({}, "", nextUrl);
    }

    function hydrateFiltersFromUrl() {
        const searchParams = new URLSearchParams(window.location.search);
        const fields = {
            keyword: elements.keywordInput,
            disease: elements.diseaseSelect,
            continent: elements.continentSelect,
            date_from: elements.dateFromInput,
            date_to: elements.dateToInput,
        };
        Object.keys(fields).forEach(function (key) {
            const value = searchParams.get(key) || "";
            state.filters[key] = value;
            if (fields[key]) {
                fields[key].value = value;
            }
        });
        updateFilterSummary();
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
            const label = elements.themeToggle.querySelector(".theme-toggle__label");
            if (label) {
                label.textContent = isDark ? t("Light", "浅色") : t("Dark", "深色");
            }
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
        if (!elements.heroStatus) {
            return;
        }
        elements.heroStatus.textContent = text;
        elements.heroStatus.classList.remove("status--good", "status--danger", "status--warning");
        if (tone) {
            elements.heroStatus.classList.add(tone);
        }
    }

    function syncSelectOptions(selectElement, options, placeholder) {
        const stateValue = selectElement === elements.diseaseSelect
            ? state.filters.disease
            : selectElement === elements.continentSelect
                ? state.filters.continent
                : "";
        const currentValue = selectElement.value || stateValue;
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
                event_id: record.event_id || record.id,
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

    async function loadStaticManifest() {
        if (state.staticManifestPayload) {
            return state.staticManifestPayload;
        }
        if (state.staticManifestPromise) {
            return state.staticManifestPromise;
        }
        state.staticManifestPromise = fetchJsonUrl(config.staticManifestUrl, "manifestController")
            .then(function (payload) {
                state.staticManifestPayload = payload || {};
                return state.staticManifestPayload;
            })
            .finally(function () {
                state.staticManifestPromise = null;
            });
        return state.staticManifestPromise;
    }

    function renderManifest(manifest) {
        const status = manifest.source_status || "failed";
        const englishLabels = {
            healthy: "Healthy",
            degraded: "Degraded",
            stale: "Stale",
            failed: "Failed",
        };
        const englishMessages = {
            healthy: "Upstream ingestion and public-data quality checks passed.",
            degraded: "Upstream ingestion did not pass the quality gate; the latest successful snapshot remains available.",
            stale: "The data snapshot is older than the freshness threshold. Use it with caution.",
            failed: "No public data snapshot is available.",
        };
        const label = t(englishLabels[status] || "Unknown", manifest.source_status_label || "未知");
        const message = t(
            manifest.status_message_en || englishMessages[status] || "Data status is unavailable.",
            manifest.status_message_zh || "数据状态不可用。",
        );
        if (elements.siteStatus) {
            elements.siteStatus.dataset.status = status;
        }
        if (elements.statusBanner) {
            elements.statusBanner.dataset.status = status;
        }
        if (elements.statusLabel) {
            elements.statusLabel.textContent = t(`Data status: ${label}`, `数据状态：${label}`);
        }
        if (elements.statusMessage) {
            elements.statusMessage.textContent = message;
        }
        if (elements.statusDetail) {
            elements.statusDetail.textContent = t(
                `Data as of ${formatDate(manifest.data_as_of)}; last successful ingest ${formatDateTime(manifest.last_successful_ingest_at)}; snapshot age ${formatHours(manifest.staleness_hours)}.`,
                `数据截至 ${formatDate(manifest.data_as_of)}；最近成功采集 ${formatDateTime(manifest.last_successful_ingest_at)}；快照年龄 ${formatHours(manifest.staleness_hours)}。`,
            );
        }
        if (elements.briefStatus) {
            elements.briefStatus.textContent = status.toUpperCase();
        }
        if (elements.heroRecordCount) {
            elements.heroRecordCount.textContent = formatCount(manifest.record_count);
        }
        if (elements.dataAsOf) {
            elements.dataAsOf.textContent = formatDate(manifest.data_as_of);
        }
        if (elements.lastSuccessfulIngest) {
            elements.lastSuccessfulIngest.textContent = formatDateTime(manifest.last_successful_ingest_at);
        }
        if (elements.stalenessHours) {
            elements.stalenessHours.textContent = formatHours(manifest.staleness_hours);
        }
        if (elements.schemaVersion) {
            elements.schemaVersion.textContent = `v${manifest.schema_version || "—"}`;
        }
        if (elements.buildGenerated) {
            elements.buildGenerated.textContent = t(
                `Page built ${formatDateTime(manifest.build_generated_at)}`,
                `页面构建 ${formatDateTime(manifest.build_generated_at)}`,
            );
        }
        if (elements.dataRecordCount) {
            elements.dataRecordCount.textContent = formatCount(manifest.record_count);
        }
        if (elements.dataSourceCount) {
            elements.dataSourceCount.textContent = formatCount(manifest.source_count);
        }
        const tone = status === "healthy" ? "status--good" : status === "failed" ? "status--danger" : "status--warning";
        setHeroStatus(t(`Data status: ${label}`, `数据状态：${label}`), tone);
    }

    async function loadManifest() {
        if (!config.staticManifestUrl) {
            return;
        }
        try {
            renderManifest(await loadStaticManifest());
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            renderManifest({
                source_status: "failed",
                source_status_label: t("Unavailable", "不可用"),
                status_message_en: "Unable to read the data-status manifest.",
                status_message_zh: t("Unable to read the data-status manifest.", "无法读取数据状态清单。"),
            });
        }
    }

    function renderOverview(payload) {
        const cards = [
            { marker: "REC", label: t("Total records", "记录总数"), value: formatCount(payload.total_records) },
            { marker: "DIS", label: t("Disease types", "疾病类型"), value: formatCount(payload.disease_count) },
            { marker: "CON", label: t("Continents", "洲别覆盖"), value: formatCount(payload.continent_count) },
            { marker: "UPD", label: t("Latest date", "最新日期"), value: payload.latest_date || t("None", "暂无") },
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

        syncSelectOptions(elements.diseaseSelect, payload.filter_options && payload.filter_options.diseases, t("All diseases", "全部疾病"));
        syncSelectOptions(elements.continentSelect, payload.filter_options && payload.filter_options.continents, t("All continents", "全部洲别"));
        if (elements.filterResult) {
            elements.filterResult.textContent = t(
                `${formatCount(payload.total_records)} matches`,
                `命中 ${formatCount(payload.total_records)} 条`,
            );
        }
    }

    function aggregateMapItems(items) {
        const clusters = new Map();
        const cellSize = 7;

        (Array.isArray(items) ? items : []).forEach(function (item) {
            const point = getGeoPoint(item);
            if (!point) {
                return;
            }

            const key = `${Math.round(point.x / cellSize)}:${Math.round(point.y / cellSize)}`;
            if (!clusters.has(key)) {
                clusters.set(key, {
                    x: 0,
                    y: 0,
                    count: 0,
                    items: [],
                });
            }

            const cluster = clusters.get(key);
            cluster.x += point.x;
            cluster.y += point.y;
            cluster.count += 1;
            cluster.items.push(item);
        });

        return Array.from(clusters.values()).map(function (cluster) {
            cluster.x = clampNumber(cluster.x / cluster.count, 2, 98);
            cluster.y = clampNumber(cluster.y / cluster.count, 4, 96);
            cluster.tone = getClusterTone(cluster.count);
            cluster.size = getClusterSize(cluster.count);
            return cluster;
        }).sort(function (a, b) {
            return a.count - b.count;
        });
    }

    function renderMapPopup(cluster) {
        const previewItems = cluster.items.slice(0, 4);
        const moreCount = Math.max(cluster.count - previewItems.length, 0);
        return `
            <div class="abstract-map__popup" style="--x: ${cluster.x}%; --y: ${cluster.y}%;" data-map-popup>
                <div class="abstract-map__popup-head">
                    <h3 class="abstract-map__popup-title">${t(`${formatCount(cluster.count)} events`, `${formatCount(cluster.count)} 个事件`)}</h3>
                    <button class="abstract-map__popup-close" type="button" data-map-popup-close aria-label="${t("Close", "关闭")}">×</button>
                </div>
                <ul class="abstract-map__event-list">
                    ${previewItems.map(function (item) {
                        const detailUrl = item.event_id ? `./events/${encodeURIComponent(item.event_id)}/` : "#table-panel";
                        return `
                            <li class="abstract-map__event">
                                <div class="abstract-map__event-title">
                                    <a href="${detailUrl}">${escapeHtml(item.disease || t("Unspecified disease", "未标注疾病"))} · ${escapeHtml(item.location || t("Unknown location", "未知地点"))}</a>
                                </div>
                                <div class="abstract-map__event-meta">
                                    ${escapeHtml(item.original_date || t("Unknown date", "未知日期"))} / ${escapeHtml(item.source_org || t("Unknown source", "未知来源"))}
                                </div>
                                <div class="abstract-map__event-summary">${escapeHtml(item.description_cn || t("No summary available", "暂无摘要"))}</div>
                            </li>
                        `;
                    }).join("")}
                </ul>
                ${moreCount ? `<div class="abstract-map__event-meta">${t(`${formatCount(moreCount)} more events.`, `另有 ${formatCount(moreCount)} 个事件。`)}</div>` : ""}
            </div>
        `;
    }

    function bindMapClusterEvents(clusters) {
        elements.map.querySelectorAll("[data-map-cluster]").forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.getAttribute("data-map-cluster"));
                const cluster = clusters[index];
                if (!cluster) {
                    return;
                }

                const oldPopup = elements.map.querySelector("[data-map-popup]");
                if (oldPopup) {
                    oldPopup.remove();
                }
                elements.map.insertAdjacentHTML("beforeend", renderMapPopup(cluster));

                const closeButton = elements.map.querySelector("[data-map-popup-close]");
                if (closeButton) {
                    closeButton.addEventListener("click", function () {
                        const popup = elements.map.querySelector("[data-map-popup]");
                        if (popup) {
                            popup.remove();
                        }
                    });
                }
            });
        });
    }

    function renderMap(items) {
        const safeItems = Array.isArray(items) ? items : [];
        const clusters = aggregateMapItems(safeItems);
        elements.mapMeta.textContent = t(
            `${formatCount(safeItems.length)} map points shown`,
            `当前地图点位 ${formatCount(safeItems.length)} 个`,
        );
        elements.map.innerHTML = renderWorldLayer();

        if (!clusters.length) {
            elements.mapEmpty.classList.remove("hidden");
            return;
        }

        elements.mapEmpty.classList.add("hidden");
        elements.map.insertAdjacentHTML("beforeend", clusters.map(function (cluster, index) {
            return `
                <button
                    class="abstract-map__point"
                    type="button"
                    style="--x: ${cluster.x}%; --y: ${cluster.y}%; --size: ${cluster.size}px;"
                    data-map-cluster="${index}"
                    aria-label="${t(`${formatCount(cluster.count)} events`, `${formatCount(cluster.count)} 个事件`)}"
                >
                    <span class="cluster-badge cluster-badge--${cluster.tone}" title="${t(`${formatCount(cluster.count)} events`, `${formatCount(cluster.count)} 个事件`)}">
                        ${formatCount(cluster.count)}
                    </span>
                </button>
            `;
        }).join(""));
        bindMapClusterEvents(clusters);
    }

    function renderEpietl(payload) {
        const meta = payload && payload.meta ? payload.meta : {};
        const riskSummary = payload && payload.risk_summary ? payload.risk_summary : {};
        const events = Array.isArray(payload && payload.events) ? payload.events : [];
        const countryRisks = Array.isArray(riskSummary.country_risks) ? riskSummary.country_risks : [];

        const metrics = [
            { marker: "CHN", label: t("Monitoring channels", "监测通道"), value: formatCount(meta.channel_count) },
            { marker: "RPT", label: t("Total reports", "累计报告"), value: formatCount(meta.total_reports) },
            { marker: "PDG", label: t("Pending", "待处理"), value: formatCount(meta.pending_reports) },
            { marker: "RSK", label: t("Risk events", "风险事件"), value: formatCount(events.length) },
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
            ? t(
                `Public snapshot ${formatDateTime(meta.fetched_at)} · ${formatCount(meta.dashboard_days)}-day risk window`,
                `公开快照 ${formatDateTime(meta.fetched_at)} · 风险窗口 ${formatCount(meta.dashboard_days)} 天`,
            )
            : t("No EpiETL public snapshot synced", "未同步 EpiETL 公共快照");

        elements.epietlSummaryText.textContent = meta.reports_analyzed
            ? t(
                `${formatCount(meta.reports_analyzed)} reports analyzed`,
                `分析报告 ${formatCount(meta.reports_analyzed)} 份`,
            )
            : t("No analysis summary available", "暂无分析报告摘要");

        if (countryRisks.length) {
            elements.epietlCountryRisks.innerHTML = countryRisks.map(function (item) {
                return `
                    <article class="intel-item">
                        <div class="intel-item__row">
                            <strong>${escapeHtml(item.country || t("Unknown region", "未知地区"))}</strong>
                            <span class="intel-item__score">${formatCount(item.score)}</span>
                        </div>
                        <div class="intel-item__row intel-item__row--meta">
                            ${renderSeverityPill(item.level)}
                            <span>${escapeHtml(item.top_pathogen || t("Unspecified pathogen", "未标注病原体"))}</span>
                        </div>
                    </article>
                `;
            }).join("");
        } else {
            elements.epietlCountryRisks.innerHTML = `<div class="intel-empty">${t("No country risk scores are currently available.", "当前没有可展示的国家风险评分。")}</div>`;
        }

        elements.epietlEventsMeta.textContent = events.length
            ? t(
                `Showing ${formatCount(events.length)} public events`,
                `展示前 ${formatCount(events.length)} 条公开事件`,
            )
            : t("No event snapshot available", "暂无事件快照");

        if (events.length) {
            elements.epietlEvents.innerHTML = events.map(function (item) {
                const regionText = Array.isArray(item.regions) && item.regions.length
                    ? item.regions.join(" / ")
                    : t("Unspecified region", "未标注地区");
                const sourceLink = item.source_url
                    ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener noreferrer" class="table-cell__link">${t("View source", "查看来源")}</a>`
                    : t("No source link", "无来源链接");
                return `
                    <article class="intel-item">
                        <div class="intel-item__row">
                            <strong>${escapeHtml(item.title || t("Untitled event", "未命名事件"))}</strong>
                            ${renderSeverityPill(item.severity)}
                        </div>
                        <p class="intel-item__summary">${escapeHtml(item.summary || t("No summary available.", "暂无摘要。"))}</p>
                        <div class="intel-item__row intel-item__row--meta">
                            <span>${escapeHtml(item.pathogen || t("Unspecified pathogen", "未标注病原体"))}</span>
                            <span>${escapeHtml(regionText)}</span>
                            <span>${escapeHtml(item.source_org || t("Unknown organization", "未知机构"))}</span>
                            <span>${sourceLink}</span>
                        </div>
                    </article>
                `;
            }).join("");
        } else {
            elements.epietlEvents.innerHTML = `<div class="intel-empty">${t("No public risk events are currently available.", "当前没有可展示的公开风险事件。")}</div>`;
        }
    }

    function renderTableRows(items) {
        elements.tableBody.innerHTML = "";
        if (!items.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = tableColumns.length;
            cell.textContent = t("No detailed records match the current filters.", "当前筛选条件下没有明细记录。");
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
                    const wrapper = document.createElement("div");
                    wrapper.className = "source-cell";
                    const organization = document.createElement("strong");
                    organization.textContent = item.source_org || t("Source not specified", "来源未注明");
                    const link = document.createElement("a");
                    link.href = item.source;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.className = "table-cell__link";
                    link.textContent = t("Original source ↗", "原始来源 ↗");
                    wrapper.appendChild(organization);
                    wrapper.appendChild(link);
                    cell.appendChild(wrapper);
                } else if (column.key === "description_cn") {
                    cell.innerHTML = `
                        <div class="event-description">
                            <p>${escapeHtml(item.description_cn || "—")}</p>
                            ${renderLocationMiniMap(item, "table")}
                        </div>
                    `;
                } else if (column.key === "metrics") {
                    const cases = item.cases === null || item.cases === undefined ? "—" : formatCount(item.cases);
                    const deaths = item.deaths === null || item.deaths === undefined ? "—" : formatCount(item.deaths);
                    cell.innerHTML = `<span class="metric-pair"><strong>${cases}</strong><small>${t("Cases", "病例")}</small></span><span class="metric-pair"><strong>${deaths}</strong><small>${t("Deaths", "死亡")}</small></span>`;
                } else if (column.key === "quality") {
                    const score = Number.isFinite(Number(item.data_quality_score)) ? Number(item.data_quality_score) : "—";
                    const tone = Number(score) >= 90 ? "good" : Number(score) >= 70 ? "warning" : "danger";
                    cell.innerHTML = `<span class="quality-badge quality-badge--${tone}"><strong>${escapeHtml(score)}</strong><small>/100</small></span>`;
                } else if (column.key === "event") {
                    const detailUrl = item.event_id ? `./events/${encodeURIComponent(item.event_id)}/` : "#";
                    const eventLabel = item.disease || t("event", "事件");
                    cell.innerHTML = `<a class="event-link" href="${detailUrl}" aria-label="${escapeHtml(t(`View details for ${eventLabel}`, `查看 ${eventLabel} 详情`))}">${t("Details →", "详情 →")}</a>`;
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
        info.textContent = t(
            `${formatCount(total)} total · page ${page} of ${totalPages}`,
            `共 ${formatCount(total)} 条，当前第 ${page} / ${totalPages} 页`,
        );

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

        appendButton(t("Previous", "上一页"), page <= 1, function () {
            loadTable(page - 1);
        });

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);
        for (let current = startPage; current <= endPage; current += 1) {
            appendButton(String(current), false, function () {
                loadTable(current);
            }, current === page);
        }

        appendButton(t("Next", "下一页"), page >= totalPages, function () {
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
                setHeroStatus(t("Summary data failed to load", "摘要数据加载失败"), "status--danger");
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
            setHeroStatus(t("Summary data failed to load", "摘要数据加载失败"), "status--danger");
        }
    }

    async function loadMap() {
        elements.mapMeta.textContent = t("Refreshing map points", "正在刷新地图点位");

        if (isStaticMode()) {
            try {
                const records = await loadStaticDataset();
                const filteredRecords = applyClientFilters(records, state.filters);
                renderMap(buildClientMapPayload(filteredRecords));
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                elements.mapMeta.textContent = t("Map failed to load", "地图加载失败");
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
            elements.mapMeta.textContent = t("Map failed to load", "地图加载失败");
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
            elements.epietlMeta.textContent = t("EpiETL intelligence failed to load", "EpiETL 情报加载失败");
            elements.epietlSummaryText.textContent = t("The public intelligence API is unavailable", "公开情报接口不可用");
            elements.epietlCountryRisks.innerHTML = `<div class="intel-empty">${t("The EpiETL intelligence API failed to load.", "EpiETL 情报接口加载失败。")}</div>`;
            elements.epietlEventsMeta.textContent = t("Failed to load", "加载失败");
            elements.epietlEvents.innerHTML = `<div class="intel-empty">${t("Please try again later.", "请稍后重试。")}</div>`;
        }
    }

    async function loadTable(page) {
        state.page = page || 1;
        state.tableLoaded = true;
        elements.tableMeta.textContent = t("Loading paginated records", "正在加载分页明细");
        elements.tablePlaceholder.classList.add("hidden");
        elements.tableShell.classList.remove("hidden");
        elements.tableBody.innerHTML = `<tr><td colspan="${tableColumns.length}">${t("Loading records, please wait…", "正在加载明细，请稍候…")}</td></tr>`;

        if (isStaticMode()) {
            try {
                const records = await loadStaticDataset();
                const filteredRecords = applyClientFilters(records, state.filters);
                const payload = buildClientTablePayload(filteredRecords, state.page, state.pageSize);
                renderTableRows(payload.items || []);
                elements.tableCount.textContent = t(
                    `${formatCount(payload.total)} records`,
                    `${formatCount(payload.total)} 条记录`,
                );
                elements.tablePageStatus.textContent = t(
                    `Page ${payload.page} / ${payload.page_size} per page`,
                    `第 ${payload.page} 页 / 每页 ${payload.page_size} 条`,
                );
                elements.tableMeta.textContent = t(
                    `${formatCount(payload.total)} traceable records loaded`,
                    `已加载 ${formatCount(payload.total)} 条可追溯记录`,
                );
                buildPagination(payload.total || 0, payload.page || 1, payload.page_size || state.pageSize);
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                elements.tableMeta.textContent = t("Table failed to load", "表格加载失败");
                elements.tableBody.innerHTML = `<tr><td colspan="${tableColumns.length}">${t("The record API failed to load. Please try again later.", "明细接口加载失败，请稍后重试。")}</td></tr>`;
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
            elements.tableCount.textContent = t(
                `${formatCount(payload.total)} records`,
                `${formatCount(payload.total)} 条记录`,
            );
            elements.tablePageStatus.textContent = t(
                `Page ${payload.page} / ${payload.page_size} per page`,
                `第 ${payload.page} 页 / 每页 ${payload.page_size} 条`,
            );
            elements.tableMeta.textContent = t(
                `Records loaded · updated ${formatDateTime(payload.last_modified)}`,
                `明细已加载，更新时间 ${formatDateTime(payload.last_modified)}`,
            );
            buildPagination(payload.total || 0, payload.page || 1, payload.page_size || state.pageSize);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            elements.tableMeta.textContent = t("Table failed to load", "表格加载失败");
            elements.tableBody.innerHTML = `<tr><td colspan="${tableColumns.length}">${t("The record API failed to load. Please try again later.", "明细接口加载失败，请稍后重试。")}</td></tr>`;
            elements.pagination.innerHTML = "";
        }
    }

    function refreshDataAfterFilters() {
        state.page = 1;
        syncFiltersToUrl();
        loadOverview();
        loadMap();
        if (state.tableLoaded) {
            loadTable(1);
        } else {
            elements.tableMeta.textContent = t("Scroll here to load automatically", "滚动到此区域后自动加载");
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
        if (elements.copyFilterLink) {
            elements.copyFilterLink.addEventListener("click", async function () {
                syncFiltersToUrl();
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    elements.copyFilterLink.textContent = t("Link copied", "链接已复制");
                } catch (error) {
                    elements.copyFilterLink.textContent = t("Copy the link from the address bar", "请复制地址栏链接");
                }
                window.setTimeout(function () {
                    elements.copyFilterLink.textContent = t("Copy filter link", "复制筛选链接");
                }, 1800);
            });
        }
    }

    function setupCopyButtons() {
        document.querySelectorAll("[data-copy-target]").forEach(function (button) {
            button.addEventListener("click", async function () {
                const target = document.getElementById(button.dataset.copyTarget);
                if (!target) {
                    return;
                }
                try {
                    await navigator.clipboard.writeText(target.textContent.trim());
                    button.textContent = t("Copied", "已复制");
                } catch (error) {
                    button.textContent = t("Copy failed", "复制失败");
                }
                window.setTimeout(function () {
                    button.textContent = t("Copy", "复制");
                }, 1600);
            });
        });
    }

    async function loadAgentExampleCount() {
        if (!elements.agentMatchCount) {
            return;
        }
        try {
            const records = await loadStaticDataset();
            const matches = records.filter(function (record) {
                return record.disease_id === "dengue" && ["Asia", "亚洲"].includes(record.continent);
            });
            elements.agentMatchCount.textContent = formatCount(matches.length);
        } catch (error) {
            elements.agentMatchCount.textContent = "—";
        }
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
            setHeroStatus(t("Page configuration is missing; data cannot be loaded.", "页面配置缺失，无法加载数据。"), "status--danger");
            return;
        }

        hydrateFiltersFromUrl();
        setupThemeToggle();
        setupFilterEvents();
        setupCopyButtons();
        setupLazyTableLoad();
        loadManifest();
        loadOverview();
        loadEpietl();
        loadMap();
        loadAgentExampleCount();
    }

    document.addEventListener("DOMContentLoaded", bootstrap);
})();
