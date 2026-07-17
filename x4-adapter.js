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

  // 六經路線理由行 (2026-07-12): when a formula's final score came from the
  // channel route (score.routeTaken === "六經"), the card must say so — the
  // 氣血水 percentages shown alongside did NOT decide its rank, and without
  // this line the recommendation looks unexplained (e.g. 葛根湯 first with
  // 六證 0%). The patient-side evidence ids that opened the channel gate
  // (explanation.patientChannelEvidence[channel].signs) are resolved to
  // canonical names via the ontology so the line cites what the patient
  // actually reported.
  let canonicalByIdCache = null;
  function canonicalById(id) {
    if (!canonicalByIdCache) {
      canonicalByIdCache = new Map(
        (window.X4KbData?.ontology || []).map((entry) => [entry.id, entry.canonical]),
      );
    }
    return canonicalByIdCache.get(id) || null;
  }

  function buildChannelRouteText(result) {
    if (result.score.routeTaken !== "六經") return null;
    const matched = result.explanation.matchedChannels || [];
    if (!matched.length) return null;
    const evidence = result.explanation.patientChannelEvidence || {};
    const channelNames = matched.map((item) => item.channel);
    const signLabels = [...new Set(
      channelNames
        .flatMap((channel) => evidence[channel]?.signs || [])
        .map(canonicalById)
        .filter(Boolean),
    )];
    // 「太陽病期相符（病人證據：惡寒、發熱）」
    const evidencePart = signLabels.length
      ? "（病人證據：" + signLabels.join("、") + "）"
      : "";
    return channelNames.join("、") + "病期相符" + evidencePart;
  }

  // 熱證路線 (2026-07-12, physician direction 2): same card treatment as the
  // channel route — when the heat route carried the rank, say so and cite the
  // patient's heat signs (canonical names via the ontology).
  function buildHeatRouteText(result) {
    if (result.score.routeTaken !== "熱證") return null;
    const heat = result.explanation.matchedHeat;
    if (!heat) return null;
    const signLabels = [...new Set((heat.signs || []).map(canonicalById).filter(Boolean))];
    const evidencePart = signLabels.length
      ? "（病人證據：" + signLabels.join("、") + "）"
      : "";
    return "熱證相符" + evidencePart;
  }

  // 主訴加分 (2026-07-13): when the chief bonus lifted this card, say which
  // of the patient's specific chief symptoms this formula covers.
  function buildChiefMatchText(result) {
    if (!result.score.chiefBonus || !result.explanation.matchedChief) return null;
    const signs = result.explanation.matchedChief.signs || [];
    return signs.length ? "本方涵蓋病人的特異主訴（" + signs.join("、") + "）" : null;
  }

  // 主證加分 (2026-07-16): when the cardinal bonus lifted this card, say which
  // book-declared cardinal sign (the formula's own 型 type-declaration in
  // 漢方臨床診療學, e.g. 大柴胡湯「胸脅苦滿型」) the patient actually has. Only
  // ~44 formulas carry a cardinal flag at all (see cardinalSignOf() in
  // scripts/handbook_bridge.mjs) — most cards simply omit this line.
  function buildCardinalMatchText(result) {
    if (!result.score.cardinalBonus) return null;
    const cardinalKey = (result.formula.keySymptoms || []).find((item) => item.cardinal);
    if (!cardinalKey) return null;
    const label = canonicalById(cardinalKey.id) || cardinalKey.raw;
    return label ? "本方書載主證為「" + label + "」，病人身上有這個徵象" : null;
  }

  // 加味建議 (2026-07-13): the matcher's explanation.addonSuggestions lists
  // single-herb preparations whose book indications cover this card's residual
  // (unexplained) patient symptoms. Pure annotation — never affects ranking.
  function buildAddonSuggestionTexts(result) {
    const items = result.explanation.addonSuggestions || [];
    return items.map((item) =>
      "可考慮加味：" + item.name + "（書 p." + item.page + "——病人尚有 "
      + item.matchedResiduals.join("、") + " 未被本方涵蓋）");
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

  function buildRecommendationReason(result, matchedCanonical, unmatchedCanonical, channelRouteText, heatRouteText) {
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
    if (channelRouteText) {
      // The channel route won the max(): the \u516d\u8b49/\u4e94\u81df percentages above did
      // not decide this rank, and the generic composite-ranking sentence
      // would misattribute it.
      parts.push("\u672c\u65b9\u7531\u516d\u7d93\u8fa8\u8b49\u8def\u7dda\u63a8\u85a6\uff1a" + channelRouteText + "\uff0c\u4e26\u4f9d\u4e3b\u75c7\u8b49\u64da\u5728\u540c\u75c5\u671f\u65b9\u5291\u9593\u6392\u5e8f");
    } else if (heatRouteText) {
      parts.push("\u672c\u65b9\u7531\u71b1\u8b49\u8def\u7dda\u63a8\u85a6\uff1a" + heatRouteText + "\uff0c\u4e26\u4f9d\u4e3b\u75c7\u8b49\u64da\u5728\u6e05\u71b1\u65b9\u5291\u9593\u6392\u5e8f");
    } else {
      parts.push("\u6392\u5e8f\u6703\u7d9c\u5408\u95dc\u9375\u75c7\u72c0\u3001\u516d\u8b49\u3001\u4e94\u81df\uff1b\u55ae\u4e00\u5171\u6709\u75c7\u72c0\u4e0d\u6703\u55ae\u7368\u6c7a\u5b9a\u540d\u6b21");
    }
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
    negatedCaseKeywords = [],
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
    // negatedSymptoms: 病人明確否定的徵象（「大便正常」→ 便秘），matcher 對以之
    // 為主症的方計矛盾扣分（PATIENT_NEGATION_WEIGHT）。空陣列時逐位元不變。
    const x4Results = matcher.recommend({ symptoms: rawTerms, negatedSymptoms: Array.isArray(negatedCaseKeywords) ? negatedCaseKeywords : [], xuShi: "unknown" }, { limit: 500 });
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
        // 書證另證 (2026-07-11): patient symptoms the book attests for this
        // formula beyond its curated key symptoms — they earned score.bookBonus,
        // so the card must show the page-cited evidence behind that bonus.
        const bookHits = (result.explanation.matchedBookSymptoms || [])
          .map((hit) => hit.canonical + (hit.page ? "（p." + hit.page + "）" : ""));
        const channelRouteText = buildChannelRouteText(result);
        const heatRouteText = buildHeatRouteText(result);
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
            bookHits,
            channelRoute: channelRouteText,
            heatRoute: heatRouteText,
            chiefMatch: buildChiefMatchText(result),
            cardinalMatch: buildCardinalMatchText(result),
            addonSuggestions: buildAddonSuggestionTexts(result),
            reason: buildRecommendationReason(result, matchedCanonical, unmatchedCanonical, channelRouteText, heatRouteText),
          },
        };
      });

    return prioritizeExplicitSymptomMatches(rankedResults, hasExplicitSymptoms).slice(0, 5);
  }

  return { recommend, isAvailable };
})();
