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

  // formulas.json key symptoms can be negated (e.g. 無口渴 -> S-THIRST negated:true,
  // meaning the formula wants that symptom ABSENT). If such a key symptom is
  // "unmatched", that only means the case never confirmed/denied it - not that
  // the patient has it - so it must never be fed to modifierDirection, which
  // would otherwise suggest an herb that treats the very symptom the formula
  // wants the patient to not have.
  function getHerbSuggestions(formulaId, unmatchedKeySymptoms) {
    const engine = getPhase1Engine();
    if (!engine) return [];
    const residualSymptomIds = unmatchedKeySymptoms
      .filter((symptom) => !symptom.negated)
      .map((symptom) => symptom.id);
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
    const xuShi = deriveXuShi(patientVector.xuShi);

    if (!rawTerms.length) return [];

    const x4Results = matcher.recommend({ symptoms: rawTerms, xuShi }, { limit: formulas.length || 50 });
    const displayByName = new Map(formulas.map((formula) => [formula.name, formula]));

    return x4Results
      .filter((result) => constitutionFilter === "all" || result.formula.xushiClass === constitutionFilter)
      .map((result) => {
        const display = displayByName.get(result.formula.name) || {};
        const matchedCanonical = result.explanation.matchedSymptoms.map((item) => item.canonical);
        const unmatchedCount = result.explanation.unmatchedKeySymptoms.length;
        const herbSuggestions = getHerbSuggestions(result.formula.id, result.explanation.unmatchedKeySymptoms);
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
            xuShiLabel:
              xuShi === "unknown"
                ? "未定"
                : result.formula.xushiClass === "虛實夾雜" || result.formula.xushiClass === "未分類"
                  ? "可用"
                  : "相符",
            zangFuSimilarity: result.score.zangFu,
            symptomMatch: result.score.key,
          },
          explanation: {
            patterns: [],
            xuShi: [xuShi === "unknown" ? "未定" : xuShi === "xu" ? "虛" : "實"],
            zangFu: [],
            matchedSymptoms: matchedCanonical,
            specialHits: [],
            contraindicationHits: [],
            reason:
              "X4 matcher：關鍵症狀 " +
              Math.round(result.score.key * 100) +
              "% / 六證 " +
              Math.round(result.score.pattern * 100) +
              "% / 五臟 " +
              Math.round(result.score.zangFu * 100) +
              "%，命中 " +
              matchedCanonical.length +
              " 項關鍵症狀。",
          },
        };
      })
      .slice(0, 5);
  }

  return { recommend, isAvailable };
})();
