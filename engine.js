const PATTERN_KEYS = ["氣虛", "氣逆", "氣鬱", "血虛", "瘀血", "水滯"];
const XU_SHI_KEYS = ["虛", "實"];
const ZANG_FU_KEYS = ["肝", "心", "脾", "肺", "腎"];

const EMPTY_VECTOR = Object.freeze({
  patterns: Object.freeze(Object.fromEntries(PATTERN_KEYS.map((key) => [key, 0]))),
  xuShi: Object.freeze(Object.fromEntries(XU_SHI_KEYS.map((key) => [key, 0]))),
  zangFu: Object.freeze(Object.fromEntries(ZANG_FU_KEYS.map((key) => [key, 0]))),
  symptoms: Object.freeze([]),
  tongue: Object.freeze([]),
  pulse: Object.freeze([]),
  redFlags: Object.freeze([]),
});

const SYNONYM_GROUPS = [
  {
    canonical: "腹瀉",
    terms: ["腹瀉", "泄瀉", "下利", "便溏", "溏泄", "稀便", "軟便", "水瀉", "水樣便", "腸鳴腹瀉", "完穀不化", "五更瀉", "久瀉"],
  },
  { canonical: "氣鬱", terms: ["氣鬱", "氣郁", "肝鬱", "壓力大", "壓力", "鬱悶", "抑鬱", "常嘆氣", "嘆氣"] },
  { canonical: "胸脅苦滿", terms: ["胸脅苦滿", "胸脇苦滿", "胸悶", "胸脅悶", "脇脹", "脅脹"] },
  { canonical: "失眠", terms: ["失眠", "睡不好", "眠差", "難入睡", "淺眠", "多夢"] },
  { canonical: "經前乳脹", terms: ["經前乳脹", "經前乳房脹痛", "乳房脹痛", "乳脹", "經前乳痛"] },
  { canonical: "煩躁", terms: ["煩躁", "焦躁", "易怒", "煩躁易怒"] },
  { canonical: "鬱熱", terms: ["鬱熱", "肝鬱化熱", "煩熱", "口苦", "易煩"] },
  { canonical: "血虛", terms: ["血虛", "貧血", "面色不佳", "皮膚乾燥", "爪甲異常"] },
  { canonical: "氣虛", terms: ["氣虛", "易疲勞", "倦怠", "無力", "食欲不振", "食慾不振"] },
  { canonical: "水滯", terms: ["水滯", "浮腫", "尿少", "尿量減少", "胃部振水音", "眩暈"] },
  { canonical: "瘀血", terms: ["瘀血", "舌暗紫", "刺痛", "固定痛", "月經不調", "下腹壓痛"] },
  { canonical: "氣逆", terms: ["氣逆", "上熱下寒", "上逆", "顏面潮紅", "嘔吐", "咳喘"] },
  { canonical: "痛經", terms: ["痛經", "經痛", "月經痛", "月經開始", "月經開始第5天", "月經疼痛", "疼痛自月經"] },
  { canonical: "月經延遲", terms: ["月經延遲", "月經遲延", "經期延後", "月經多少有些遲延"] },
  { canonical: "流產史", terms: ["流產", "流產2次", "人工刮宮", "刮宮"] },
  { canonical: "肥胖", terms: ["肥胖", "肥胖型", "體格為肥胖型", "虛胖"] },
  { canonical: "白苔", terms: ["白苔", "舌有白苔", "舌苔白", "白膩苔"] },
  { canonical: "腹脹", terms: ["腹脹", "腹部膨滿", "腹部脹滿", "腹滿"] },
  { canonical: "腹部按壓痛", terms: ["按壓時稍感疼痛", "臍左右", "臍旁壓痛", "腹部壓痛", "按壓痛"] },
  { canonical: "脈沉有力", terms: ["脈沉而有力", "沉脈有力", "脈沉有力"] },
  { canonical: "頭痛", terms: ["頭痛", "頭痛加劇", "頭痛反而加劇"] },
  { canonical: "噁心", terms: ["噁心", "惡心", "引起惡心", "泛惡"] },
  { canonical: "食欲消失", terms: ["食欲消失", "食慾消失", "食欲不振", "食慾不振", "納差"] },
];

const KEYWORD_EFFECTS = {
  腹瀉: { patterns: { 氣虛: 0.25, 水滯: 0.35 }, xuShi: { 虛: 0.35 }, zangFu: { 脾: 0.65 } },
  氣鬱: { patterns: { 氣鬱: 0.8 }, xuShi: { 實: 0.35 }, zangFu: { 肝: 0.8 } },
  胸脅苦滿: { patterns: { 氣鬱: 0.75 }, xuShi: { 實: 0.4 }, zangFu: { 肝: 0.85 } },
  失眠: { patterns: { 血虛: 0.35, 氣鬱: 0.25 }, xuShi: { 虛: 0.35 }, zangFu: { 心: 0.7, 肝: 0.25 } },
  經前乳脹: { patterns: { 氣鬱: 0.65, 血虛: 0.35 }, xuShi: { 實: 0.35, 虛: 0.25 }, zangFu: { 肝: 0.85, 脾: 0.25 } },
  煩躁: { patterns: { 氣鬱: 0.5, 氣逆: 0.2 }, xuShi: { 實: 0.45 }, zangFu: { 肝: 0.55, 心: 0.35 } },
  鬱熱: { patterns: { 氣鬱: 0.45, 氣逆: 0.25 }, xuShi: { 實: 0.55 }, zangFu: { 肝: 0.75, 心: 0.25 } },
  血虛: { patterns: { 血虛: 0.85, 氣虛: 0.2 }, xuShi: { 虛: 0.8 }, zangFu: { 肝: 0.45, 心: 0.35, 脾: 0.25 } },
  氣虛: { patterns: { 氣虛: 0.85 }, xuShi: { 虛: 0.85 }, zangFu: { 脾: 0.65, 肺: 0.25 } },
  水滯: { patterns: { 水滯: 0.9 }, xuShi: { 虛: 0.35, 實: 0.2 }, zangFu: { 脾: 0.45, 腎: 0.35, 肺: 0.25 } },
  瘀血: { patterns: { 瘀血: 0.9 }, xuShi: { 實: 0.55 }, zangFu: { 肝: 0.45, 心: 0.25 } },
  氣逆: { patterns: { 氣逆: 0.85 }, xuShi: { 實: 0.45 }, zangFu: { 肝: 0.35, 肺: 0.35, 心: 0.25 } },
  痛經: { patterns: { 瘀血: 0.75, 氣鬱: 0.35 }, xuShi: { 實: 0.45 }, zangFu: { 肝: 0.65, 脾: 0.2 } },
  月經延遲: { patterns: { 瘀血: 0.45, 血虛: 0.25, 氣鬱: 0.25 }, xuShi: { 實: 0.25, 虛: 0.2 }, zangFu: { 肝: 0.55, 脾: 0.2 } },
  流產史: { patterns: { 瘀血: 0.35, 血虛: 0.25 }, xuShi: { 虛: 0.25 }, zangFu: { 肝: 0.35, 腎: 0.25 } },
  肥胖: { patterns: { 水滯: 0.45, 氣虛: 0.25 }, xuShi: { 虛: 0.25, 實: 0.2 }, zangFu: { 脾: 0.55 } },
  白苔: { patterns: { 水滯: 0.35, 氣虛: 0.2 }, xuShi: { 虛: 0.25 }, zangFu: { 脾: 0.5, 肺: 0.15 } },
  腹脹: { patterns: { 氣鬱: 0.35, 水滯: 0.25, 氣虛: 0.2 }, xuShi: { 實: 0.25, 虛: 0.15 }, zangFu: { 脾: 0.55, 肝: 0.25 } },
  腹部按壓痛: { patterns: { 瘀血: 0.65, 氣鬱: 0.25 }, xuShi: { 實: 0.45 }, zangFu: { 肝: 0.45, 脾: 0.25 } },
  脈沉有力: { patterns: { 瘀血: 0.35, 水滯: 0.25 }, xuShi: { 實: 0.55 }, zangFu: { 肝: 0.25, 腎: 0.2 } },
  頭痛: { patterns: { 氣逆: 0.3, 瘀血: 0.25, 水滯: 0.2 }, xuShi: { 實: 0.25 }, zangFu: { 肝: 0.35 } },
  噁心: { patterns: { 氣逆: 0.35, 水滯: 0.25 }, xuShi: { 實: 0.2 }, zangFu: { 脾: 0.45, 肝: 0.15 } },
  食欲消失: { patterns: { 氣虛: 0.35, 水滯: 0.2 }, xuShi: { 虛: 0.35 }, zangFu: { 脾: 0.65 } },
};

const DERIVED_KEYWORDS = {
  痛經: ["瘀血", "氣鬱"],
  月經延遲: ["瘀血", "血虛"],
  腹部按壓痛: ["瘀血"],
  脈沉有力: ["實", "瘀血"],
  肥胖: ["水滯", "氣虛"],
  白苔: ["水滯"],
  腹脹: ["水滯", "氣鬱"],
  食欲消失: ["氣虛"],
};

const FIELD_SEARCH_KEYS = [
  "symptoms",
  "keySymptoms",
  "indications",
  "pattern",
  "formulaPattern",
  "notes",
  "aliases",
  "synonyms",
];

function createMutableVector() {
  return {
    patterns: Object.fromEntries(PATTERN_KEYS.map((key) => [key, 0])),
    xuShi: Object.fromEntries(XU_SHI_KEYS.map((key) => [key, 0])),
    zangFu: Object.fromEntries(ZANG_FU_KEYS.map((key) => [key, 0])),
    symptoms: [],
    tongue: [],
    pulse: [],
    redFlags: [],
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function addWeights(target, weights = {}) {
  Object.entries(weights).forEach(([key, value]) => {
    if (key in target) target[key] = clamp01(target[key] + value);
  });
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/，|、|。|；|;|：|:|（|）|\(|\)|\/|　/g, " ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toTextList(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value && typeof value === "object") return Object.keys(value);
  return String(value || "")
    .split(/[，、,;；。／\/\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function searchableText(formula) {
  return FIELD_SEARCH_KEYS.flatMap((key) => toTextList(formula[key])).join(" ");
}

function termsForKeyword(keyword) {
  const canonical = Normalizer.normalizeKeyword(keyword);
  const group = SYNONYM_GROUPS.find((item) => item.canonical === canonical);
  return group ? group.terms : [canonical];
}

function textMatchesKeyword(text, keyword) {
  const compact = normalizeText(text);
  return termsForKeyword(keyword).some((term) => compact.includes(normalizeText(term)));
}

function vectorDotSimilarity(patient = {}, formula = {}) {
  const keys = unique([...Object.keys(patient), ...Object.keys(formula)]);
  if (!keys.length) return 0;
  let dot = 0;
  let patientNorm = 0;
  let formulaNorm = 0;
  keys.forEach((key) => {
    const a = patient[key] || 0;
    const b = formula[key] || 0;
    dot += a * b;
    patientNorm += a * a;
    formulaNorm += b * b;
  });
  if (!patientNorm || !formulaNorm) return 0;
  return dot / (Math.sqrt(patientNorm) * Math.sqrt(formulaNorm));
}

function inferTypeVector(type = "") {
  if (type.includes("虛實")) return { 虛: 0.6, 實: 0.4 };
  if (type.includes("實")) return { 虛: 0.1, 實: 0.9 };
  if (type.includes("虛")) return { 虛: 0.9, 實: 0.1 };
  return { 虛: 0.35, 實: 0.35 };
}

function syndromeToPattern(syndrome, syndromeDb = {}) {
  const name = syndromeDb[syndrome]?.name || syndrome || "";
  if (name.includes("氣虛") || syndrome === "qi_xu") return "氣虛";
  if (name.includes("氣逆") || syndrome === "qi_ni") return "氣逆";
  if (name.includes("氣鬱") || name.includes("氣郁") || syndrome === "qi_yu") return "氣鬱";
  if (name.includes("血虛") || syndrome === "xue_xu") return "血虛";
  if (name.includes("瘀血") || syndrome === "yu_xue") return "瘀血";
  if (name.includes("水滯") || syndrome === "shui_zhi") return "水滯";
  return "";
}

function syndromeToOrgan(syndrome) {
  return {
    liver: "肝",
    heart: "心",
    spleen: "脾",
    lung: "肺",
    kidney: "腎",
  }[syndrome] || "";
}

const Normalizer = {
  synonymGroups: SYNONYM_GROUPS,
  normalizeKeyword(keyword) {
    const compact = normalizeText(keyword);
    const match = SYNONYM_GROUPS.find((group) =>
      group.terms.some((term) => compact.includes(normalizeText(term))),
    );
    return match ? match.canonical : String(keyword || "").trim();
  },
  normalizeKeywords(keywords = []) {
    return unique(keywords.map((keyword) => this.normalizeKeyword(keyword)));
  },
  expandKeyword(keyword) {
    return termsForKeyword(keyword);
  },
};

const NEGATION_MARKERS = ["未發現明顯", "未發現", "無明顯", "沒有明顯", "未見明顯", "沒有", "未見", "未有", "否認", "排除", "無"];
const NEGATION_BREAKERS = /[但而卻仍還]|有/;

// Ontology terms that BEGIN with a negation marker but are positive symptoms
// in their own right (無汗, 無力, 無熱候, 不安…): inside a clause, the marker
// they start with is part of the symptom name, not a negation of what follows
// — 「無汗惡寒」 must keep 惡寒 positive. Self-negating phrasings (無口渴)
// stay out because their remainder (口渴) is itself a term of the same entry.
// Cached per X4KbData.ontology reference (tests swap in mock ontologies).
let positiveMarkerTermsCache = { ontology: null, terms: [] };
function positiveMarkerTerms() {
  const ontology = (typeof window !== "undefined" && window.X4KbData && Array.isArray(window.X4KbData.ontology))
    ? window.X4KbData.ontology
    : null;
  if (positiveMarkerTermsCache.ontology === ontology) return positiveMarkerTermsCache.terms;
  const terms = [];
  (ontology || []).forEach((entry) => {
    if (entry.reviewStatus === "needs_human_review") return;
    const entryTerms = [entry.canonical, ...(Array.isArray(entry.aliases) ? entry.aliases : [])]
      .map((term) => String(term || "").trim()).filter(Boolean);
    const entryTermSet = new Set(entryTerms);
    entryTerms.forEach((term) => {
      const marker = NEGATION_MARKERS.find((item) => term.startsWith(item) && term.length > item.length);
      if (marker && !entryTermSet.has(term.slice(marker.length))) terms.push(term);
    });
  });
  positiveMarkerTermsCache = { ontology, terms };
  return terms;
}

function isTermNegated(text, index) {
  // Look backwards within the current clause (up to the last sentence break)
  // for a negation marker; an adversative/affirmative between the marker and
  // the term (e.g. 無食欲「但有」腹痛) cancels the negation for this term.
  const clauseStart = Math.max(
    text.lastIndexOf("。", index),
    text.lastIndexOf("；", index),
    text.lastIndexOf("，", index),
    text.lastIndexOf("\n", index),
  ) + 1;
  const clause = text.slice(clauseStart, index);
  for (const marker of NEGATION_MARKERS) {
    let markerPos = clause.lastIndexOf(marker);
    while (markerPos !== -1) {
      // A marker that just starts a positive symptom name (the 無 of 無汗)
      // is not a negation of the following term — try earlier occurrences.
      const absolutePos = clauseStart + markerPos;
      const partOfPositiveTerm = positiveMarkerTerms().some((term) =>
        term.startsWith(marker) && text.startsWith(term, absolutePos));
      if (!partOfPositiveTerm) {
        const between = clause.slice(markerPos + marker.length);
        if (!NEGATION_BREAKERS.test(between)) return true;
        break;
      }
      markerPos = markerPos > 0 ? clause.lastIndexOf(marker, markerPos - 1) : -1;
    }
  }
  return false;
}

const Parser = {
  // Shared with script.js's ontology-based case scan (parseCaseTextWithOntology)
  // so both parsing paths apply identical clause-level negation rules; two
  // diverging negation implementations is how negated symptoms leak back in
  // as positive keywords.
  isTermNegated,
  NEGATION_MARKERS,
  parseCaseText(text = "") {
    const hits = [];
    SYNONYM_GROUPS.forEach((group) => {
      group.terms.forEach((term) => {
        let from = 0;
        const index = text.indexOf(term, from);
        if (index === -1) return;
        hits.push({
          keyword: group.canonical,
          source: term,
          weight: 1,
          negated: isTermNegated(text, index),
        });
      });
    });
    const derivedHits = [];
    hits.forEach((hit) => {
      if (hit.negated) return;
      (DERIVED_KEYWORDS[hit.keyword] || []).forEach((keyword) => {
        derivedHits.push({ keyword, source: hit.keyword, weight: 0.8, negated: false });
      });
    });
    const seen = new Set();
    return [...hits, ...derivedHits].filter((hit) => {
      const key = `${hit.keyword}::${hit.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};

const VectorBuilder = {
  emptyVector() {
    return structuredClone(EMPTY_VECTOR);
  },
  buildPatientVector({
    keywords = [],
    syndromeScores = {},
    organScores = {},
    checkedSymptomLabels = [],
  } = {}) {
    const vector = createMutableVector();
    const normalized = Normalizer.normalizeKeywords([...keywords, ...checkedSymptomLabels]);

    normalized.forEach((keyword) => {
      const effect = KEYWORD_EFFECTS[keyword];
      if (!effect) return;
      addWeights(vector.patterns, effect.patterns);
      addWeights(vector.xuShi, effect.xuShi);
      addWeights(vector.zangFu, effect.zangFu);
    });

    const maxSyndromeScore = Math.max(1, ...Object.values(syndromeScores).map(Number));
    Object.entries(syndromeScores).forEach(([key, score]) => {
      const pattern = syndromeToPattern(key);
      if (pattern) vector.patterns[pattern] = Math.max(vector.patterns[pattern], clamp01(Number(score) / maxSyndromeScore));
    });

    const maxOrganScore = Math.max(1, ...Object.values(organScores).map(Number));
    Object.entries(organScores).forEach(([key, score]) => {
      const organ = syndromeToOrgan(key);
      if (organ) vector.zangFu[organ] = Math.max(vector.zangFu[organ], clamp01(Number(score) / maxOrganScore));
    });

    vector.symptoms = normalized;
    return vector;
  },
  buildFormulaVector(formula, { syndromeDb = {} } = {}) {
    const vector = createMutableVector();
    const ownVector = formula.vector || {};
    Object.assign(vector.patterns, ownVector.patterns || {});
    Object.assign(vector.xuShi, ownVector.xuShi || inferTypeVector(formula.type));
    Object.assign(vector.zangFu, ownVector.zangFu || {});

    const pattern = syndromeToPattern(formula.syndrome, syndromeDb);
    if (pattern) vector.patterns[pattern] = Math.max(vector.patterns[pattern], 0.85);

    const organ = syndromeToOrgan(formula.syndrome);
    if (organ) vector.zangFu[organ] = Math.max(vector.zangFu[organ], 0.85);

    const text = searchableText(formula);
    Normalizer.normalizeKeywords(toTextList(text)).forEach((keyword) => {
      const effect = KEYWORD_EFFECTS[keyword];
      if (!effect) return;
      addWeights(vector.patterns, Object.fromEntries(Object.entries(effect.patterns || {}).map(([key, value]) => [key, value * 0.45])));
      addWeights(vector.zangFu, Object.fromEntries(Object.entries(effect.zangFu || {}).map(([key, value]) => [key, value * 0.35])));
    });

    vector.symptoms = Normalizer.normalizeKeywords(toTextList(text));
    return vector;
  },
};

const ScoringEngine = {
  scoreFormula({ patientVector, formula, formulaVector, queryKeywords = [] }) {
    const formulaText = searchableText(formula);
    const symptomKeywords = queryKeywords.length ? queryKeywords : patientVector.symptoms;
    const matchedSymptoms = symptomKeywords.filter((keyword) => textMatchesKeyword(formulaText, keyword));
    const matchRate = queryKeywords.length ? matchedSymptoms.length / queryKeywords.length : 0;
    const symptomMatch = symptomKeywords.length ? matchedSymptoms.length / symptomKeywords.length : 0;

    const specialIndications = toTextList(formula.specialIndications || formula.formulaPattern || formula.notes);
    const specialHits = specialIndications.filter((item) =>
      patientVector.symptoms.some((keyword) => textMatchesKeyword(item, keyword)),
    );
    const contraindications = toTextList(formula.contraindications);
    const contraindicationHits = contraindications.filter((item) =>
      patientVector.symptoms.some((keyword) => textMatchesKeyword(item, keyword)),
    );

    const patternSimilarity = vectorDotSimilarity(patientVector.patterns, formulaVector.patterns);
    const xuShiSimilarity = vectorDotSimilarity(patientVector.xuShi, formulaVector.xuShi);
    const zangFuSimilarity = vectorDotSimilarity(patientVector.zangFu, formulaVector.zangFu);
    const specialIndicationMatch = specialHits.length ? 1 : 0;
    const contraindicationPenalty = Math.min(0.35, contraindicationHits.length * 0.18);

    const total =
      patternSimilarity * 0.3 +
      xuShiSimilarity * 0.15 +
      zangFuSimilarity * 0.2 +
      symptomMatch * 0.25 +
      specialIndicationMatch * 0.1 -
      contraindicationPenalty;

    return {
      totalScore: Math.round(clamp01(total) * 100),
      patternSimilarity,
      xuShiSimilarity,
      zangFuSimilarity,
      symptomMatch,
      specialIndicationMatch,
      contraindicationPenalty,
      matchRate,
      matchedSymptoms,
      specialHits,
      contraindicationHits,
    };
  },
};

const ExplainabilityEngine = {
  explain({ formula, score, formulaVector }) {
    const dominantPatterns = Object.entries(formulaVector.patterns)
      .filter(([, value]) => value >= 0.25)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `${key} ${value.toFixed(2)}`);
    const dominantOrgans = Object.entries(formulaVector.zangFu)
      .filter(([, value]) => value >= 0.25)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
    const xuShi = Object.entries(formulaVector.xuShi)
      .filter(([, value]) => value >= 0.25)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `${key} ${value.toFixed(2)}`);

    const reason = `此方覆蓋 ${dominantPatterns.slice(0, 3).join("、") || "主要辨證"}，並與 ${dominantOrgans.join("、") || "症狀特徵"} 相關；症狀命中 ${score.matchedSymptoms.length} 項，因此列入優先推薦。`;

    return {
      patterns: dominantPatterns,
      xuShi,
      zangFu: dominantOrgans,
      matchedSymptoms: score.matchedSymptoms,
      specialHits: score.specialHits,
      contraindicationHits: score.contraindicationHits,
      reason,
    };
  },
};

const RecommendationEngine = {
  recommend({
    formulas = [],
    syndromeDb = {},
    organDb = {},
    checkedSymptomLabels = [],
    syndromeScores = {},
    organScores = {},
    diagnosedSyndromes = [],
    constitutionFilter = "all",
    searchText = "",
    caseKeywords = [],
    strictness = "default",
  } = {}) {
    const rawSearchKeywords = String(searchText || "")
      .split(/[，、,;；\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const queryKeywords = Normalizer.normalizeKeywords(rawSearchKeywords);
    const normalizedCaseKeywords = Normalizer.normalizeKeywords(caseKeywords);
    const patientVector = VectorBuilder.buildPatientVector({
      keywords: [...queryKeywords, ...normalizedCaseKeywords],
      syndromeScores,
      organScores,
      checkedSymptomLabels,
    });

    const minimumMatchRate =
      queryKeywords.length >= 3
        ? strictness === "expert"
          ? 0.8
          : strictness === "strict"
            ? 0.6
            : 0.4
        : 0;

    return formulas
      .filter((formula) => constitutionFilter === "all" || formula.type === constitutionFilter)
      .map((formula) => {
        const formulaVector = VectorBuilder.buildFormulaVector(formula, { syndromeDb, organDb });
        const score = ScoringEngine.scoreFormula({ patientVector, formula, formulaVector, queryKeywords });
        const text = searchableText(formula);
        const broadSearchHit = queryKeywords.length === 0 || queryKeywords.some((keyword) => textMatchesKeyword(text, keyword));
        const isPrimary = diagnosedSyndromes.includes(formula.syndrome) || score.patternSimilarity > 0.65 || score.zangFuSimilarity > 0.65;
        return {
          ...formula,
          totalScore: score.totalScore,
          matchedCount: score.matchedSymptoms.length,
          matchedSymptoms: score.matchedSymptoms,
          matchRate: score.matchRate,
          isPrimary,
          scoreParts: score,
          formulaVector,
          explanation: ExplainabilityEngine.explain({ formula, score, formulaVector }),
          broadSearchHit,
        };
      })
      .filter((item) => {
        if (queryKeywords.length === 1) return item.broadSearchHit;
        if (queryKeywords.length === 2) return item.matchedCount >= 1;
        if (queryKeywords.length >= 3) return item.matchRate >= minimumMatchRate;
        return item.totalScore > 0 || item.isPrimary;
      })
      .sort((a, b) => {
        if (queryKeywords.length >= 2 && b.matchRate !== a.matchRate) return b.matchRate - a.matchRate;
        return b.totalScore - a.totalScore;
      })
      .slice(0, 5);
  },
};

const KampoEngine = {
  Parser,
  Normalizer,
  VectorBuilder,
  ScoringEngine,
  RecommendationEngine,
  ExplainabilityEngine,
};

if (typeof window !== "undefined") {
  window.KampoEngine = KampoEngine;
  window.Parser = Parser;
  window.Normalizer = Normalizer;
  window.RecommendationEngine = RecommendationEngine;
  window.Parser = Parser;
  window.Normalizer = Normalizer;
  window.RecommendationEngine = RecommendationEngine;
}





