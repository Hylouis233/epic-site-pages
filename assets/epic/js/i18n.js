(function () {
    "use strict";

    const STORAGE_KEY = "epic-lang";
    const translations = Object.freeze({
        "Skip to main content": "跳到主要内容",
        "Verifying data status": "正在核验数据状态",
        "Reading the versioned manifest…": "正在读取版本化数据清单…",
        "How status works": "查看状态说明",
        "Events": "事件",
        "Map": "地图",
        "Global infectious-disease": "全球传染病",
        "event monitor.": "事件监测。",
        "View the register ↓": "查看明细 ↓",
        "Download CSV": "下载 CSV",
        "RSS ↗": "RSS ↗",
        "Data contract →": "数据契约 →",
        "Current data status": "当前数据状态",
        "DATA AS OF": "数据截至",
        "LAST GOOD INGEST": "最近成功采集",
        "RECORDS": "记录",
        "SNAPSHOT AGE": "快照年龄",
        "SCHEMA": "SCHEMA",
        "STATUS": "状态",
        "EVENT MONITOR": "事件监测",
        "ATLAS / EVENT DISTRIBUTION": "ATLAS / 事件分布",
        "Geographic distribution of events": "事件地理分布",
        "Dot size and colour reflect the number of records aggregated at each location. Select a region on the right to filter the register.": "点大小与颜色表示该位置聚合的记录数。选择右侧区域即可筛选事件明细。",
        "AGGREGATION INTENSITY": "聚合强度",
        "Geographic distribution of public event records": "公开事件记录地理分布",
        "Regional index": "区域索引",
        "Basemap shows land outline only—no borders or place labels. Dots mark event report locations and imply no sovereignty position.": "底图仅显示陆地轮廓，不含国界与地名标注；点位为事件报告地，不代表任何主权主张。",
        "Table density": "表格密度",
        "DENSITY": "密度",
        "Compact": "紧凑",
        "Comfortable": "舒适",
        "PUBLISHED": "发布日期",
        "LOCATION": "暴发地点",
        "DISEASE": "传染病",
        "EVENT SUMMARY": "情况介绍",
        "SYMPTOMS": "症状",
        "MEASURES": "扑灭措施",
        "TRANSMISSION": "传播方式",
        "CASES": "病例",
        "DEATHS": "死亡",
        "SOURCE ORG": "来源机构",
        "SOURCE": "来源",
        "QUALITY": "质量",
        "DETAIL": "详情",
        "DATA & AGENT ACCESS": "数据与 AGENT 访问",
        "METHOD & LIMITS": "方法与局限",
        "RESEARCH": "研究",
        "Reproduce event-based analyses with provenance and quality fields.": "利用溯源与质量字段复现事件型分析。",
        "PRACTICE": "实务",
        "Scan public signals, then return to the original notice to verify.": "浏览公开信号，并回到原始公告核验。",
        "BUILD": "开发",
        "Connect versioned endpoints, checksums, and agent queries.": "接入版本化端点、校验和与 Agent 查询。",
        "Daily archive": "每日归档",
        "Who it serves": "适用人群",
        "Regions": "区域",
        "Data": "数据接口",
        "Method & limits": "方法与局限",
        "Dark": "深色",
        "Light": "浅色",
        "Turn scattered outbreak signals into": "把分散的疫情公开信号，转化为",
        "traceable event data.": "可追溯的事件数据。",
        "EPIC brings together health-agency notices, ProMED, RSS feeds, and open reporting for public-health monitoring and early-warning research—with source provenance, map search, versioned data, and agent-ready access.": "EPIC 面向公共卫生监测与早期预警研究，聚合卫生机构公告、ProMED、RSS 与公开报道，提供来源溯源、地图检索、版本化数据接口和 Agent 查询能力。",
        "Explore latest events": "浏览最新事件",
        "Use the data": "使用数据接口",
        "Subscribe to updates ↗": "订阅每日更新 ↗",
        "EVENT-BASED OPEN-SOURCE MONITORING · INCOMPLETE COVERAGE · NOT AN OFFICIAL ALERT · NOT MEDICAL ADVICE": "事件型公开来源监测 · 非完整全球覆盖 · 非正式公共卫生预警 · 不构成医疗建议",
        "PUBLIC EVENT RECORDS": "公开事件记录",
        "DATA AS OF": "数据截至",
        "LAST GOOD INGEST": "最近成功采集",
        "SNAPSHOT AGE": "快照年龄",
        "LOADING": "读取中",
        "READING BUILD TIME": "构建时间读取中",
        "TRACEABLE": "可追溯",
        "Every record keeps a stable ID, source link, and revision history.": "每条记录保留稳定 ID、来源链接与修订信息。",
        "MACHINE-READABLE": "机器可读",
        "JSON, NDJSON, CSV, GeoJSON, and Parquet.": "JSON、NDJSON、CSV、GeoJSON 与 Parquet。",
        "AGENT-READY": "Agent 友好",
        "Query by disease, place, date, source, and quality.": "按疾病、地区、日期、来源与质量字段查询。",
        "One dataset. Three ways in.": "一套数据，三种使用入口。",
        "EPIC is not just another outbreak map. It puts human exploration, machine access, and agent queries on the same auditable data trail.": "EPIC 的核心不是另一张疫情地图，而是把人类浏览、机器调用与 Agent 查询放进同一条可审计链路。",
        "RESEARCH": "研究",
        "Reproduce event-based analyses": "复现事件型监测分析",
        "Download structured records with separate event, publication, and observation times—plus provenance and quality fields.": "下载结构化记录，区分事件发生、报道发布与系统发现时间，保留来源与质量字段。",
        "Inspect the data contract →": "查看数据合同 →",
        "PRACTICE": "实务",
        "Scan public outbreak signals": "快速浏览公开疫情信号",
        "Search recent signals by disease, place, continent, time, and source—then return to the original notice to verify.": "按疾病、地点、洲别、时间和来源检索近期信号，并回到原始公告核验。",
        "Start exploring →": "开始检索 →",
        "BUILD": "开发",
        "Connect data and agents": "接入数据与 Agent",
        "Build downstream prototypes with versioned endpoints, a schema, checksums, and the EPIC query skill.": "使用版本化端点、Schema、校验和及 EPIC 查询 Skill 构建下游原型。",
        "See the agent example →": "查看 Agent 示例 →",
        "Public-source event register": "公开来源事件监测台",
        "Filters are reflected in the URL for sharing and citation. Counts describe this public snapshot—not global disease burden.": "筛选条件会同步到 URL，可复制、收藏和引用。数量代表当前公开快照中的事件记录，不代表全球疾病负担。",
        "Reading source status": "正在读取来源状态",
        "Freshness and ingest status will appear after verification.": "数据状态完成核验后显示。",
        "Quality report ↗": "质量报告 ↗",
        "TOTAL RECORDS": "记录总数",
        "DISEASE CATEGORIES": "规范疾病类目",
        "CONTINENTS": "洲别覆盖",
        "LATEST FILTERED DATE": "筛选内最新日期",
        "FILTER / EVENT SEARCH": "FILTER / 事件检索",
        "Narrow the signal set": "缩小信号范围",
        "Copy filter link": "复制筛选链接",
        "Clear filters": "清空条件",
        "KEYWORD": "关键词",
        "DISEASE": "疾病类型",
        "CONTINENT": "洲别",
        "FROM": "开始日期",
        "TO": "结束日期",
        "CURRENT FILTER": "当前条件",
        "No filters applied.": "未应用筛选。",
        "Ready": "就绪",
        "ATLAS / EVENT MAP": "ATLAS / 事件图谱",
        "Geographic distribution of public signals": "公开信号地理分布",
        "Preparing mapped records": "正在准备点位数据",
        "Locations are low-precision public geocodes for overview only; some points are country or administrative centroids.": "点位采用低精度公开定位，仅用于概览；部分地点为国家或行政区质心。",
        "No mapped records match the current filters.": "当前筛选条件下没有可展示的地图点位。",
        "REGISTER / EVENT RECORDS": "REGISTER / 事件登记册",
        "Traceable event details": "可追溯事件明细",
        "Loads when this section enters view": "滚动到此区域后加载",
        "Paginated details load on entry; the homepage does not prefetch full records.": "进入本区后加载分页明细，首页不会预取完整正文。",
        "0 records": "0 条记录",
        "Page 1": "第 1 页",
        "PUBLISHED": "发布日期",
        "LOCATION": "地点",
        "EVENT SUMMARY": "事件摘要",
        "CASES / DEATHS": "病例 / 死亡",
        "SOURCE": "来源",
        "QUALITY": "质量",
        "DETAIL": "详情",
        "From files to a versioned data contract.": "从“文件”到版本化数据合同。",
        "Schema v1 defines time semantics, stable identifiers, source-rights notes, quality fields, and SHA-256 checksums.": "Schema v1 提供明确时间语义、稳定标识、来源权利提示、质量字段与 SHA-256 校验和。",
        "Complete event records": "完整事件记录",
        "Apps & scripts": "应用与脚本",
        "Flat analysis table": "扁平分析表",
        "Columnar data": "列式数据",
        "Spatial features": "空间要素",
        "Streaming records": "流式记录",
        "Data constraints": "数据约束",
        "TRY IT / 30 SECONDS": "TRY IT / 30 秒",
        "COPY": "复制",
        "RECORDS": "记录",
        "SOURCES": "来源",
        "FORMATS": "格式",
        "LICENSE NOTICE": "许可提醒",
        "This repository is a publicly accessible demonstration and data preview. Its source can be inspected, but it is not open source; no permission is granted to copy, modify, redistribute, or build derivatives. Third-party sources remain subject to their own terms.": "本仓库是公开可访问的演示与数据预览，源码可供查看但不是开源项目；当前未授予复制、修改、再分发或二次开发许可。第三方来源仍受各自条款约束。",
        "Read the license →": "阅读许可证 →",
        "Built for people—and for agents that ask precisely.": "不只给人看，也让 Agent 能正确提问。",
        "The EPIC query skill filters by keyword, disease, continent, and date, then returns JSON or Markdown with source provenance and data status attached.": "EPIC 查询 Skill 支持按关键词、疾病、洲别与日期过滤，并可输出 JSON 或 Markdown。返回结果始终附带来源和数据状态。",
        "View the agent skill": "查看 Agent Skill",
        "Read the manifest": "读取 Manifest",
        "Find dengue events in Asia, sort by case count, retain sources, and explain data confidence.": "查找亚洲的登革热事件，按病例规模排序，保留来源并说明数据置信度。",
        "Make uncertainty part of the product.": "把不确定性写进产品。",
        "EPIC is research infrastructure for open-source monitoring—not a validated official warning system. Every user should be able to see where data came from, how old it is, and which checks it passed.": "EPIC 是研究性开放来源监测基础设施，不是经过效能评估的正式预警系统。每个用户都应该能看见数据来自哪里、陈旧多久、经过哪些检查。",
        "Separate freshness clocks": "采集状态分离",
        "Normalize event fields": "事件字段规范化",
        "Apply quality gates": "质量闸门",
        "State the boundaries": "已知边界",
        "Methodology": "方法说明",
        "Known limitations": "已知局限",
        "Data dictionary": "数据字典",
        "Current quality report": "本次质量报告",
        "How to cite": "引用信息",
        "RESEARCH RANKING": "RESEARCH RANKING / 研究性排序",
        "EpiETL public risk summary": "EpiETL 公共风险摘要",
        "Synchronizing public intelligence snapshot": "正在同步公开情报快照",
        "Risk scores support research ranking only; they are not official risk levels. Verify original sources, method version, and uncertainty before use.": "风险分值用于研究性事件排序，不代表官方风险等级；使用前请核验原始来源、方法版本和不确定性。",
        "CHANNELS": "监测通道",
        "TOTAL REPORTS": "累计报告",
        "PENDING": "待处理",
        "RISK EVENTS": "风险事件",
        "COUNTRY RISK DISTRIBUTION": "国家风险分布",
        "PRIORITY EVENTS": "重点事件",
        "Waiting for snapshot": "等待快照",
        "Methodology & quality control": "方法与质量控制",
        "Write uncertainty into the data contract.": "把不确定性写进数据合同。",
        "EPIC normalizes public-source signals into event-level summaries while keeping time, provenance, revision, and quality status traceable.": "EPIC 将公开来源信号规范为事件级摘要，同时保持时间、来源、修订和质量状态可追溯。",
        "Read the Markdown source": "查看 Markdown 原文",
        "Known limitations | EPIC": "已知局限 | EPIC",
        "There is no complete global truth here.": "这里没有“完整全球真相”。",
        "EPIC is an incomplete, fallible public-source monitoring preview. Record counts are not disease burden, and missing records do not prove that no event occurred.": "EPIC 是不完整、可能出错、需要回到原始来源核验的公开来源监测预览。记录数不等于疾病负担，缺少记录不等于没有事件。",
        "View current data status": "查看当前数据状态",
        "Back to EPIC": "返回 EPIC",
        "Source-language summary": "来源语言摘要",
        "Original source ↗": "原始来源 ↗",
        "Event start": "事件开始",
        "Event end": "事件结束",
        "Published": "发布日期",
        "First observed": "首次发现",
        "Source organization": "来源机构",
        "Source type": "来源类型",
        "Cases": "病例",
        "Deaths": "死亡",
        "Hospitalizations": "住院",
        "Data quality": "数据质量",
        "Quality notes": "质量说明",
        "Stable identifiers": "稳定标识",
        "Suggested citation": "建议引用",
        "No quality flags were recorded.": "未记录质量标记。",
        "PUBLIC EVENT MONITORING": "公开来源事件监测",
        "event monitoring.": "事件监测。",
        "Records come from health-agency notices, ProMED, and other public reports. Each record keeps its source, date, and place. Counts are event reports in this snapshot, not disease burden.": "记录取自卫生机构通报、ProMED 及其他公开报道，并保留来源、日期与地点。计数为本快照中的事件报告数，不是疾病负担。",
        "View records": "查看记录",
        "Data files →": "数据文件 →",
        "LAST COLLECTION": "最近采集",
        "DATA LAG": "数据时滞",
        "EVENT RECORDS": "事件记录",
        "Event records": "事件记录",
        "Filter terms are stored in the page address for citation.": "筛选条件写入网址，便于引用。",
        "DISEASES": "疾病",
        "LATEST DATE": "最新日期",
        "SEARCH": "检索",
        "Search events": "检索事件",
        "FILTER": "筛选",
        "No filter is set.": "未设筛选条件。",
        "GEOGRAPHY": "地理",
        "Where events were reported": "事件报告地",
        "Loading the map": "正在载入地图",
        "Point size and colour show the number of records at that place. Select a region on the right to filter the list.": "点的大小和颜色表示该地点的记录数。选择右侧地区可筛选列表。",
        "RECORD COUNT": "记录数",
        "Basemap: Amap. Some points are country or administrative centroids.": "底图：高德地图。部分点位为国家或行政区中心。",
        "EVENT LIST": "事件列表",
        "Event list": "事件列表",
        "Loads on entry": "进入后载入",
        "Records load by page.": "记录按页载入。",
        "DATA": "数据",
        "Data files": "数据文件",
        "Six files. Field definitions are in Schema v1. Each release includes a SHA-256.": "六个文件。字段定义在 Schema v1。每次发布附 SHA-256。",
        "Records": "记录",
        "Table": "表",
        "Columns": "列",
        "Points": "点",
        "Lines": "行",
        "Fields": "字段",
        "Schema v1 specifies time fields, record identifiers, source and quality fields, and SHA-256 checksums.": "Schema v1 规定时间字段、记录标识、来源与质量字段，并给出 SHA-256 校验值。",
        "Programs": "程序",
        "Analysis table": "分析表",
        "Column table": "列式表",
        "Map data": "地图数据",
        "GIS": "地理信息",
        "Line records": "逐行记录",
        "Command line": "命令行",
        "Field rules": "字段规则",
        "EXAMPLE": "示例",
        "LICENCE": "许可",
        "The event records are published for consultation. The source may be read. Copying, modification, and redistribution are not permitted. Third-party sources follow their own terms.": "事件记录公开供查阅。源码可阅读。未许可复制、修改和再分发。第三方来源另从其规定。",
        "QUERY": "查询",
        "Field filter": "检索",
        "Filter by disease, place, and date.": "按疾病、地区、日期筛选。",
        "Dengue in Asia": "亚洲登革热",
        "Records can be filtered by disease, place, and date. Results include the source and the data status.": "可按疾病、地区和日期筛选。结果包含来源和数据状态。",
        "Query notes": "查询说明",
        "Data manifest": "数据清单",
        "Query example": "查询示例",
        "REQUEST": "检索",
        "List dengue events in Asia, sort by case count, and keep the source.": "列出亚洲的登革热事件，按病例数排序，并保留来源。",
        "RESULT": "结果",
        "Schema v1 is loaded. Matched": "已读取 Schema v1。命中",
        "records.": "条记录。",
        "SOURCE INCLUDED · STATUS INCLUDED · SCHEMA CHECKED": "含来源 · 含数据状态 · 已核 Schema",
        "METHOD": "方法",
        "Processing": "处理",
        "Time": "时间",
        "Build time, data-as-of date, and last collection are stored separately. An empty collection keeps the previous file.": "构建时间、数据截止日、最近采集分开记。空采集沿用上一份。",
        "Fields": "字段",
        "Event date, reporting period, and publication date are separate. Disease names use one category. Counts are cases, deaths, and hospitalizations.": "事件日、报告期、发布日分开。疾病用统一类目。数量为病例、死亡、住院。",
        "Checks": "检查",
        "Before release: future dates, sudden drops in record count, source addresses, coordinates, duplicate records, schema.": "发布前核对未来日期、记录数骤降、来源网址、坐标、重复记录、Schema。",
        "Coordinates": "坐标",
        "Some points are only at country level. Geocoding has error.": "部分点只到国家。地理编码有误差。",
        "Time, source, and quality checks are stored with each record.": "时间、来源和质量检查与记录一并保存。",
        "TIME": "时间",
        "Separate the time fields": "区分时间字段",
        "Build time, the data-as-of date, and the time of the last successful collection are stored separately. An empty collection keeps the previous snapshot.": "构建时间、数据截止日期和最近一次成功采集时间分别保存。采集为空时保留上一份数据。",
        "FIELDS": "字段",
        "Standardize the fields": "统一字段",
        "Event date, reporting period, and publication date stay distinct. Disease names are assigned to one category. Counts are split into cases, deaths, and hospitalizations.": "事件日期、报告期和发布日期分开记录。疾病名称归入统一类目。数量分为病例、死亡和住院。",
        "CHECK": "检查",
        "Check before release": "发布前检查",
        "Future dates, sudden drops in record count, source addresses, coordinates, duplicate records, and schema validity are checked before release.": "发布前检查未来日期、记录数骤降、来源网址、坐标、重复记录和 Schema。",
        "SCOPE": "范围",
        "Scope": "范围",
        "Coverage follows the sources included. Extraction and geocoding can be wrong. Some coordinates are given only at country level.": "覆盖范围取决于已纳入的来源。抽取和地理编码可能有误。部分坐标只到国家。",
        "Use the source and quality fields in event analysis.": "分析事件时使用来源和质量字段。",
        "APPLICATION": "应用",
        "Read the record, then check the original notice.": "阅读记录后核对原始通报。",
        "Use the versioned files, schema, and checksums.": "使用带版本的文件、Schema 和校验值。",
        "RISK": "风险",
        "Data manifest": "数据清单",
        "Documentation": "说明",
        "Licence": "许可",
        "Risk summary": "风险摘要",
        "Loading the summary": "正在读取摘要",
        "Scores order events for research. Check the original source and the method version before use.": "分值用于研究中的事件排序。使用前核对原始来源和方法版本。",
        "Infectious-disease event records from public reports, for search and citation.": "公开报道中的传染病事件记录，供检索与引用。",
        "The source may be read. Redistribution is not permitted.": "源码可查阅，未许可再分发。",
        "Collection and quality checks passed.": "采集与质量检查通过。",
        "CONTINENTS": "洲"
    });

    function requestedLanguage() {
        const queryLanguage = new URLSearchParams(window.location.search).get("lang");
        if (queryLanguage === "zh" || queryLanguage === "zh-CN") {
            return "zh-CN";
        }
        if (queryLanguage === "en") {
            return "en";
        }
        try {
            return window.localStorage.getItem(STORAGE_KEY) === "zh-CN" ? "zh-CN" : "en";
        } catch (error) {
            return "en";
        }
    }

    let language = requestedLanguage();

    function isChinese() {
        return language === "zh-CN";
    }

    function t(english, chinese) {
        if (!isChinese()) {
            return english;
        }
        return chinese || translations[english] || english;
    }

    function replaceTextNode(node) {
        if (!isChinese() || !node || !node.nodeValue) {
            return;
        }
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(parent.tagName)) {
            return;
        }
        const source = node.nodeValue;
        const trimmed = source.trim().replace(/\s+/g, " ");
        const translated = translations[trimmed];
        if (!translated) {
            return;
        }
        const leading = (source.match(/^\s*/) || [""])[0];
        const trailing = (source.match(/\s*$/) || [""])[0];
        node.nodeValue = `${leading}${translated}${trailing}`;
    }

    function translateAttributes() {
        if (!isChinese()) {
            return;
        }
        document.querySelectorAll("[aria-label], [placeholder], [title]").forEach(function (element) {
            ["aria-label", "placeholder", "title"].forEach(function (attribute) {
                const source = element.getAttribute(attribute);
                if (source && translations[source]) {
                    element.setAttribute(attribute, translations[source]);
                }
            });
        });
    }

    function translateExplicitNodes() {
        if (!isChinese()) {
            return;
        }
        document.querySelectorAll("[data-zh]").forEach(function (element) {
            element.textContent = element.getAttribute("data-zh");
        });
        document.querySelectorAll("[data-zh-placeholder]").forEach(function (element) {
            element.setAttribute("placeholder", element.getAttribute("data-zh-placeholder"));
        });
        document.querySelectorAll("[data-zh-aria-label]").forEach(function (element) {
            element.setAttribute("aria-label", element.getAttribute("data-zh-aria-label"));
        });
        document.querySelectorAll("[data-language-content]").forEach(function (element) {
            element.hidden = element.getAttribute("data-language-content") !== "zh-CN";
        });
    }

    function translateDocument() {
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
        document.querySelectorAll("[data-language-content]").forEach(function (element) {
            element.hidden = element.getAttribute("data-language-content") !== language;
        });
        if (isChinese()) {
            translateExplicitNodes();
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();
            while (node) {
                replaceTextNode(node);
                node = walker.nextNode();
            }
            translateAttributes();
        }
        bindLanguageToggle();
    }

    function bindLanguageToggle() {
        const button = document.getElementById("language-toggle");
        if (!button || button.dataset.languageBound === "true") {
            return;
        }
        button.dataset.languageBound = "true";
        button.textContent = isChinese() ? "EN" : "中文";
        button.setAttribute("aria-label", isChinese() ? "Switch to English" : "Switch to Chinese");
        button.addEventListener("click", function () {
            const nextLanguage = isChinese() ? "en" : "zh-CN";
            try {
                window.localStorage.setItem(STORAGE_KEY, nextLanguage);
            } catch (error) {
                // The query parameter fallback still works when storage is unavailable.
            }
            const url = new URL(window.location.href);
            url.searchParams.set("lang", nextLanguage);
            window.location.assign(url.toString());
        });
    }

    window.EPIC_I18N = {
        isChinese,
        language: function () { return language; },
        locale: function () { return isChinese() ? "zh-CN" : "en-US"; },
        t,
        translateDocument,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", translateDocument, { once: true });
    } else {
        translateDocument();
    }
})();
