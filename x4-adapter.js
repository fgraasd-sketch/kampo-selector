// Bridges the existing checkbox/search-based UI (script.js) to the
// validated X4 matcher (x4-matcher.bundle.js + x4-kb-data.js), replacing
// engine.js's heuristic ScoringEngine/RecommendationEngine for actual
// formula ranking. engine.js is still used for its Normalizer/VectorBuilder
// helpers (to derive a rough xu/shi tendency from checked symptoms) and
// kept as a fallback if the X4 bundle failed to load for any reason.
const X4Adapter = (function () {
  let matcherInstance = null;
  let phase1EngineInstance = null;

  function getMatcher() {
    if (!matcherInstance) {
      if (!window.X4Kampo || !window.X4KbData) return null;
      matcherInstance = window.X4Kampo.createX4Matcher(window.X4KbData);
    }
    return matcherInstance;
  }

  // modifierDirection() (draft single-herb "add/strengthen" suggestions) needs
  // herbTargetSymptoms/formulaCompositionsDraft on top of the base X4KbData;
  // an unrefreshed cached bundle may not have them yet, so this stays null
  // (feature silently absent) instead of throwing.
  function getPhase1Engine() {
    if (!phase1EngineInstance) {
      if (!window.Phase1Kampo || !window.X4KbData?.herbTargetSymptoms) return null;
      phase1EngineInstance = window.Phase1Kampo.createPhase1Engine(window.X4KbData);
    }
    return phase1EngineInstance;
  }

  // Draft 加減 single-herb suggestions cover the patient's MOST-LACKING keywords:
  // the symptoms the PATIENT reported that the chosen formula's key symptoms do
  // NOT cover (result.explanation.patientResidualSymptoms from the matcher), not
  // the formula's own unmatched key symptoms (which the patient may never have
  // had). See computePatientResidualSymptoms() in x4-matcher.mjs.
  //
  // These residuals are always positive, patient-reported, ontology-normalized
  // symptoms: negated case items (e.g. 無口渴) are dropped upstream in script.js
  // (parseCaseText -> caseKeywords keeps only !item.negated) before they ever
  // reach the matcher, so there is nothing to negation-filter here. They arrive
  // chief-complaint-first, and are passed to modifierDirection in that order so
  // its tie-break favors herbs covering the patient's earlier (chief) complaints.
  function getHerbSuggestions(formulaId, patientResidualSymptoms) {
    const engine = getPhase1Engine();
    if (!engine) return [];
    const residualSymptomIds = (patientResidualSymptoms || []).map((symptom) => symptom.id);
    if (!residualSymptomIds.length) return [];
    return engine.modifierDirection(formulaId, residualSymptomIds)
      .slice(0, 2)
      .map((suggestion) => ({
        name: suggestion.name,
        coveredSymptoms: suggestion.coveredSymptoms.map((item) => item.canonical),
        alreadyInFormula: suggestion.alreadyInFormula,
      }));
  }

  function deriveXuShi(patientVectorXuShi) {
    const xu = patientVectorXuShi?.虛 || 0;
    const shi = patientVectorXuShi?.實 || 0;
    if (xu - shi >= 0.15) return "xu";
    if (shi - xu >= 0.15) return "shi";
    return "unknown";
  }

  function isAvailable() {
    return Boolean(getMatcher());
  }

  function compactList(items, limit = 4) {
    const labels = (items || []).filter(Boolean);
    if (!labels.length) return "\u7121";
    const head = labels.slice(0, limit).join("\u3001");
    return labels.length > limit ? head + "\u7b49 " + labels.length + " \u9805" : head;
  }

  function buildRecommendationReason(result, matchedCanonical, unmatchedCanonical) {
    const totalKeySymptoms = matchedCanonical.length + unmatchedCanonical.length;
    const keyDenominator = Math.max(1, totalKeySymptoms);
    const keyPct = Math.round(result.score.key * 100);
    const patternPct = Math.round(result.score.pattern * 100);
    const zangFuPct = Math.round(result.score.zangFu * 100);
    const parts = [
      "\u95dc\u9375\u75c7\u72c0\u547d\u4e2d " + matchedCanonical.length + "/" + keyDenominator + "\uff08" + keyPct + "%\uff09",
    ];
    if (matchedCanonical.length) parts.push("\u5df2\u547d\u4e2d\uff1a" + compactList(matchedCanonical));
    if (unmatchedCanonical.length) parts.push("\u5c1a\u7f3a\uff1a" + compactList(unmatchedCanonical));
    parts.push("\u516d\u8b49\u5951\u5408 " + patternPct + "%\uff1b\u4e94\u81df\u5951\u5408 " + zangFuPct + "%");
    parts.push("\u6392\u5e8f\u6703\u7d9c\u5408\u95dc\u9375\u75c7\u72c0\u3001\u516d\u8b49\u3001\u4e94\u81df\uff1b\u55ae\u4e00\u5171\u6709\u75c7\u72c0\u4e0d\u6703\u55ae\u7368\u6c7a\u5b9a\u540d\u6b21");
    return parts.join("\u3002") + "\u3002";
  }


  function formulaXushiDisplay(xushiClass) {
    return xushiClass || "\u672a\u5206\u985e";
  }

  function buildXushiLabel(inferredXuShi, formulaClass) {
    const display = formulaXushiDisplay(formulaClass);
    if (inferredXuShi === "unknown") return "\u65b9\uff1a" + display;
    if (formulaClass === "\u865b\u5be6\u593e\u96dc" || formulaClass === "\u672a\u5206\u985e") return "\u53ef\u7528";
    // The auto-inferred xu/shi no longer gates the matcher, so a shi-classified
    // formula CAN be ranked for a xu-leaning patient; the label must say so
    // instead of claiming a match for every classified formula.
    const patientClass = inferredXuShi === "xu" ? "\u865b\u8b49" : "\u5be6\u8b49";
    if (formulaClass === patientClass) return "\u76f8\u7b26";
    return "\u4e0d\u7b26\uff08\u65b9\uff1a" + display + "\uff09";
  }

  function buildXushiExplanation(inferredXuShi, formulaClass) {
    const display = formulaXushiDisplay(formulaClass);
    if (inferredXuShi === "unknown") return "\u672a\u5b9a\uff08\u65b9\uff1a" + display + "\uff09";
    return inferredXuShi === "xu" ? "\u865b" : "\u5be6";
  }

  function prioritizeExplicitSymptomMatches(items, hasExplicitSymptoms) {
    if (!hasExplicitSymptoms) return items;
    return [...items].sort((a, b) => {
      const aHas = a.matchedCount > 0 ? 1 : 0;
      const bHas = b.matchedCount > 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return b.totalScore - a.totalScore;
    });
  }

  function recommend({
    formulas = [],
    checkedSymptomLabels = [],
    syndromeScores = {},
    organScores = {},
    constitutionFilter = "all",
    searchText = "",
    caseKeywords = [],
  } = {}) {
    const matcher = getMatcher();
    const rawSearchKeywords = String(searchText || "")
      .split(/[，、,;；\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    // X4's own ontology-based normalizer resolves aliases (e.g. 腰膝冷/全身冷 -> S-COLD);
    // it must see the raw terms directly. The old engine's Normalizer collapses many
    // distinct symptoms into ~20 coarse buckets (e.g. 眩暈/浮腫 -> "水滯") which is useful
    // for the legacy xu/shi vector heuristic below, but would destroy real symptom
    // signal if used to build the X4 query itself.
    const rawTerms = [...new Set([...rawSearchKeywords, ...caseKeywords, ...checkedSymptomLabels])];

    const legacyKeywords = window.KampoEngine.Normalizer.normalizeKeywords(rawTerms);
    const patientVector = window.KampoEngine.VectorBuilder.buildPatientVector({
      keywords: legacyKeywords,
      syndromeScores,
      organScores,
      checkedSymptomLabels,
    });
    const inferredXuShi = deriveXuShi(patientVector.xuShi);

    if (!rawTerms.length) return [];

    // Rank the FULL X4 KB (181 formulas incl. the 2026-07-11 book expansion),
    // not just the UI display list's length — the final output slices to 5
    // anyway, and a short pool silently hides valid mid-rank formulas.
    const x4Results = matcher.recommend({ symptoms: rawTerms, xuShi: "unknown" }, { limit: 500 });
    const displayByName = new Map(formulas.map((formula) => [formula.name, formula]));

    const hasExplicitSymptoms = rawTerms.length > 0;
    const rankedResults = x4Results
      .filter((result) => constitutionFilter === "all" || result.formula.xushiClass === constitutionFilter)
      .map((result) => {
        const display = displayByName.get(result.formula.name) || {};
        const matchedCanonical = result.explanation.matchedSymptoms.map((item) => item.canonical);
        const unmatchedCanonical = result.explanation.unmatchedKeySymptoms.map((item) => item.canonical);
        const unmatchedCount = unmatchedCanonical.length;
        const herbSuggestions = getHerbSuggestions(result.formula.id, result.explanation.patientResidualSymptoms);
        return {
          ...display,
          name: result.formula.name,
          type: result.formula.xushiClass,
          totalScore: Math.round(Math.max(0, Math.min(1, result.score.total)) * 100),
          matchedCount: matchedCanonical.length,
          matchedSymptoms: matchedCanonical,
          matchRate: matchedCanonical.length / Math.max(1, matchedCanonical.length + unmatchedCount),
          herbSuggestions,
          // Same 6 pattern IDs (QI_XU/QI_NI/QI_YU/XUE_XU/YU_XUE/SUI_ZHI) on both
          // sides, straight from the matcher, for the 六證 radar chart.
          patternVectors: {
            patient: result.explanation.patientPatternVector,
            formula: result.formula.patternVector,
          },
          scoreParts: {
            patternSimilarity: result.score.pattern,
            // X4 treats xu/shi as a hard gate (incompatible formulas are already
            // filtered out), not a similarity score; expose a label instead of a
            // fake percentage.
            xuShiLabel: buildXushiLabel(inferredXuShi, result.formula.xushiClass),
            zangFuSimilarity: result.score.zangFu,
            symptomMatch: result.score.key,
          },
          isVectorOnlySupplement: hasExplicitSymptoms && matchedCanonical.length === 0,
          explanation: {
            patterns: [],
            xuShi: [buildXushiExplanation(inferredXuShi, result.formula.xushiClass)],
            zangFu: [],
            matchedSymptoms: matchedCanonical,
            specialHits: [],
            contraindicationHits: [],
            reason: buildRecommendationReason(result, matchedCanonical, unmatchedCanonical),
          },
        };
      });

    return prioritizeExplicitSymptomMatches(rankedResults, hasExplicitSymptoms).slice(0, 5);
  }

  return { recommend, isAvailable };
})();
