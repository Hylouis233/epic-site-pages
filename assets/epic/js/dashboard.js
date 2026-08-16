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

    function isChinese() {
        const i18n = window.EPIC_I18N;
        return Boolean(i18n && typeof i18n.isChinese === "function" && i18n.isChinese());
    }

    const DISEASE_LABELS_EN = Object.freeze({
        "乙类传染病": "Notifiable diseases group",
        "军团菌病": "Legionellosis",
        "多种法定传染病": "Multiple notifiable diseases",
        "儿童急性呼吸道疾病": "Pediatric acute respiratory illness",
        "创伤弧菌感染": "Vibrio vulnificus infection",
        "埃博拉": "Ebola virus disease",
        "急性上呼吸道感染": "Acute upper respiratory infection",
        "急性腹泻病": "Acute diarrheal disease",
        "恙虫病": "Scrub typhus",
        "新型冠状病毒感染": "COVID-19",
        "流行性感冒": "Influenza",
        "猴痘": "Mpox",
        "李斯特菌病": "Listeriosis",
        "麻疹": "Measles",
        "沙门氏菌病": "Salmonellosis",
        "环孢子虫病": "Cyclosporiasis",
        "疟疾": "Malaria",
        "登革热": "Dengue",
        "禽流感": "Avian influenza",
        "绦虫病": "Taeniasis",
        "钩端螺旋体病": "Leptospirosis",
        "肠病毒 D68 型感染": "Enterovirus D68 infection",
        "肠病毒感染": "Enterovirus infection",
        "肺炎链球菌病": "Pneumococcal disease",
        "诺如病毒感染": "Norovirus infection",
    });

    const CONTINENT_LABELS_EN = Object.freeze({
        "亚洲": "Asia",
        "北美洲": "North America",
        "南美洲": "South America",
        "中及南美洲": "Central and South America",
        "欧洲": "Europe",
        "非洲": "Africa",
        "大洋洲": "Oceania",
    });

    const LOCATION_LABELS_EN = Object.freeze({
        "北京市": "Beijing, China",
        "不含港澳台": "Mainland China (excluding Hong Kong, Macao, and Taiwan)",
        "菲律宾奎松市": "Quezon City, Philippines",
        "韩国": "South Korea",
        "黑龙江省": "Heilongjiang, China",
        "几内亚比绍": "Guinea-Bissau",
        "加拿大": "Canada",
        "柬埔寨金达尔省考索姆区": "Kaoh Thum district, Kandal province, Cambodia",
        "金门": "Kinmen",
        "科伦坡": "Colombo",
        "美国": "United States",
        "美国德克萨斯州圣安东尼奥-拉克兰联合基地": "Joint Base San Antonio–Lackland, Texas, USA",
        "美国纽约市曼哈顿上东区": "Upper East Side, Manhattan, New York City, USA",
        "美国纽约市上东侧": "Upper East Side, New York City, USA",
        "美国纽约市上东区": "Upper East Side, New York City, USA",
        "孟加拉国": "Bangladesh",
        "南部省": "Southern Province, Sri Lanka",
        "南非": "South Africa",
        "南非开普敦": "Cape Town, South Africa",
        "尼泊尔": "Nepal",
        "日本": "Japan",
        "斯里兰卡": "Sri Lanka",
        "新加坡": "Singapore",
        "中国": "China",
        "中国澳门": "Macao, China",
        "中国台湾": "Taiwan",
        "中国香港": "Hong Kong",
        "{'country', 'Central and South America', 'region', '中及南'}": "Central and South America",
    });

    const SOURCE_ORG_LABELS_EN = Object.freeze({
        "澳门特别行政区卫生局": "Macao Health Bureau",
        "澳门卫生局": "Macao Health Bureau",
        "菲律宾星报": "The Philippine Star",
        "国家登革热控制单位": "National Dengue Control Unit",
        "黑龙江省疾病预防控制局": "Heilongjiang Provincial Disease Control Bureau",
        "疾病管制署": "Taiwan Centers for Disease Control",
        "加拿大公共卫生局 (PHAC)": "Public Health Agency of Canada (PHAC)",
        "柬埔寨卫生部": "Ministry of Health, Cambodia",
        "柬埔寨Kiripost": "Kiripost Cambodia",
        "南非国家传染病研究所（NICD）": "National Institute for Communicable Diseases (NICD)",
        "台湾疾病管制署": "Taiwan Centers for Disease Control",
        "台湾疾病控制署": "Taiwan Centers for Disease Control",
        "香港公共卫生局": "Hong Kong public-health authority",
        "新加坡传染病局（CDA）": "Communicable Diseases Agency, Singapore",
        "新加坡国家环境局（NEA）": "National Environment Agency, Singapore",
        "中国观察": "China Observer",
        "ETtoday健康": "ETtoday Health",
        "ETtoday健康云": "ETtoday Health",
        "ETtoday新闻云": "ETtoday News",
    });

    const DETAIL_PHRASES_EN = Object.freeze({
        "发热": "fever",
        "发烧": "fever",
        "高热": "high fever",
        "高烧": "high fever",
        "剧烈腹泻": "severe diarrhoea",
        "腹泻": "diarrhoea",
        "频繁排便": "frequent stools",
        "腹痛": "abdominal pain",
        "恶心": "nausea",
        "呕吐": "vomiting",
        "干呕": "retching",
        "咳嗽": "cough",
        "干咳": "dry cough",
        "流鼻水": "runny nose",
        "流涕": "runny nose",
        "鼻塞": "nasal congestion",
        "喉咙痛": "sore throat",
        "咽痛": "sore throat",
        "乏力": "fatigue",
        "疲倦": "fatigue",
        "全身倦怠": "malaise",
        "肌肉酸痛": "muscle aches",
        "肌肉酸症": "muscle aches",
        "肌肉疼痛": "muscle pain",
        "肌肉关节痛": "muscle and joint pain",
        "肌肉和关节疼痛": "muscle and joint pain",
        "关节肌肉疼痛": "joint and muscle pain",
        "关节痛": "joint pain",
        "头痛": "headache",
        "剧烈头痛": "severe headache",
        "严重头痛": "severe headache",
        "眼后痛": "pain behind the eyes",
        "眼后疼痛": "pain behind the eyes",
        "眼窝后疼痛": "pain behind the eyes",
        "眼眶后疼痛": "pain behind the eyes",
        "皮疹": "rash",
        "出疹": "rash",
        "红疹": "rash",
        "斑疹": "macular rash",
        "斑丘疹": "maculopapular rash",
        "丘疹": "papular rash",
        "水泡": "vesicles",
        "水疱": "vesicles",
        "脓疱": "pustules",
        "畏寒": "chills",
        "寒颤": "rigors",
        "寒战": "rigors",
        "出汗": "sweating",
        "呼吸困难": "difficulty breathing",
        "呼吸急促": "rapid breathing",
        "气促": "shortness of breath",
        "胸痛": "chest pain",
        "肺炎": "pneumonia",
        "脑炎": "encephalitis",
        "脑膜脑炎": "meningoencephalitis",
        "肢体麻痹": "limb paralysis",
        "麻痹": "paralysis",
        "意识不清": "altered consciousness",
        "意识障碍": "impaired consciousness",
        "意识改变": "altered consciousness",
        "嗜睡": "drowsiness",
        "肌抽跃": "myoclonus",
        "抽搐": "convulsions",
        "低血压": "hypotension",
        "休克": "shock",
        "感染性休克": "septic shock",
        "出血倾向": "bleeding tendency",
        "出血": "bleeding",
        "血浆渗漏": "plasma leakage",
        "黄疸": "jaundice",
        "淋巴结肿大": "lymphadenopathy",
        "淋巴腺肿大": "swollen lymph nodes",
        "淋巴结肿胀": "swollen lymph nodes",
        "焦痂": "eschar",
        "红色斑状丘疹": "erythematous maculopapular rash",
        "咽喉痛": "sore throat",
        "上呼吸道症状": "upper-respiratory symptoms",
        "上呼吸道感染症状": "upper-respiratory infection symptoms",
        "流感样症状": "influenza-like symptoms",
        "胃肠道症状": "gastrointestinal symptoms",
        "嗅味觉减退": "reduced smell or taste",
        "嗅觉或味觉减退": "reduced smell or taste",
        "缺氧": "hypoxia",
        "血痰": "bloody sputum",
        "持续性高烧": "persistent high fever",
        "登革出血热": "dengue haemorrhagic fever",
        "登革休克综合征": "dengue shock syndrome",
        "贫血": "anaemia",
        "脑型疟疾": "cerebral malaria",
        "生殖器": "genital",
        "躯干": "trunk",
        "主要经": "mainly through",
        "主要通过": "mainly through",
        "通过": "through",
        "经": "via",
        "由": "via",
        "呼吸道飞沫": "respiratory droplets",
        "飞沫": "droplet",
        "气溶胶": "aerosols",
        "密切接触": "close contact",
        "接触传播": "contact transmission",
        "接触": "contact",
        "空气传播": "airborne transmission",
        "空气": "airborne",
        "伊蚊": "Aedes mosquitoes",
        "埃及伊蚊": "Aedes aegypti",
        "白纹伊蚊": "Aedes albopictus",
        "按蚊": "Anopheles mosquitoes",
        "蚊虫": "mosquitoes",
        "蚊媒": "mosquito-borne",
        "蚊虫叮咬": "mosquito bites",
        "蚊虫传播": "mosquito-borne transmission",
        "叮咬传播": "bite transmission",
        "叮咬": "bites",
        "恙虫": "chigger",
        "恙螨": "chigger mites",
        "恙虫病立克次体": "Orientia tsutsugamushi",
        "食物": "food",
        "水源": "water",
        "受污染的": "contaminated",
        "受污染": "contaminated",
        "污染": "contaminated",
        "粪口传播": "faecal-oral transmission",
        "肠道传播": "enteric transmission",
        "输血": "blood transfusion",
        "器官移植": "organ transplant",
        "母婴传播": "mother-to-child transmission",
        "母婴垂直传播": "vertical mother-to-child transmission",
        "性接触": "sexual contact",
        "性行为": "sexual contact",
        "血液传播": "blood-borne transmission",
        "人际传播": "person-to-person transmission",
        "人传人": "person-to-person transmission",
        "人与人之间不传播": "no person-to-person transmission",
        "不人与人传播": "no person-to-person transmission",
        "有限人传人风险": "limited person-to-person risk",
        "人与人之间": "between people",
        "病媒蚊": "vector mosquitoes",
        "病媒": "vectors",
        "冷却塔": "cooling towers",
        "含菌气溶胶": "bacteria-laden aerosols",
        "含军团菌气溶胶": "Legionella-laden aerosols",
        "供水系统": "water-supply systems",
        "水雾": "water mist",
        "链球菌": "Streptococcus",
        "排泄物": "excretions",
        "体液": "body fluids",
        "病变皮肤": "skin lesions",
        "受污染物件": "contaminated objects",
        "污染表面": "contaminated surfaces",
        "物体表面": "surfaces",
        "进口浆果": "imported berries",
        "香草": "herbs",
        "绿叶蔬菜": "leafy greens",
        "新鲜蔬菜": "fresh produce",
        "活禽": "live poultry",
        "禽肉": "poultry meat",
        "密切": "close",
        "加强监测": "enhanced surveillance",
        "加强病例监测": "enhanced case surveillance",
        "加强检测": "expanded testing",
        "加强": "strengthened",
        "监测": "monitoring",
        "检测": "testing",
        "筛查": "screening",
        "隔离": "isolation",
        "隔离治疗": "isolation and treatment",
        "隔离措施": "isolation measures",
        "感染者": "infected people",
        "患者隔离": "patient isolation",
        "佩戴口罩": "mask wearing",
        "戴口罩": "mask wearing",
        "口罩": "masks",
        "疫苗": "vaccine",
        "疫苗接种": "vaccination",
        "接种疫苗": "vaccination",
        "保持通风": "maintain ventilation",
        "保持室内空气流通": "maintain indoor air circulation",
        "空气流通": "air circulation",
        "通风": "ventilation",
        "手部卫生": "hand hygiene",
        "勤洗手": "frequent handwashing",
        "洗手": "handwashing",
        "清洁消毒": "cleaning and disinfection",
        "消毒": "disinfection",
        "清洁": "cleaning",
        "减少接触": "reducing contact",
        "减少聚集": "reducing gatherings",
        "社交距离": "social distancing",
        "及时就医": "seek care promptly",
        "就医": "seek medical care",
        "医疗救治": "medical treatment",
        "对症治疗": "symptomatic treatment",
        "抗病毒药物": "antiviral drugs",
        "抗生素": "antibiotics",
        "抗疟药物": "antimalarial drugs",
        "驱蚊剂": "mosquito repellent",
        "防蚊": "mosquito protection",
        "蚊帐": "bed nets",
        "杀虫剂": "insecticide",
        "灭蚊": "mosquito control",
        "蚊虫防治": "mosquito control",
        "清除积水": "removing standing water",
        "积水": "standing water",
        "孳生地": "breeding sites",
        "滋生地": "breeding sites",
        "幼虫": "larvae",
        "杀幼虫剂": "larvicides",
        "公众教育": "public education",
        "宣传教育": "public education",
        "社区宣教": "community education",
        "社区": "community",
        "宣传教育活动": "education campaigns",
        "病例管理": "case management",
        "接触者追踪": "contact tracing",
        "流行病学调查": "epidemiological investigation",
        "旅行史": "travel history",
        "检疫": "quarantine",
        "主动告知": "proactively report",
        "报告": "reporting",
        "健康提醒": "health alerts",
        "公众健康提醒": "public-health alerts",
        "饮水安全": "drinking-water safety",
        "食品安全": "food safety",
        "饮食安全": "food safety",
        "彻底清洗": "thorough washing",
        "生鲜蔬果": "fresh produce",
        "蔬果": "produce",
        "洗手": "handwashing",
        "卫生": "hygiene",
        "环境卫生": "environmental hygiene",
        "个人卫生": "personal hygiene",
        "个人防护": "personal protection",
        "防护服": "protective clothing",
        "长袖": "long-sleeved",
        "长裤": "trousers",
        "手套": "gloves",
        "长靴": "boots",
        "远程门诊": "remote clinics",
        "外展医疗": "outreach medical care",
        "住院治疗": "hospital treatment",
        "重症监护": "critical care",
        "高风险人群": "high-risk groups",
        "重症高风险人群": "people at high risk of severe disease",
        "远程": "remote",
        "线上教学": "online teaching",
        "停课": "class suspension",
        "不上班课": "staying home from work and school",
        "生病在家休息": "resting at home when ill",
        "家中休息": "resting at home",
        "居家": "at home",
        "旅游咨询": "travel-medicine advice",
        "旅行医学咨询": "travel-medicine consultation",
        "预防性": "prophylactic",
        "早期诊断": "early diagnosis",
        "规范": "standardised",
        "治疗": "treatment",
        "疑似症状": "suspected symptoms",
        "病征": "symptoms",
        "求诊": "seek care",
        "就诊": "seek care",
        "卫生中心": "health centre",
        "免费诊疗": "free consultation and treatment",
        "药物": "medication",
        "可出现": "may develop",
        "可引起": "may cause",
        "可伴": "may be accompanied by",
        "部分": "some",
        "患者": "patients",
        "感染者": "infected people",
        "人群": "populations",
        "等": "",
        "症状": "symptoms",
        "表现为": "manifesting as",
        "包括": "including",
        "如": "such as",
        "常见": "common",
        "所有病例": "all cases",
        "均为": "were",
        "非复杂性": "uncomplicated",
        "恶性疟": "falciparum malaria",
        "重症前兆": "warning signs",
        "危及生命": "life-threatening",
        "并发症": "complications",
        "偶可": "occasionally",
        "亦可": "may also",
        "也可": "may also",
        "不直接传播": "not directly transmitted",
        "不传播": "not transmitted",
        "不存在": "does not occur",
        "风险较高": "higher risk",
        "风险": "risk",
        "本地": "local",
        "入境": "entry",
        "口岸": "ports of entry",
        "全国": "national",
        "定期": "regular",
        "周报": "weekly reports",
        "样本": "specimens",
        "哨点": "sentinel",
        "门诊": "outpatient",
        "住院病例": "inpatient cases",
        "病原学": "aetiological",
        "变异": "variant",
    });

    const state = {
        filters: {
            keyword: "",
            disease: "",
            continent: "",
            date_from: "",
            date_to: "",
        },
        page: 1,
        pageSize: window.matchMedia("(max-width: 820px)").matches ? 8 : 20,
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
        staticLandPayload: null,
        staticLandPromise: null,
        leafletMap: null,
        leafletClusterLayer: null,
        leafletLandLayer: null,
        lastMapItems: null,
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
        regionSidebar: document.getElementById("region-sidebar"),
        tablePanel: document.getElementById("table-panel"),
        tableMeta: document.getElementById("table-meta"),
        tablePlaceholder: document.getElementById("table-placeholder"),
        tableShell: document.getElementById("table-shell"),
        tableBody: document.getElementById("table-body"),
        eventCards: document.getElementById("event-cards"),
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
        { key: "symptoms", className: "table-cell--detail" },
        { key: "measures", className: "table-cell--detail" },
        { key: "transmission", className: "table-cell--detail" },
        { key: "cases", className: "table-cell--metric" },
        { key: "deaths", className: "table-cell--metric" },
        { key: "source_org", className: "table-cell--compact" },
        { key: "source", className: "table-cell--source" },
        { key: "quality", className: "table-cell--quality" },
        { key: "event", className: "table-cell--action" },
    ];
    const DENSITY_STORAGE_KEY = "epic-density";

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function containsHan(value) {
        return /[\u3400-\u9fff]/.test(String(value || ""));
    }

    function staticDiseaseLabel(raw) {
        const records = Array.isArray(state.staticRecords) ? state.staticRecords : [];
        const record = records.find(function (item) {
            return item && item.disease === raw;
        });
        if (!record) {
            return "";
        }
        const label = String(record.disease_name_en || "").trim();
        if (!label || containsHan(label)) {
            return "";
        }
        if (label === "Unclassified" && String(record.disease_id || "").startsWith("unclassified-")) {
            return `Unclassified · ${String(record.disease_id).slice(-8)}`;
        }
        return label;
    }

    function displayDisease(value) {
        if (value && typeof value === "object") {
            const chinese = value.disease_name_zh || value.disease || t("Unspecified disease", "未标注疾病");
            const english = value.disease_name_en || DISEASE_LABELS_EN[chinese] || value.disease_id || "Unspecified disease";
            return isChinese() ? chinese : english;
        }
        const raw = String(value || "");
        if (isChinese()) {
            return raw;
        }
        return DISEASE_LABELS_EN[raw]
            || staticDiseaseLabel(raw)
            || (containsHan(raw) ? "Unclassified disease" : raw)
            || "Unspecified disease";
    }

    function displayContinent(value) {
        const raw = String(value || "");
        return isChinese() ? raw : (CONTINENT_LABELS_EN[raw] || raw || "Unspecified region");
    }

    function englishCountryName(countryCode) {
        const code = String(countryCode || "").trim().toUpperCase();
        if (!code) {
            return "";
        }
        try {
            return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || "";
        } catch (error) {
            return "";
        }
    }

    function displayLocation(record) {
        const raw = String((record && record.location) || record || "").trim();
        if (isChinese()) {
            return raw || "地点未注明";
        }
        if (LOCATION_LABELS_EN[raw]) {
            return LOCATION_LABELS_EN[raw];
        }
        if (raw && !containsHan(raw)) {
            return raw;
        }
        return englishCountryName(record && record.country_code) || "Source-reported location";
    }

    function displaySourceOrg(record) {
        const raw = String((record && record.source_org) || record || "").trim();
        if (isChinese()) {
            return raw || "来源未注明";
        }
        if (SOURCE_ORG_LABELS_EN[raw]) {
            return SOURCE_ORG_LABELS_EN[raw];
        }
        if (raw && !containsHan(raw)) {
            return raw;
        }
        const country = englishCountryName(record && record.country_code);
        return country ? `Public-health source, ${country}` : "Source organization not specified";
    }

    const DETAIL_PUNCTUATION = Object.freeze({
        "、": ", ",
        "，": ", ",
        "。": ".",
        "；": "; ",
        "：": ": ",
        "（": " (",
        "）": ")",
        "(": " (",
        ")": ")",
    });
    const DETAIL_KEYS_BY_LENGTH = Object.keys(DETAIL_PHRASES_EN)
        .sort(function (a, b) { return b.length - a.length; });

    function translateDetailText(value, fallback) {
        if (isChinese()) {
            return value || fallback;
        }
        const raw = String(value || "").trim();
        if (!raw) {
            return fallback;
        }
        if (!containsHan(raw)) {
            return raw;
        }

        let chineseCharacters = 0;
        for (const character of raw) {
            if (/[\u3400-\u9fff]/.test(character)) {
                chineseCharacters += 1;
            }
        }

        let output = "";
        let index = 0;
        let translatedCharacters = 0;
        while (index < raw.length) {
            const character = raw[index];
            if (DETAIL_PUNCTUATION[character]) {
                output += DETAIL_PUNCTUATION[character];
                index += 1;
                continue;
            }
            let matched = false;
            for (const phrase of DETAIL_KEYS_BY_LENGTH) {
                if (raw.startsWith(phrase, index)) {
                    output += DETAIL_PHRASES_EN[phrase];
                    translatedCharacters += phrase.length;
                    index += phrase.length;
                    matched = true;
                    break;
                }
            }
            if (matched) {
                continue;
            }
            if (!/[\u3400-\u9fff]/.test(character)) {
                output += character;
            }
            index += 1;
        }

        const coverage = chineseCharacters ? translatedCharacters / chineseCharacters : 1;
        if (coverage < 0.6) {
            return fallback;
        }
        return output
            .replace(/\s+/g, " ")
            .replace(/\s+([,.;:)])/g, "$1")
            .replace(/([([])\s+/g, "$1")
            .trim();
    }

    function displaySymptoms(record) {
        return translateDetailText(record && record.symptoms, "See source for clinical details");
    }

    function displayMeasures(record) {
        return translateDetailText(record && record.measures, "See source for response measures");
    }

    function displayTransmission(record) {
        return translateDetailText(record && record.transmission, "See source for transmission details");
    }

    function buildEnglishSummary(record) {
        const disease = displayDisease(record);
        const location = displayLocation(record);
        const metrics = [];
        if (record.cases !== null && record.cases !== undefined) {
            metrics.push(`${formatCount(record.cases)} cases`);
        }
        if (record.deaths !== null && record.deaths !== undefined) {
            metrics.push(`${formatCount(record.deaths)} deaths`);
        }
        if (record.hospitalizations !== null && record.hospitalizations !== undefined) {
            metrics.push(`${formatCount(record.hospitalizations)} hospitalizations`);
        }
        const metricSentence = metrics.length ? ` Structured fields report ${metrics.join(", ")}.` : "";
        return `${disease} signal reported in ${location}.${metricSentence}`;
    }

    function displaySummary(record) {
        if (isChinese()) {
            return record.description_cn || "暂无摘要";
        }
        return record.description_en || buildEnglishSummary(record);
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

    function summarizeFilters() {
        const parts = [];
        if (state.filters.keyword) {
            parts.push(t(`Keyword “${state.filters.keyword}”`, `关键词“${state.filters.keyword}”`));
        }
        if (state.filters.disease) {
            parts.push(t(`Disease ${displayDisease(state.filters.disease)}`, `疾病 ${state.filters.disease}`));
        }
        if (state.filters.continent) {
            parts.push(t(`Region ${displayContinent(state.filters.continent)}`, `洲别 ${state.filters.continent}`));
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
            if (fields[key]) {
                fields[key].value = value;
            }
        });
        if (!readFiltersFromDom()) {
            elements.dateFromInput.value = "";
            elements.dateToInput.value = "";
            readFiltersFromDom();
            syncFiltersToUrl();
        }
    }

    function isValidIsoDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
        if (!match) {
            return false;
        }
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const parsed = new Date(Date.UTC(year, month - 1, day));
        return parsed.getUTCFullYear() === year
            && parsed.getUTCMonth() === month - 1
            && parsed.getUTCDate() === day;
    }

    function setDateValidity(input, message) {
        input.setCustomValidity(message || "");
        if (message) {
            input.setAttribute("aria-invalid", "true");
        } else {
            input.removeAttribute("aria-invalid");
        }
    }

    function readFiltersFromDom() {
        const dateFrom = elements.dateFromInput.value.trim();
        const dateTo = elements.dateToInput.value.trim();
        const formatMessage = t("Enter a real date as YYYY-MM-DD.", "请输入有效日期，格式为 YYYY-MM-DD。");
        const rangeMessage = t("The end date must be on or after the start date.", "结束日期不能早于开始日期。");
        const invalidFrom = Boolean(dateFrom) && !isValidIsoDate(dateFrom);
        const invalidTo = Boolean(dateTo) && !isValidIsoDate(dateTo);
        const invalidRange = !invalidFrom && !invalidTo && Boolean(dateFrom && dateTo) && dateFrom > dateTo;

        setDateValidity(elements.dateFromInput, invalidFrom ? formatMessage : "");
        setDateValidity(elements.dateToInput, invalidTo ? formatMessage : invalidRange ? rangeMessage : "");
        if (invalidFrom || invalidTo || invalidRange) {
            return false;
        }

        state.filters.keyword = elements.keywordInput.value.trim();
        state.filters.disease = elements.diseaseSelect.value.trim();
        state.filters.continent = elements.continentSelect.value.trim();
        state.filters.date_from = dateFrom;
        state.filters.date_to = dateTo;
        updateFilterSummary();
        return true;
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
            option.textContent = selectElement === elements.diseaseSelect
                ? displayDisease(item)
                : selectElement === elements.continentSelect
                    ? displayContinent(item)
                    : item;
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
            displayLocation(record),
            record.disease,
            record.disease_name_en,
            displayDisease(record),
            record.description_cn,
            displaySummary(record),
            record.source_org,
            displaySourceOrg(record),
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
                disease_id: record.disease_id,
                disease_name_en: record.disease_name_en,
                disease_name_zh: record.disease_name_zh,
                location: record.location,
                country_code: record.country_code,
                latitude: record.latitude,
                longitude: record.longitude,
                description_cn: record.description_cn,
                continent: record.continent,
                source_org: record.source_org,
                cases: record.cases,
                deaths: record.deaths,
                hospitalizations: record.hospitalizations,
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

    function aggregateRegions(items) {
        const regions = new Map();
        (Array.isArray(items) ? items : []).forEach(function (item) {
            const key = item.continent || "Unspecified region";
            if (!regions.has(key)) {
                regions.set(key, { key, items: [], locations: new Map(), diseases: new Map(), latest: "" });
            }
            const region = regions.get(key);
            region.items.push(item);
            const location = displayLocation(item);
            region.locations.set(location, (region.locations.get(location) || 0) + 1);
            const disease = displayDisease(item);
            region.diseases.set(disease, (region.diseases.get(disease) || 0) + 1);
            if ((item.original_date || "") > region.latest) {
                region.latest = item.original_date;
            }
        });
        return Array.from(regions.values()).sort(function (a, b) {
            return b.items.length - a.items.length;
        });
    }

    function topEntries(map, limit) {
        return Array.from(map.entries()).sort(function (a, b) {
            return b[1] - a[1] || String(a[0]).localeCompare(String(b[0]));
        }).slice(0, limit);
    }

    function bindRegionFilters() {
        document.querySelectorAll("[data-region-filter]").forEach(function (button) {
            button.addEventListener("click", function () {
                const region = button.getAttribute("data-region-filter") || "";
                elements.continentSelect.value = region;
                if (readFiltersFromDom()) {
                    refreshDataAfterFilters();
                }
            });
        });
    }

    function getClusterTone(count) {
        if (count >= 25) return "critical";
        if (count >= 12) return "high";
        if (count >= 6) return "elevated";
        if (count >= 3) return "medium";
        return "small";
    }

    function getClusterSize(count) {
        if (count >= 25) return 58;
        if (count >= 12) return 54;
        if (count >= 6) return 50;
        if (count >= 3) return 46;
        return 42;
    }

    function aggregateMapItems(items, zoom) {
        const safeZoom = Math.max(Number(zoom) || 2, 1);
        const gridSize = 42 / Math.pow(2, Math.max(safeZoom - 2, 0));
        const clusters = new Map();
        (Array.isArray(items) ? items : []).forEach(function (item) {
            if (!hasValidCoordinates(item)) return;
            const key = `${Math.round(item.latitude / gridSize)}:${Math.round(item.longitude / (gridSize * 1.4))}`;
            if (!clusters.has(key)) {
                clusters.set(key, { latitude: 0, longitude: 0, count: 0, items: [] });
            }
            const cluster = clusters.get(key);
            cluster.latitude += item.latitude;
            cluster.longitude += item.longitude;
            cluster.count += 1;
            cluster.items.push(item);
        });
        return Array.from(clusters.values()).map(function (cluster) {
            cluster.latitude /= cluster.count;
            cluster.longitude /= cluster.count;
            cluster.tone = getClusterTone(cluster.count);
            cluster.size = getClusterSize(cluster.count);
            return cluster;
        });
    }

    async function loadStaticLandPayload() {
        if (state.staticLandPayload) return state.staticLandPayload;
        if (state.staticLandPromise) return state.staticLandPromise;
        if (!config.staticLandUrl) return null;
        state.staticLandPromise = fetchJsonUrl(config.staticLandUrl, "mapController")
            .then(function (payload) {
                state.staticLandPayload = payload;
                return payload;
            })
            .catch(function () {
                return null;
            });
        return state.staticLandPromise;
    }

    function ensureLeafletMap() {
        if (!elements.map || !window.L) return false;
        if (state.leafletMap) return true;

        state.leafletMap = window.L.map(elements.map, {
            center: [20, 10],
            zoom: 2,
            minZoom: 2,
            maxZoom: 6,
            zoomControl: true,
            scrollWheelZoom: false,
            touchZoom: true,
            worldCopyJump: true,
            attributionControl: false,
        });

        loadStaticLandPayload().then(function (payload) {
            if (!payload || !state.leafletMap) return;
            state.leafletLandLayer = window.L.geoJSON(payload, {
                interactive: false,
                style: { className: "land-shape", stroke: false, fill: true },
            });
            state.leafletLandLayer.addTo(state.leafletMap);
            state.leafletLandLayer.bringToBack();
        });

        state.leafletMap.on("zoomend", function () {
            if (state.lastMapItems) {
                renderLeafletClusters(aggregateMapItems(state.lastMapItems, state.leafletMap.getZoom()));
            }
        });
        return true;
    }

    function renderLeafletPopup(cluster) {
        const previewItems = cluster.items.slice(0, 4);
        const moreCount = Math.max(cluster.count - previewItems.length, 0);
        const topDiseases = topEntries(previewItems.reduce(function (map, item) {
            const disease = displayDisease(item);
            map.set(disease, (map.get(disease) || 0) + 1);
            return map;
        }, new Map()), 2).map(function (entry) { return entry[0]; });
        const latestDate = previewItems.reduce(function (latest, item) {
            return (item.original_date || "") > latest ? item.original_date : latest;
        }, "");
        const locationLabel = displayLocation(cluster.items[0] || {});
        const countryLevel = (cluster.items[0] && String(cluster.items[0].geo_precision || "").indexOf("country") !== -1)
            ? `<div class="leaflet-popup__precision">${t("Country-level location", "定位精度：国家级")}</div>`
            : "";
        return `
            <div class="epic-map-popup">
                <strong class="epic-map-popup__title">${escapeHtml(locationLabel)}</strong>
                <div class="epic-map-popup__meta">
                    ${t(`${formatCount(cluster.count)} events`, `${formatCount(cluster.count)} 条事件`)} ·
                    ${escapeHtml(topDiseases.join(" / ") || t("No disease label", "无疾病标签"))}
                </div>
                <div class="epic-map-popup__meta">${latestDate ? t(`Latest ${latestDate}`, `最新 ${latestDate}`) : t("Date unavailable", "日期不可用")}</div>
                ${countryLevel}
                <ul class="epic-map-popup__list">
                    ${previewItems.map(function (item) {
                        return `<li><strong>${escapeHtml(displayDisease(item))}</strong><span>${escapeHtml(item.original_date || "")}</span></li>`;
                    }).join("")}
                </ul>
                ${moreCount ? `<div class="epic-map-popup__meta">${t(`+ ${formatCount(moreCount)} more`, `另有 ${formatCount(moreCount)} 条`)}</div>` : ""}
                <a class="epic-map-popup__action" href="#table-panel">${t("Filter the register →", "筛选事件明细 →")}</a>
            </div>
        `;
    }

    function renderLeafletClusters(clusters) {
        if (!state.leafletMap) return;
        if (state.leafletClusterLayer) state.leafletClusterLayer.remove();
        state.leafletClusterLayer = window.L.layerGroup();
        clusters.forEach(function (cluster) {
            const iconSize = cluster.size;
            const marker = window.L.marker([cluster.latitude, cluster.longitude], {
                keyboard: true,
                title: t(`${formatCount(cluster.count)} events`, `${formatCount(cluster.count)} 条事件`),
                icon: window.L.divIcon({
                    className: "epic-map-cluster-marker",
                    html: `<span class="cluster-badge cluster-badge--${cluster.tone}">${formatCount(cluster.count)}</span>`,
                    iconSize: [iconSize, iconSize],
                    iconAnchor: [iconSize / 2, iconSize / 2],
                    popupAnchor: [0, -(iconSize / 2)],
                }),
            });
            marker.bindPopup(renderLeafletPopup(cluster), {
                className: "epic-map-popup-shell",
                maxWidth: 320,
                minWidth: 240,
            });
            marker.on("click", function () {
                if (cluster.count > 1 && state.leafletMap.getZoom() < state.leafletMap.getMaxZoom()) {
                    const bounds = window.L.latLngBounds(cluster.items.map(function (item) {
                        return [item.latitude, item.longitude];
                    }));
                    if (bounds.isValid()) {
                        state.leafletMap.fitBounds(bounds.pad(0.4), { maxZoom: state.leafletMap.getMaxZoom() });
                    }
                }
            });
            marker.on("popupopen", function (event) {
                const action = event.popup.getElement().querySelector(".epic-map-popup__action");
                if (!action) return;
                action.addEventListener("click", function (clickEvent) {
                    clickEvent.preventDefault();
                    const locationKeyword = (cluster.items[0] && cluster.items[0].location) || "";
                    elements.keywordInput.value = locationKeyword;
                    if (readFiltersFromDom()) {
                        refreshDataAfterFilters();
                    }
                    elements.tablePanel.scrollIntoView({ behavior: "smooth" });
                });
            });
            marker.addTo(state.leafletClusterLayer);
        });
        state.leafletClusterLayer.addTo(state.leafletMap);
    }

    function renderRegionSidebar(regions, total) {
        if (!elements.regionSidebar) return;
        elements.regionSidebar.innerHTML = `
            <div class="region-sidebar__head">
                ${t("REGIONAL INDEX", "区域索引")}
                <span>${t(`${formatCount(total)} records`, `${formatCount(total)} 条记录`)}</span>
            </div>
            ${regions.map(function (region, index) {
                const share = Math.max(4, Math.round((region.items.length / Math.max(total, 1)) * 100));
                const locations = topEntries(region.locations, 3);
                const diseases = topEntries(region.diseases, 2).map(function (entry) { return entry[0]; });
                const regionLabel = displayContinent(region.key);
                return `
                    <button class="region-sidebar__item" type="button" data-region-filter="${escapeHtml(region.key)}" aria-label="${escapeHtml(t(`Filter events to ${regionLabel}`, `筛选${regionLabel}事件`))}">
                        <span class="region-sidebar__row">
                            <strong>${escapeHtml(regionLabel)}</strong>
                            <b>${formatCount(region.items.length)}</b>
                        </span>
                        <span class="region-sidebar__bar" aria-hidden="true"><i style="--share:${share}%"></i></span>
                        <span class="region-sidebar__meta">${escapeHtml(diseases.join(" · ") || t("No disease label", "无疾病标签"))}</span>
                        <span class="region-sidebar__locations">${locations.map(function (entry) {
                            return `<span>${escapeHtml(entry[0])}<b>${formatCount(entry[1])}</b></span>`;
                        }).join("")}</span>
                        <span class="region-sidebar__action">${t("Filter →", "筛选 →")}</span>
                    </button>
                `;
            }).join("")}
        `;
        bindRegionFilters();
    }

    function renderMap(items) {
        const safeItems = Array.isArray(items) ? items : [];
        const regions = aggregateRegions(safeItems);
        elements.mapMeta.textContent = t(
            `${formatCount(safeItems.length)} located records across ${formatCount(regions.length)} regions`,
            `${formatCount(safeItems.length)} 条定位记录 · ${formatCount(regions.length)} 个区域`,
        );

        if (!regions.length) {
            if (state.leafletClusterLayer) {
                state.leafletClusterLayer.remove();
                state.leafletClusterLayer = null;
            }
            elements.mapEmpty.classList.remove("hidden");
            renderRegionSidebar([], safeItems.length);
            return;
        }

        elements.mapEmpty.classList.add("hidden");
        state.lastMapItems = safeItems;
        renderRegionSidebar(regions, safeItems.length);
        if (ensureLeafletMap()) {
            renderLeafletClusters(aggregateMapItems(safeItems, state.leafletMap.getZoom()));
            window.requestAnimationFrame(function () {
                if (state.leafletMap) state.leafletMap.invalidateSize();
            });
        }
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
                            ${item.epi_week ? `<span>${escapeHtml(item.epi_week)}</span>` : ""}
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

    function renderEventCards(items) {
        if (!elements.eventCards) {
            return;
        }
        if (!items.length) {
            elements.eventCards.innerHTML = `<p class="event-cards__empty">${t("No detailed records match the current filters.", "当前筛选条件下没有明细记录。")}</p>`;
            return;
        }
        elements.eventCards.innerHTML = items.map(function (item) {
            const detailUrl = item.event_id ? `./events/${encodeURIComponent(item.event_id)}/` : "#";
            const cases = item.cases === null || item.cases === undefined ? "—" : formatCount(item.cases);
            const deaths = item.deaths === null || item.deaths === undefined ? "—" : formatCount(item.deaths);
            const score = Number.isFinite(Number(item.data_quality_score)) ? Number(item.data_quality_score) : "—";
            const tone = Number(score) >= 90 ? "good" : Number(score) >= 70 ? "warning" : "danger";
            const sourceLink = item.source
                ? `<a class="event-card__source" href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(displaySourceOrg(item))} ↗</a>`
                : `<span class="event-card__source">${t("Source unavailable", "来源不可用")}</span>`;
            return `
                <article class="event-card">
                    <div class="event-card__topline">
                        <time datetime="${escapeHtml(item.original_date || "")}">${escapeHtml(item.original_date || t("Date unavailable", "日期不可用"))}</time>
                        <span class="quality-badge quality-badge--${tone}"><strong>${escapeHtml(score)}</strong><small>/100</small></span>
                    </div>
                    <p class="event-card__place">${escapeHtml(displayLocation(item))}</p>
                    <h4>${escapeHtml(displayDisease(item))}</h4>
                    <p class="event-card__summary">${escapeHtml(displaySummary(item))}</p>
                    <dl class="event-card__details">
                        <div><dt>${t("Symptoms", "症状")}</dt><dd>${escapeHtml(displaySymptoms(item))}</dd></div>
                        <div><dt>${t("Measures", "措施")}</dt><dd>${escapeHtml(displayMeasures(item))}</dd></div>
                        <div><dt>${t("Transmission", "传播方式")}</dt><dd>${escapeHtml(displayTransmission(item))}</dd></div>
                        <div><dt>${t("Source org", "来源机构")}</dt><dd>${escapeHtml(displaySourceOrg(item))}</dd></div>
                    </dl>
                    <div class="event-card__metrics">
                        <span><b>${cases}</b><small>${t("Cases", "病例")}</small></span>
                        <span><b>${deaths}</b><small>${t("Deaths", "死亡")}</small></span>
                    </div>
                    <div class="event-card__actions">
                        ${sourceLink}
                        <a class="event-card__detail" href="${detailUrl}">${t("Open record →", "打开记录 →")}</a>
                    </div>
                </article>
            `;
        }).join("");
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
            renderEventCards(items);
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
                    organization.textContent = displaySourceOrg(item);
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
                            <p>${escapeHtml(displaySummary(item))}</p>
                        </div>
                    `;
                } else if (column.key === "cases" || column.key === "deaths") {
                    const value = item[column.key] === null || item[column.key] === undefined ? "—" : formatCount(item[column.key]);
                    cell.innerHTML = `<span class="metric-pair metric-pair--single"><strong>${value}</strong><small>${column.key === "cases" ? t("Cases", "病例") : t("Deaths", "死亡")}</small></span>`;
                } else if (column.key === "symptoms" || column.key === "measures" || column.key === "transmission") {
                    const value = column.key === "symptoms"
                        ? displaySymptoms(item)
                        : column.key === "measures"
                            ? displayMeasures(item)
                            : displayTransmission(item);
                    cell.title = value;
                    cell.innerHTML = `<div class="event-clamp">${escapeHtml(value)}</div>`;
                } else if (column.key === "source_org") {
                    cell.textContent = displaySourceOrg(item);
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
                    const eventLabel = displayDisease(item);
                    cell.innerHTML = `<a class="event-link" href="${detailUrl}" aria-label="${escapeHtml(t(`View details for ${eventLabel}`, `查看 ${eventLabel} 详情`))}">${t("Details →", "详情 →")}</a>`;
                } else if (column.key === "location") {
                    cell.textContent = displayLocation(item);
                } else if (column.key === "disease") {
                    cell.textContent = displayDisease(item);
                } else {
                    cell.textContent = item[column.key] || "—";
                }
                row.appendChild(cell);
            });
            elements.tableBody.appendChild(row);
        });
        renderEventCards(items);
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
                console.error(error);
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
            console.error(error);
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
        function applyFilterChange(validationTarget) {
            if (!readFiltersFromDom()) {
                if (validationTarget && typeof validationTarget.reportValidity === "function") {
                    validationTarget.reportValidity();
                }
                return;
            }
            refreshDataAfterFilters();
        }

        const debouncedKeywordHandler = debounce(function () {
            applyFilterChange();
        }, 300);

        elements.keywordInput.addEventListener("input", debouncedKeywordHandler);
        elements.diseaseSelect.addEventListener("change", function () {
            applyFilterChange();
        });
        elements.continentSelect.addEventListener("change", function () {
            applyFilterChange();
        });
        elements.dateFromInput.addEventListener("change", function (event) {
            applyFilterChange(event.currentTarget);
        });
        elements.dateToInput.addEventListener("change", function (event) {
            applyFilterChange(event.currentTarget);
        });
        elements.resetButton.addEventListener("click", function () {
            elements.keywordInput.value = "";
            elements.diseaseSelect.value = "";
            elements.continentSelect.value = "";
            elements.dateFromInput.value = "";
            elements.dateToInput.value = "";
            applyFilterChange();
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

    function setTableDensity(mode) {
        const density = mode === "comfortable" ? "comfortable" : "compact";
        document.body.dataset.density = density;
        try {
            window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
        } catch (error) {
            // Density is a preference only; ignore storage failures.
        }
        const compactButton = document.getElementById("density-compact");
        const comfortableButton = document.getElementById("density-comfortable");
        if (compactButton && comfortableButton) {
            compactButton.classList.toggle("is-active", density === "compact");
            comfortableButton.classList.toggle("is-active", density === "comfortable");
            compactButton.setAttribute("aria-pressed", String(density === "compact"));
            comfortableButton.setAttribute("aria-pressed", String(density === "comfortable"));
        }
    }

    function setupDensityToggle() {
        const compactButton = document.getElementById("density-compact");
        const comfortableButton = document.getElementById("density-comfortable");
        if (!compactButton || !comfortableButton) return;
        let saved = "compact";
        try {
            saved = window.localStorage.getItem(DENSITY_STORAGE_KEY) || "compact";
        } catch (error) {
            saved = "compact";
        }
        setTableDensity(saved);
        compactButton.addEventListener("click", function () { setTableDensity("compact"); });
        comfortableButton.addEventListener("click", function () { setTableDensity("comfortable"); });
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
        setupDensityToggle();
        setupLazyTableLoad();
        loadManifest();
        loadOverview();
        loadEpietl();
        loadMap();
        loadAgentExampleCount();
    }

    document.addEventListener("DOMContentLoaded", bootstrap);
})();
