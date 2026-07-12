// Auto-generated from src/kampo2/phase1.mjs and src/kampo2/x4-matcher.mjs
// by scripts/generate_frontend_x4_bundle.mjs. Do not edit directly.
// Re-run "node scripts/generate_frontend_x4_bundle.mjs" after changing either source file.
window.Phase1Kampo = (function () {
const PARENT_FALLBACK_WEIGHT = 0.7;

function uniqBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function symptomRefId(ref) {
  return typeof ref === "string" ? ref : ref.id;
}

function symptomRefNegated(ref) {
  return typeof ref === "string" ? false : Boolean(ref.negated);
}

function createSymptomNormalizer(ontology, { parentFallbackWeight = PARENT_FALLBACK_WEIGHT } = {}) {
  const byId = new Map(ontology.map((entry) => [entry.id, entry]));
  const terms = [];

  for (const entry of ontology) {
    for (const term of [entry.canonical, ...toArray(entry.aliases)]) {
      terms.push({ term, entry });
    }
  }

  terms.sort((a, b) => b.term.length - a.term.length);

  function normalizeEntry(entry, raw, matchType = "direct") {
    const direct = {
      id: entry.id,
      canonical: entry.canonical,
      raw,
      matchType,
      weight: 1,
      parent: entry.parent ?? null,
      tags: entry.tags || [],
    };
    const matches = [direct];
    if (entry.parent && byId.has(entry.parent)) {
      const parent = byId.get(entry.parent);
      matches.push({
        id: parent.id,
        canonical: parent.canonical,
        raw,
        matchType: "parent",
        weight: parentFallbackWeight,
        parent: parent.parent ?? null,
        tags: parent.tags || [],
        childId: entry.id,
      });
    }
    return matches;
  }

  function normalizeTerm(term) {
    const trimmed = String(term || "").trim();
    if (!trimmed) return [];
    if (/^S-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(trimmed) && byId.has(trimmed)) {
      return normalizeEntry(byId.get(trimmed), trimmed);
    }
    const exact = terms.find((item) => item.term === trimmed);
    if (!exact) return [];
    return normalizeEntry(exact.entry, trimmed);
  }

  function normalizeText(text) {
    const source = String(text || "").trim();
    const idMatches = normalizeTerm(source);
    if (idMatches.length && /^S-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(source)) return idMatches;
    const matches = [];
    for (const item of terms) {
      if (!item.term || !source.includes(item.term)) continue;
      matches.push(...normalizeTerm(item.term));
    }
    return uniqBy(matches, (item) => `${item.id}:${item.matchType}:${item.childId || ""}`);
  }

  return {
    byId,
    terms,
    normalizeTerm,
    normalizeText,
    getCanonical(id) {
      return byId.get(id)?.canonical || id;
    },
    getParent(id) {
      return byId.get(id)?.parent || null;
    },
  };
}

function splitQuery(text) {
  return String(text || "")
    .split(/[，、,;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFormulaKeySymptoms(rawSymptoms, normalizer) {
  return rawSymptoms.flatMap((raw) => {
    if (typeof raw === "object" && raw?.id) {
      return [{
        id: raw.id,
        canonical: normalizer.getCanonical(raw.id),
        negated: Boolean(raw.negated),
        raw: raw.raw || normalizer.getCanonical(raw.id),
      }];
    }
    const text = String(raw || "").trim();
    if (/^S-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(text)) {
      return [{
        id: text,
        canonical: normalizer.getCanonical(text),
        negated: false,
        raw: text,
      }];
    }
    const negated = /^(無|不|未見)/.test(text);
    const cleanText = text.replace(/^(無|不|未見)/, "");
    const direct = normalizer.normalizeText(cleanText).filter((item) => item.matchType === "direct");
    return direct.map((item) => ({
      id: item.id,
      canonical: item.canonical,
      negated,
      raw: text,
    }));
  });
}

function formulaSearchText(formula, normalizer) {
  const keySymptomNames = normalizeFormulaKeySymptoms(formula.keySymptoms || [], normalizer).map((item) => item.canonical);
  return [
    formula.name,
    formula.indications,
    formula.formulaPattern,
    formula.notes,
    ...toArray(formula.symptoms),
    ...toArray(formula.aliases),
    ...toArray(formula.synonyms),
    ...keySymptomNames,
  ].filter(Boolean).join(" ");
}

function scoreFormula(formula, queryMatches, normalizer) {
  const keySymptoms = normalizeFormulaKeySymptoms(formula.keySymptoms || [], normalizer);
  const queryById = new Map();
  for (const match of queryMatches) {
    const current = queryById.get(match.id);
    if (!current || match.weight > current.weight) queryById.set(match.id, match);
  }

  const matchedSymptoms = [];
  const unmatchedKeySymptoms = [];

  for (const keySymptom of keySymptoms) {
    const direct = queryById.get(keySymptom.id);
    if (direct?.matchType === "direct") {
      matchedSymptoms.push({
        id: keySymptom.id,
        canonical: keySymptom.canonical,
        matchType: "direct",
        weight: 1,
        negated: keySymptom.negated,
      });
      continue;
    }
    const childMatch = [...queryById.values()].find((match) =>
      (match.matchType === "direct" && normalizer.getParent(match.id) === keySymptom.id) ||
      (match.matchType === "parent" && match.id === keySymptom.id)
    );
    if (childMatch) {
      matchedSymptoms.push({
        id: keySymptom.id,
        canonical: keySymptom.canonical,
        matchType: "parent",
        childId: childMatch.id,
        childCanonical: childMatch.canonical,
        weight: PARENT_FALLBACK_WEIGHT,
        negated: keySymptom.negated,
      });
      continue;
    }
    unmatchedKeySymptoms.push({
      id: keySymptom.id,
      canonical: keySymptom.canonical,
      negated: keySymptom.negated,
    });
  }

  const denominator = Math.max(1, keySymptoms.length);
  const keySymptomScore = matchedSymptoms.reduce((sum, item) => sum + item.weight * (item.negated ? -0.5 : 1), 0) / denominator;

  return {
    keySymptomScore,
    matchedSymptoms,
    unmatchedKeySymptoms,
  };
}

function createPhase1Engine(kb) {
  const normalizer = createSymptomNormalizer(kb.ontology);
  const formulas = kb.formulas.map((formula) => ({
    ...formula,
    normalizedKeySymptoms: normalizeFormulaKeySymptoms(formula.keySymptoms || [], normalizer),
  }));

  function search(query) {
    const queryTerms = splitQuery(query);
    const queryMatches = uniqBy(
      queryTerms.flatMap((term) => normalizer.normalizeText(term)),
      (item) => `${item.id}:${item.matchType}:${item.childId || ""}`,
    );

    const results = formulas.map((formula) => {
      const text = formulaSearchText(formula, normalizer);
      const broadHit = queryMatches.some((match) => text.includes(match.canonical) || text.includes(match.raw));
      const score = scoreFormula(formula, queryMatches, normalizer);
      const matchedQueryIds = new Set(score.matchedSymptoms.map((item) => item.id));
      const matchedCount = score.matchedSymptoms.length;
      const queryDirectIds = new Set(queryMatches.filter((item) => item.matchType === "direct").map((item) => item.id));
      const queryHitCount = [...queryDirectIds].filter((id) =>
        score.matchedSymptoms.some((item) => item.id === id || item.childId === id) ||
        formula.normalizedKeySymptoms.some((symptom) => symptom.id === id || normalizer.getParent(id) === symptom.id)
      ).length;
      return {
        formula,
        score: Number(Math.max(0, score.keySymptomScore).toFixed(4)),
        matchedCount,
        queryHitCount,
        explanation: {
          matchedSymptoms: score.matchedSymptoms,
          unmatchedKeySymptoms: score.unmatchedKeySymptoms,
          phase: "Phase 1: Score = keySymptomScore",
        },
        broadHit,
        matchedQueryIds,
      };
    });

    return results
      .filter((item) => {
        if (queryTerms.length <= 1) return item.broadHit || item.matchedCount > 0;
        return item.queryHitCount > 0 || item.matchedCount > 0;
      })
      .sort((a, b) => {
        if (b.queryHitCount !== a.queryHitCount) return b.queryHitCount - a.queryHitCount;
        if (b.score !== a.score) return b.score - a.score;
        return a.formula.keySymptoms.length - b.formula.keySymptoms.length;
      });
  }

  function getFormulaComposition(formulaId) {
    return kb.formulaCompositionsDraft.find((item) => item.formulaId === formulaId) || null;
  }

  function modifierDirection(formulaId, residualSymptomIds) {
    const composition = getFormulaComposition(formulaId);
    const suggestions = [];
    for (const herb of kb.herbTargetSymptoms) {
      const covered = herb.targetSymptoms.filter((id) => residualSymptomIds.includes(id));
      if (!covered.length) continue;
      const alreadyInFormula = Boolean(composition?.herbs?.includes(herb.name));
      suggestions.push({
        herbId: herb.herbId,
        name: herb.name,
        coveredSymptoms: covered.map((id) => ({ id, canonical: normalizer.getCanonical(id) })),
        directionOnly: true,
        draft: true,
        alreadyInFormula,
        note: alreadyInFormula
          ? `${herb.name} 已在底方草稿組成中；Phase 1 僅顯示可能加重方向，待覆核。`
          : `${herb.name} 覆蓋殘留症狀；Phase 1 僅作方向建議，無劑量與安全宣稱。`,
      });
    }
    // Primary rank: cover the most residual symptoms. Tie-break: cover the
    // patient's earliest-listed (chief) complaint first — residualSymptomIds is
    // passed chief-first, so a smaller earliest index wins when coverage ties.
    const earliestResidualIndex = (suggestion) =>
      Math.min(...suggestion.coveredSymptoms.map((item) => residualSymptomIds.indexOf(item.id)));
    suggestions.sort((a, b) =>
      b.coveredSymptoms.length - a.coveredSymptoms.length ||
      earliestResidualIndex(a) - earliestResidualIndex(b));
    return suggestions.slice(0, 3);
  }

  return {
    normalizer,
    formulas,
    search,
    normalizeFormulaKeySymptoms(rawSymptoms) {
      return normalizeFormulaKeySymptoms(rawSymptoms, normalizer);
    },
    modifierDirection,
  };
}






  return { createSymptomNormalizer, createPhase1Engine };
})();
window.X4Kampo = (function () {
const { createSymptomNormalizer } = window.Phase1Kampo;

const W_KEY = 0.50;
const W_PATTERN = 0.40;
const W_ZANGFU = 0.10;
const PARENT_FALLBACK_WEIGHT = 0.7;
// Evidence damping (physician decision 2026-07-10, option A of
// HANDOFF-2026-07-08): pattern/zangfu cosine similarity only earns its full
// weight when backed by at least this many positive key-symptom hits.
// Sparse patients (2-3 symptoms) produce inflated cosines (~0.707) on
// near-empty pattern vectors, which let one-hit generic formulas outrank
// formulas matching most of their key symptoms (人參湯 case, 2026-07-08).
const EVIDENCE_DAMPING_K = 2;
// Book-evidence bonus (physician decision 2026-07-11): 書源補充症狀
// (formula.bookSymptoms — symptoms《漢方臨床診療學》attests for an Excel
// formula that its curated keySymptoms don't cover) join scoring as SECONDARY
// evidence: a small capped bonus per patient hit, never touching the
// key-symptom denominator. Hits that already earned key-symptom credit are
// excluded so nothing double-counts.
const W_BOOK_SECONDARY = 0.10;
const BOOK_SECONDARY_K = 2;
// Derived-vector trust ramp (2026-07-11 薛案 postmortem): book/physician
// formulas get their pattern/zangfu vectors DERIVED from their own key
// symptoms (option B), so their cosine partially double-counts the same
// evidence the key score already measured — a single generic key hit plus an
// aligned one-hot vector let 清上蠲痛湯 outrank 半夏厚朴湯 on a globus triad.
// Excel formulas' vectors are independent information (sheet membership) and
// keep full weight; a derived vector earns weight positiveKeyHits/K, so it
// only speaks once real key evidence accumulates (a flat 0.5 discount was
// tried first and knocked 4-hit 桂枝湯 out of its own classic presentation).
const DERIVED_VECTOR_K = 4;
// Key-symptom score = geometric mean of COVERAGE and EVIDENCE VOLUME.
//
// Coverage alone (matched key weight ÷ the formula's own key count) has two
// failure modes pulling opposite ways:
//
//   - it PUNISHES a well-documented formula. Giving 當歸芍藥散 the 眩暈/頭痛/肩凝/
//     耳鳴 the handbook attests for it (clinically correct) takes it from 10 keys
//     to 14, so a patient presenting its ten CLASSIC keys scores 10/14 = 0.71
//     instead of 1.00 — the formula gets worse at its own textbook case by being
//     described better. That is what blocked the book's key symptoms from ever
//     landing.
//   - it REWARDS a sparse formula. 四物湯 has two key symptoms; hit both and it
//     scores a perfect 1.00 on a ten-symptom patient it barely addresses.
//
// Volume is what the formula actually confirmed, and it does not care how many
// keys the formula has. It saturates at KEY_EVIDENCE_K hits OR at however many
// symptoms the patient reported, whichever is smaller — without that second
// clause a sparse patient is unscorable (someone reporting three symptoms can
// never produce five key hits, so the term stops discriminating and 半夏厚朴湯,
// three keys and one hit but the 梅核氣 answer, falls out of first place).
const KEY_EVIDENCE_K = 5;

const XUSHI_CLASSES = new Set(["虛證", "實證", "虛實夾雜", "未分類"]);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function symptomRefId(ref) {
  if (typeof ref === "string") return ref.startsWith("!") ? ref.slice(1) : ref;
  if (!ref?.id) return "";
  return String(ref.id).startsWith("!") ? String(ref.id).slice(1) : String(ref.id);
}

function symptomRefNegated(ref) {
  if (typeof ref === "string") return ref.startsWith("!");
  if (String(ref?.id || "").startsWith("!")) return true;
  // When the KB provides an explicit boolean, trust it: the generator
  // (scripts/xlsx_to_kb.py term_self_negates) already distinguishes negated
  // phrasings (無口渴) from real symptoms that merely start with a negation
  // marker (無力, 無熱候). The raw-prefix guess would mislabel the latter.
  if (typeof ref?.negated === "boolean") return ref.negated;
  return Boolean(ref?.negated) || /^無|^不|^未見/.test(String(ref?.raw || ""));
}

const PATIENT_NEGATION_PREFIX = /^(未發現明顯|未發現|無明顯|沒有明顯|未見明顯|沒有|未見|未有|否認|排除|無)/;
const PATIENT_NEGATION_BREAKERS = /[但而卻仍還]|有/;

// Exact ontology terms whose NAME merely starts with a negation marker
// (無汗, 無力, 無熱候) are positive symptoms, not negations. Self-negating
// phrasings stay negated: 無口渴 is excluded because its remainder (口渴)
// resolves to the same entry — mirrors scripts/xlsx_to_kb.py term_self_negates.
function exactPositiveMarkerTerm(text, marker, normalizer) {
  if (!normalizer) return false;
  const matches = normalizer.normalizeTerm(text);
  if (!matches.length) return false;
  const ids = new Set(matches.map((match) => match.id));
  return !normalizer.normalizeTerm(text.slice(marker.length)).some((match) => ids.has(match.id));
}

function patientTermNegated(term, normalizer) {
  if (typeof term === "object" && term) {
    if (term.negated) return true;
    if (String(term.id || "").startsWith("!")) return true;
    return patientTermNegated(term.raw || term.canonical || "", normalizer);
  }
  const text = String(term || "").trim();
  if (!text) return false;
  const marker = text.match(PATIENT_NEGATION_PREFIX)?.[0] || "";
  if (!marker) return false;
  if (exactPositiveMarkerTerm(text, marker, normalizer)) return false;
  const afterMarker = text.slice(marker.length);
  return !PATIENT_NEGATION_BREAKERS.test(afterMarker);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// 六證 term (2026-07-11 redesign, physician chose this route).
//
// It used to be cosine(patientPatternVector, formulaPatternVector), and that was
// a category error. The patient vector is the physician's DIAGNOSTIC checklist —
// score ÷ threshold, answering "does this patient MEET 水滯?" — while the formula
// vector is one-hot membership answering "does this formula TREAT 水滯?". A
// cosine between them measures neither question:
//
//   - the patient side is unbounded, so one over-threshold pattern owns the
//     direction. 胃部振水音 alone scores 15 against 水滯's threshold of 13, so any
//     patient with it is pinned to the 水滯 axis at 1.15+.
//   - the formula side punishes breadth. 當歸芍藥散 treats 血虛+瘀血+水滯, so its
//     vector has norm √3 and it needs the patient lit up on all three; 大防風湯
//     treats 水滯 alone, norm 1, and rides the patient's biggest axis. Result:
//     0.871 to 0.519, and 大防風湯 (five key symptoms, three hit) beat 當歸芍藥散
//     matching TEN of its key symptoms.
//
// The right question is coverage: of the patterns this patient HAS, how many does
// this formula treat? Burden is capped at 1 per pattern — past the threshold the
// pattern is simply confirmed, not "1.54 times confirmed" — and precision keeps
// a formula from winning by targeting patterns the patient doesn't have. The
// harmonic mean is tilted toward recall (PATTERN_RECALL_BETA): treating more of
// what the patient actually has is the point, and a formula is allowed to carry
// patterns beyond the current presentation.
const PATTERN_RECALL_BETA = 2;

// 六經 channel term (2026-07-12, physician direction): 六經辨證 and 氣血水 are
// TWO SYSTEMS that can point at the same formula. The workbook's six-pattern
// framework has no 表證 axis at all, so a pure 太陽 presentation (無汗・惡寒・
// 發熱・項背強) computes only checklist noise (氣逆 0.40 / 水滯 0.31 — below
// every threshold) and 0.40 of the score is handed to whichever formula is
// filed under 氣逆 (measured 2026-07-11; the drop-uninformative-terms fix was
// measured too and rejected — see reports/scoring-model-findings-2026-07-11.md).
//
// The channel system is a SECOND ROUTE to the recommendation, not a term in
// the six-pattern weighted average: the final score is the MAX of the 氣血水
// route (unchanged) and the 六經 route. The 六經 route only exists when the
// patient shows channel-determinable evidence AND the formula carries a
// book-declared 病期 (channelStages, from the head of 《漢方臨床診療學》's
// 病期病態 sections); in every other case it is exactly zero and the ranking
// is byte-identical to the pre-channel model — no canary can move through
// renormalisation. Within a matched channel the route orders formulas by key
// evidence (CHANNEL_W_KEY), which is precisely the 傷寒論 way: among the 太陽
// formulas, 無汗 vs 汗出 decides 葛根湯 vs 桂枝加葛根湯, and the six-pattern
// residue (the noise the checklist itself scores below every threshold) is
// not allowed to overrule it.
//
// Patient-side inference is deliberately conservative:
//   太陽 — gate: 惡寒/發冷 AND 發熱 together (the acute exterior pair), or 脈浮.
//        Chronic cold-intolerance alone (當歸芍藥散-type patients) never opens it.
//   少陽 — gate: any pathognomonic sign (胸脇苦滿 / 口苦 / 往來寒熱).
// v2 (2026-07-12, criteria taken from《漢方臨床診療學》第五章 六病位, the
// user's direction that the book carries the full 六經辨證 rulebook; printed
// pages cited, scan page = printed + 28):
//   陽明 (p.124) — 陽證第三階段, 主病位在裡, 全身熱象, 一般伴口渴和便秘;
//        腸型=便秘＋腹滿感＋裡熱. Gate: 發熱＋口渴 together (裡熱型 proxy),
//        or the 腸型 triad 便秘＋腹脹＋(發熱 or 口渴). Constipation alone
//        never opens it.
//   太陰 (p.134-135) — 共通證候＝氣虛/血虛基礎上加消化系統症狀 (心窩部
//        不適感、腹滿感、噁心、嘔吐、腹瀉、便秘). Gate (gateCross): one
//        deficiency sign (易疲勞/發冷/貧血 — the physician ruled 2026-07-12
//        that 血虛 joins the deficiency group) AND one digestive sign from
//        the book's list. Digestive complaints alone never open it.
//   少陰 (p.149) — 共通症狀＝全身倦怠感、四肢末梢發冷、脈微弱. Gate:
//        易疲勞＋發冷 together, or 脈微弱 (pathognomonic, physician-typed).
//   厥陰 (p.156) — 休克前/休克狀態 (意識低下、體溫調節失調); a checklist
//        patient is never in this state, so no patient-side gate — the stage
//        exists on formulas only (茯苓四逆湯) and the route stays silent.
const CHANNEL_W_KEY = 0.55;   // 六經路線裡主症證據的權重
const CHANNEL_W_STAGE = 0.45; // 病期相符本身的權重

const CHANNEL_SIGNS = {
  "太陽": {
    gatePairs: [["S-COLD", "S-FEVER"]],
    gateAny: ["S-PULSE-FLOATING"],
    supporting: [
      "S-COLD", "S-FEVER", "S-HEADACHE", "S-SHOULDER-STIFF", "S-NO-SWEAT",
      "S-SPONTANEOUS-SWEAT", "S-MUSCLE-PAIN", "S-PULSE-FLOATING",
      "S-NASAL-CONGESTION", "S-RUNNY-NOSE-WATERY",
    ],
    saturation: 4,
  },
  "少陽": {
    gatePairs: [],
    gateAny: ["S-CHEST-RIB-FULLNESS", "S-BITTER-TASTE", "S-ALTERNATING-CHILL-FEVER"],
    supporting: ["S-CHEST-RIB-FULLNESS", "S-BITTER-TASTE", "S-ALTERNATING-CHILL-FEVER"],
    saturation: 2,
  },
  "陽明": {
    gatePairs: [
      ["S-FEVER", "S-THIRST"],
      ["S-CONSTIPATION", "S-ABDOMINAL-DISTENSION", "S-FEVER"],
      ["S-CONSTIPATION", "S-ABDOMINAL-DISTENSION", "S-THIRST"],
    ],
    gateAny: [],
    supporting: ["S-FEVER", "S-THIRST", "S-CONSTIPATION", "S-ABDOMINAL-DISTENSION"],
    saturation: 3,
  },
  "太陰": {
    gatePairs: [],
    gateAny: [],
    // any deficiency sign AND any digestive sign (the book's 共通證候 shape)
    gateCross: [
      ["S-FATIGUE", "S-COLD", "S-BLOOD-DEF"],
      [
        "S-EPIGASTRIC-RESISTANCE", "S-EPIGASTRIC-PAIN", "S-ABDOMINAL-DISTENSION",
        "S-NAUSEA", "S-VOMITING", "S-DIARRHEA", "S-CONSTIPATION",
      ],
    ],
    supporting: [
      "S-FATIGUE", "S-COLD", "S-BLOOD-DEF", "S-EPIGASTRIC-RESISTANCE",
      "S-EPIGASTRIC-PAIN", "S-ABDOMINAL-DISTENSION", "S-NAUSEA", "S-VOMITING",
      "S-DIARRHEA", "S-CONSTIPATION",
    ],
    saturation: 4,
  },
  "少陰": {
    gatePairs: [["S-FATIGUE", "S-COLD"]],
    gateAny: ["S-PULSE-WEAK"],
    supporting: ["S-FATIGUE", "S-COLD", "S-PULSE-WEAK", "S-DIARRHEA"],
    saturation: 3,
  },
};

// Positive, directly-reported symptom ids only: negated findings and synthetic
// parent-fallback ancestors must not open a channel gate.
function positiveDirectIds(patientMatches) {
  const ids = new Set();
  for (const match of bestPatientMatchesById(patientMatches).values()) {
    if (match.matchType === "direct" && match.weight > 0) ids.add(match.id);
  }
  return ids;
}

function buildChannelEvidence(patientMatches) {
  const ids = positiveDirectIds(patientMatches);
  const evidence = {};
  for (const [channel, signs] of Object.entries(CHANNEL_SIGNS)) {
    const gateOpen = signs.gatePairs.some((pair) => pair.every((id) => ids.has(id)))
      || signs.gateAny.some((id) => ids.has(id))
      || (signs.gateCross || []).length > 0
        && (signs.gateCross || []).every((group) => group.some((id) => ids.has(id)));
    if (!gateOpen) continue;
    const hits = signs.supporting.filter((id) => ids.has(id));
    const strength = Math.min(1, hits.length / signs.saturation);
    if (strength > 0) evidence[channel] = { strength, signs: hits };
  }
  return evidence;
}

function channelAlignment(channelEvidence, formulaStages) {
  const stages = toArray(formulaStages);
  if (!stages.length) return { bonusFactor: 0, matchedChannels: [] };
  const matchedChannels = [];
  let best = 0;
  for (const [channel, { strength }] of Object.entries(channelEvidence || {})) {
    if (!stages.includes(channel)) continue;
    matchedChannels.push({ channel, strength });
    if (strength > best) best = strength;
  }
  return { bonusFactor: best, matchedChannels };
}

function patternCoverage(patientVector, formulaVector) {
  let patientBurden = 0;
  let formulaBreadth = 0;
  let covered = 0;
  for (const key of new Set([...Object.keys(patientVector || {}), ...Object.keys(formulaVector || {})])) {
    const burden = Math.min(1, Math.max(0, Number(patientVector?.[key] || 0)));
    const treats = Number(formulaVector?.[key] || 0) > 0 ? 1 : 0;
    patientBurden += burden;
    formulaBreadth += treats;
    covered += burden * treats;
  }
  if (!patientBurden || !formulaBreadth) return 0;
  const recall = covered / patientBurden;
  const precision = covered / formulaBreadth;
  if (!recall || !precision) return 0;
  const beta2 = PATTERN_RECALL_BETA * PATTERN_RECALL_BETA;
  return ((1 + beta2) * precision * recall) / ((beta2 * precision) + recall);
}

function cosine(left, right) {
  const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
  let dot = 0;
  let leftSq = 0;
  let rightSq = 0;
  for (const key of keys) {
    const a = Number(left?.[key] || 0);
    const b = Number(right?.[key] || 0);
    dot += a * b;
    leftSq += a * a;
    rightSq += b * b;
  }
  if (!leftSq || !rightSq) return 0;
  return dot / (Math.sqrt(leftSq) * Math.sqrt(rightSq));
}

const XUSHI_FORMULA_OVERRIDES = new Map([
  ["四神丸", "虛證"],
  ["平胃散", "實證"],
  ["參苓白朮散", "虛證"],
  ["四逆散", "實證"],
  ["溫經湯", "虛實夾雜"],
  ["牛車腎氣丸", "虛證"],
  ["桂枝人參湯", "虛證"],
  ["柴胡疏肝湯", "實證"],
  ["黃連解毒湯", "實證"],
  ["葛根湯", "實證"],
  ["奔豚湯（肘後方）", "虛實夾雜"],
  ["黃連湯", "虛實夾雜"],
  ["香蘇散", "虛實夾雜"],
  ["女神散", "虛實夾雜"],
  ["半夏厚朴湯", "虛實夾雜"],
  ["柴朴湯", "虛實夾雜"],
  ["柴胡加龍骨牡蠣湯", "虛實夾雜"],
  ["抑肝散", "虛實夾雜"],
  ["抑肝散加陳皮半夏", "虛實夾雜"],
  ["鉤藤散", "虛實夾雜"],
  ["柴胡清肝湯", "虛實夾雜"],
  ["柴胡桂枝湯等柴胡劑", "虛實夾雜"],
]);

function normalizeXushiClass(category, name = null) {
  if (XUSHI_FORMULA_OVERRIDES.has(name)) return XUSHI_FORMULA_OVERRIDES.get(name);
  const text = String(category || "").trim();
  if (XUSHI_CLASSES.has(text) && text !== "未分類") return text;
  if (!text) return "未分類";
  if (["虛實", "陰陽兩虛"].some((token) => text.includes(token))) return "虛實夾雜";
  if (["陽氣虛", "陰液虛", "虛勞", "氣血兩虛", "氣血雙補", "補血", "腎陽虛", "腎陰虛", "肺氣虛", "肺陰液虛", "血虛", "津虧", "極虛", "衰竭", "桂枝和甘草配伍", "人參湯類", "桂枝湯類"].some((token) => text.includes(token))) return "虛證";
  if (text.includes("↓") && !text.includes("↑")) return "虛證";
  if (["實證", "熱證", "陽氣實", "陰液實"].some((token) => text.includes(token)) && !text.includes("虛")) return "實證";
  return "未分類";
}

function formulaXushiClass(formula) {
  const value = formula.xushiClass || normalizeXushiClass(formula.category, formula.name);
  return XUSHI_CLASSES.has(value) ? value : "未分類";
}

function passesXushiGate(formula, patientXushi) {
  const tendency = patientXushi || "unknown";
  const klass = formulaXushiClass(formula);
  if (tendency === "unknown" || klass === "虛實夾雜" || klass === "未分類") return true;
  if (tendency === "xu" && klass === "實證") return false;
  if (tendency === "shi" && klass === "虛證") return false;
  return true;
}

function normalizeFormulaKeySymptoms(rawSymptoms, normalizer) {
  const mapped = toArray(rawSymptoms).flatMap((ref) => {
    const id = symptomRefId(ref);
    if (id && /^S-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(id)) {
      return [{
        id,
        canonical: normalizer.getCanonical(id),
        raw: typeof ref === "object" ? (ref.raw || id) : ref,
        negated: symptomRefNegated(ref),
      }];
    }

    const text = String(typeof ref === "object" ? (ref.raw || "") : (ref || "")).trim();
    if (!text) return [];
    const negated = /^(無|不|未見)/.test(text);
    const cleanText = text.replace(/^(無|不|未見)/, "");
    return normalizer.normalizeText(cleanText)
      .filter((match) => match.matchType === "direct")
      .map((match) => ({
        id: match.id,
        canonical: match.canonical,
        raw: text,
        negated,
      }));
  });

  return uniqueBy(mapped, (item) => `${item.id}:${item.negated ? "negated" : "positive"}`);
}

function buildPatientMatches(patient, normalizer) {
  const sourceTerms = [
    ...toArray(patient.symptoms),
    ...toArray(patient.tongue),
    ...toArray(patient.pulse),
  ];
  const matches = [];
  for (const term of sourceTerms) {
    if (patientTermNegated(term, normalizer)) continue;
    matches.push(...normalizer.normalizeText(term));
  }
  return uniqueBy(matches, (item) => `${item.id}:${item.matchType}:${item.childId || ""}`);
}

function bestPatientMatchesById(patientMatches) {
  const byId = new Map();
  for (const match of patientMatches) {
    const current = byId.get(match.id);
    if (!current || match.weight > current.weight) byId.set(match.id, match);
  }
  return byId;
}

function thresholdMap(patterns) {
  return new Map(toArray(patterns).map((pattern) => [pattern.id, Number(pattern.threshold || 1)]));
}

function buildPatternVector(patientMatches, patterns) {
  const byId = bestPatientMatchesById(patientMatches);
  const raw = {};
  for (const pattern of toArray(patterns)) {
    let score = 0;
    for (const [symptomId, weight] of Object.entries(pattern.weights || {})) {
      const match = byId.get(symptomId);
      if (match) score += Number(weight || 0) * Number(match.weight || 0);
    }
    const threshold = Math.max(1, Number(pattern.threshold || 1));
    raw[pattern.id] = Math.min(score / threshold, 2.0);
  }
  return raw;
}

function buildZangFuVector(patientMatches, zangFuStates) {
  const ids = new Set(patientMatches.map((match) => match.id));
  const vector = {};
  for (const state of toArray(zangFuStates)) {
    const indicators = toArray(state.indicators);
    const matched = indicators.filter((id) => ids.has(id)).length;
    vector[state.id] = indicators.length ? matched / indicators.length : 0;
  }
  return vector;
}

function scoreKeySymptoms(formula, patientMatches, normalizer, reportedSymptomCount) {
  const keySymptoms = normalizeFormulaKeySymptoms(formula.keySymptoms || [], normalizer);
  const patientById = bestPatientMatchesById(patientMatches);
  const matchedSymptoms = [];
  const unmatchedKeySymptoms = [];

  for (const keySymptom of keySymptoms) {
    const direct = patientById.get(keySymptom.id);
    if (direct?.matchType === "direct") {
      const weight = keySymptom.negated ? -0.5 : 1;
      matchedSymptoms.push({
        id: keySymptom.id,
        canonical: keySymptom.canonical,
        raw: keySymptom.raw,
        matchType: "direct",
        weight,
        negated: keySymptom.negated,
      });
      continue;
    }

    const childMatch = [...patientById.values()].find((match) =>
      (match.matchType === "direct" && normalizer.getParent(match.id) === keySymptom.id) ||
      (match.matchType === "parent" && match.id === keySymptom.id)
    );
    if (childMatch) {
      const weight = keySymptom.negated ? -0.5 * PARENT_FALLBACK_WEIGHT : PARENT_FALLBACK_WEIGHT;
      matchedSymptoms.push({
        id: keySymptom.id,
        canonical: keySymptom.canonical,
        raw: keySymptom.raw,
        matchType: "parent",
        childId: childMatch.childId || childMatch.id,
        childCanonical: childMatch.canonical,
        weight,
        negated: keySymptom.negated,
      });
      continue;
    }

    unmatchedKeySymptoms.push({
      id: keySymptom.id,
      canonical: keySymptom.canonical,
      raw: keySymptom.raw,
      negated: keySymptom.negated,
    });
  }

  const matchedWeight = matchedSymptoms.reduce((sum, item) => sum + item.weight, 0);
  const coverage = matchedWeight / Math.max(1, keySymptoms.length);
  const achievable = Math.max(1, Math.min(KEY_EVIDENCE_K, reportedSymptomCount || KEY_EVIDENCE_K));
  const volume = Math.min(1, Math.max(0, matchedWeight) / achievable);
  // A net-negative match (the patient contradicts the formula's key symptoms)
  // stays negative — the geometric mean is only meaningful above zero.
  return {
    keySymptoms,
    keySymptomScore: coverage <= 0 ? coverage : Math.sqrt(coverage * volume),
    matchedSymptoms,
    unmatchedKeySymptoms,
  };
}

// Patient-side residuals: the symptoms the PATIENT actually reported that this
// formula's key symptoms do NOT cover — i.e. the "most-lacking" keywords a 加減
// single-herb suggestion should target. This is the mirror image of
// unmatchedKeySymptoms (which are the FORMULA's key symptoms the patient never
// reported) and is what the frontend adapter now feeds to modifierDirection.
//
// Source set: DIRECT patient matches only (symptoms literally reported, already
// normalized to ontology ids). Parent-fallback matches are synthetic broader
// ancestors inferred from a child term, not something the patient stated, so
// they never seed a residual.
//
// Exclusion set: every patient id that already earned this formula key-symptom
// credit — both a direct hit (matched.id, which equals the patient's direct id)
// and a parent-fallback hit (matched.childId, the patient's reported child term
// that satisfied a broader formula key symptom). A child that gave the formula
// parent-fallback credit is therefore treated as covered and drops out.
//
// Order: patient input order (bestPatientMatchesById preserves first-seen /
// Map insertion order, which follows symptoms -> tongue -> pulse input order),
// so chief complaints come first. Direct matches all carry weight 1, so no
// weight re-sort is needed.
function computePatientResidualSymptoms(patientMatches, matchedSymptoms) {
  const covered = new Set();
  for (const matched of matchedSymptoms) {
    covered.add(matched.id);
    if (matched.childId) covered.add(matched.childId);
  }
  const residuals = [];
  for (const match of bestPatientMatchesById(patientMatches).values()) {
    if (match.matchType !== "direct" || covered.has(match.id)) continue;
    residuals.push({ id: match.id, canonical: match.canonical, weight: match.weight });
  }
  return residuals;
}

// Secondary book evidence: patient DIRECT matches that hit the formula's
// bookSymptoms but earned no key-symptom credit (neither a direct key hit nor
// the child term behind a parent-fallback hit).
function matchBookSymptoms(formula, patientMatches, matchedSymptoms) {
  const bookSymptoms = toArray(formula.bookSymptoms);
  if (!bookSymptoms.length) return [];
  const credited = new Set();
  for (const matched of matchedSymptoms) {
    credited.add(matched.id);
    if (matched.childId) credited.add(matched.childId);
  }
  const bookById = new Map(bookSymptoms.map((item) => [item.id, item]));
  const hits = [];
  for (const match of bestPatientMatchesById(patientMatches).values()) {
    if (match.matchType !== "direct" || credited.has(match.id)) continue;
    const book = bookById.get(match.id);
    if (book) hits.push({ id: book.id, canonical: book.canonical || match.canonical, page: book.page ?? null });
  }
  return hits;
}

// 表證 formulas cannot be ranked on the 六證 axis, and no scoring change fixes it
// (2026-07-11, measured — see reports/clinical-battery-2026-07-11.md).
//
// 葛根湯 does not rank for its own 傷寒論 presentation (無汗・惡寒・發熱・項背強) even
// with its missing 無汗 key restored: its key score (0.745) BEATS 桂枝加葛根湯's
// (0.730), hitting all five of the patient's symptoms, and it still loses. The
// patient's six-pattern vector is noise — nothing reaches its threshold (氣逆 0.40,
// 水滯 0.31, the residue of 頭痛/惡寒 appearing on those checklists), so the
// checklist itself says this patient has NONE of these patterns — yet that noise
// still carries weight 0.40 and hands the case to whichever formula happens to be
// filed under 氣逆. The workbook has no 表證 sheet at all; the framework is 氣血水,
// and 葛根湯 appears in it only in its 氣鬱 role (肩凝/頭重).
//
// Dropping uninformative terms from the weighted average was built and measured:
// 葛根湯 goes to first, and 當歸芍藥散 falls from first to fourth (renormalising
// inflates formulas that carry few informative terms). Top-three across eighteen
// textbook presentations: 12/18 → 9/18. Rejected. This needs the 六證 framework to
// gain a 表裡 axis, which is the physician's call, not a scorer tweak.
function scoreFormula(formula, patientContext, normalizer) {
  // Distinct symptoms the patient reported — the ceiling on how much key evidence
  // any formula could possibly confirm for this patient.
  const reportedSymptomCount = bestPatientMatchesById(patientContext.matches).size;
  const key = scoreKeySymptoms(formula, patientContext.matches, normalizer, reportedSymptomCount);
  const patternScore = patternCoverage(patientContext.patternVector, formula.patternVector || {});
  const zangFuScore = cosine(patientContext.zangFuVector, formula.zangFuVector || {});
  const positiveKeyHits = key.matchedSymptoms.filter((item) => item.weight > 0).length;
  const evidenceFactor = Math.min(1, positiveKeyHits / EVIDENCE_DAMPING_K);
  const matchedBookSymptoms = matchBookSymptoms(formula, patientContext.matches, key.matchedSymptoms);
  const bookBonus = W_BOOK_SECONDARY * Math.min(1, matchedBookSymptoms.length / BOOK_SECONDARY_K);
  const vectorWeight = formula.vectorSource ? Math.min(1, positiveKeyHits / DERIVED_VECTOR_K) : 1;
  const channel = channelAlignment(patientContext.channelEvidence, formula.channelStages);
  const baseTotal = (W_KEY * key.keySymptomScore)
    + ((W_PATTERN * patternScore) + (W_ZANGFU * zangFuScore)) * evidenceFactor * vectorWeight
    + bookBonus;
  const channelRoute = channel.bonusFactor > 0
    ? channel.bonusFactor * ((CHANNEL_W_KEY * key.keySymptomScore) + CHANNEL_W_STAGE)
    : 0;
  const total = Math.max(baseTotal, channelRoute);

  return {
    formula: {
      ...formula,
      xushiClass: formulaXushiClass(formula),
    },
    score: {
      total,
      key: key.keySymptomScore,
      pattern: patternScore,
      zangFu: zangFuScore,
      evidenceFactor,
      bookBonus,
      channelRoute,
      routeTaken: channelRoute > baseTotal ? "六經" : "氣血水",
    },
    explanation: {
      matchedSymptoms: key.matchedSymptoms,
      unmatchedKeySymptoms: key.unmatchedKeySymptoms,
      matchedBookSymptoms,
      matchedChannels: channel.matchedChannels,
      patientChannelEvidence: patientContext.channelEvidence,
      patientResidualSymptoms: computePatientResidualSymptoms(patientContext.matches, key.matchedSymptoms),
      patientPatternVector: patientContext.patternVector,
      patientZangFuVector: patientContext.zangFuVector,
      xushiClass: formulaXushiClass(formula),
    },
    _keySymptomCount: key.keySymptoms.length,
  };
}

function createX4Matcher(kb) {
  const normalizer = createSymptomNormalizer(kb.ontology);
  const formulas = toArray(kb.formulas).map((formula) => ({
    ...formula,
    xushiClass: formulaXushiClass(formula),
  }));
  const patterns = toArray(kb.patterns);
  thresholdMap(patterns);

  function buildPatientContext(patient) {
    const matches = buildPatientMatches(patient || {}, normalizer);
    return {
      matches,
      patternVector: buildPatternVector(matches, patterns),
      zangFuVector: buildZangFuVector(matches, kb.zangFuStates),
      channelEvidence: buildChannelEvidence(matches),
      xuShi: patient?.xuShi || "unknown",
    };
  }

  function scoreFormulaWithContext(formula, patientContext) {
    return scoreFormula(formula, patientContext, normalizer);
  }

  function recommend(patient, { limit = 5 } = {}) {
    const patientContext = buildPatientContext(patient || {});
    const scored = formulas
      .filter((formula) => passesXushiGate(formula, patientContext.xuShi))
      .map((formula) => scoreFormulaWithContext(formula, patientContext));
    applyCombinationRule(scored);
    return scored
      .sort((a, b) => {
        const diff = b.score.total - a.score.total;
        if (Math.abs(diff) > 1e-12) return diff;
        if (a._keySymptomCount !== b._keySymptomCount) return a._keySymptomCount - b._keySymptomCount;
        return a.formula.name.localeCompare(b.formula.name, "zh-Hant");
      })
      .slice(0, limit)
      .map(({ _keySymptomCount, ...result }) => result);
  }

  // 合方守則 (2026-07-12): a combination formula may not outrank its own
  // component unless the OTHER component contributes key evidence — the kampo
  // combination principle (use 柴朴湯 over 半夏厚朴湯 only when there is a 柴胡證).
  //
  // Discovered when the physician-named orphan blocks gave 柴朴湯 its book
  // monograph (p.245): the equalised book bonus unmasked a zangfu-cosine gap
  // (the workbook files 柴朴湯 under 肝氣鬱 but 半夏厚朴湯 under 脾/肺/心), and
  // 柴朴湯 overtook 半夏厚朴湯 on the pure globus triad with ZERO 小柴胡湯-part
  // evidence — flipping the physician's 2026-07-11 梅核氣 ruling. The KB records
  // composedOfFormulas from the workbook, so the rule is data-driven, tiny in
  // scope (three combination formulas), and clinically the right general fix.
  //
  // Mechanics: a component is "evidenced" when its own scoring shows at least
  // one positive key hit. With two or more evidenced components the combination
  // stands on its full score; otherwise it is capped just below its best
  // evidenced component (or best component overall when none is evidenced).
  function applyCombinationRule(scored) {
    const byName = new Map(scored.map((result) => [result.formula.name, result]));
    const hasKeyEvidence = (result) =>
      result.explanation.matchedSymptoms.some((item) => item.weight > 0);
    for (const result of scored) {
      const componentNames = toArray(result.formula.composedOfFormulas);
      if (componentNames.length < 1) continue;
      const components = componentNames.map((name) => byName.get(name)).filter(Boolean);
      if (!components.length) continue;
      const evidenced = components.filter(hasKeyEvidence);
      if (evidenced.length >= 2) continue;
      const base = (evidenced[0] || components.reduce((best, item) =>
        (item.score.total > best.score.total ? item : best)));
      if (result.score.total > base.score.total - 1e-9) {
        result.score.total = base.score.total - 1e-6;
        result.score.combinationCappedBelow = base.formula.name;
        result.explanation.combinationCap = {
          base: base.formula.name,
          evidencedComponents: evidenced.map((item) => item.formula.name),
          reason: "合方的另一組成方無主症證據，不得高於被證實的組成方",
        };
      }
    }
  }

  function scoreFormulaByName(name, patient) {
    const formula = formulas.find((item) => item.name === name);
    if (!formula) throw new Error(`Formula not found: ${name}`);
    const patientContext = buildPatientContext(patient || {});
    const { _keySymptomCount, ...result } = scoreFormulaWithContext(formula, patientContext);
    return result;
  }

  return {
    recommend,
    scoreFormulaByName,
    buildPatientContext,
    // Exposed so the 六證 term can be tested on its own semantics rather than
    // only through whole-KB rankings.
    scorePatternVectors: patternCoverage,
    normalizer,
  };
}



  return { buildChannelEvidence, normalizeXushiClass, createX4Matcher, W_KEY, W_PATTERN, W_ZANGFU, PARENT_FALLBACK_WEIGHT, EVIDENCE_DAMPING_K, W_BOOK_SECONDARY, BOOK_SECONDARY_K, DERIVED_VECTOR_K, KEY_EVIDENCE_K, PATTERN_RECALL_BETA, CHANNEL_W_KEY, CHANNEL_W_STAGE };
})();
