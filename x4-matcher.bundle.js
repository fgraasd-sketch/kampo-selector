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

  function normalizeTerm(term) {
    const trimmed = String(term || "").trim();
    if (!trimmed) return [];
    const exact = terms.find((item) => item.term === trimmed);
    if (!exact) return [];
    const direct = {
      id: exact.entry.id,
      canonical: exact.entry.canonical,
      raw: trimmed,
      matchType: "direct",
      weight: 1,
      parent: exact.entry.parent ?? null,
      tags: exact.entry.tags || [],
    };
    const matches = [direct];
    if (exact.entry.parent && byId.has(exact.entry.parent)) {
      const parent = byId.get(exact.entry.parent);
      matches.push({
        id: parent.id,
        canonical: parent.canonical,
        raw: trimmed,
        matchType: "parent",
        weight: parentFallbackWeight,
        parent: parent.parent ?? null,
        tags: parent.tags || [],
        childId: exact.entry.id,
      });
    }
    return matches;
  }

  function normalizeText(text) {
    const source = String(text || "");
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
    suggestions.sort((a, b) => b.coveredSymptoms.length - a.coveredSymptoms.length);
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
  return Boolean(ref?.negated) || String(ref?.id || "").startsWith("!") || /^無|^不|^未見/.test(String(ref?.raw || ""));
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

function scoreKeySymptoms(formula, patientMatches, normalizer) {
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

  const denominator = Math.max(1, keySymptoms.length);
  return {
    keySymptoms,
    keySymptomScore: matchedSymptoms.reduce((sum, item) => sum + item.weight, 0) / denominator,
    matchedSymptoms,
    unmatchedKeySymptoms,
  };
}

function scoreFormula(formula, patientContext, normalizer) {
  const key = scoreKeySymptoms(formula, patientContext.matches, normalizer);
  const patternScore = cosine(patientContext.patternVector, formula.patternVector || {});
  const zangFuScore = cosine(patientContext.zangFuVector, formula.zangFuVector || {});
  const total = (W_KEY * key.keySymptomScore) + (W_PATTERN * patternScore) + (W_ZANGFU * zangFuScore);

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
    },
    explanation: {
      matchedSymptoms: key.matchedSymptoms,
      unmatchedKeySymptoms: key.unmatchedKeySymptoms,
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
      xuShi: patient?.xuShi || "unknown",
    };
  }

  function scoreFormulaWithContext(formula, patientContext) {
    return scoreFormula(formula, patientContext, normalizer);
  }

  function recommend(patient, { limit = 5 } = {}) {
    const patientContext = buildPatientContext(patient || {});
    return formulas
      .filter((formula) => passesXushiGate(formula, patientContext.xuShi))
      .map((formula) => scoreFormulaWithContext(formula, patientContext))
      .sort((a, b) => {
        const diff = b.score.total - a.score.total;
        if (Math.abs(diff) > 1e-12) return diff;
        if (a._keySymptomCount !== b._keySymptomCount) return a._keySymptomCount - b._keySymptomCount;
        return a.formula.name.localeCompare(b.formula.name, "zh-Hant");
      })
      .slice(0, limit)
      .map(({ _keySymptomCount, ...result }) => result);
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
    normalizer,
  };
}



  return { normalizeXushiClass, createX4Matcher, W_KEY, W_PATTERN, W_ZANGFU, PARENT_FALLBACK_WEIGHT };
})();
