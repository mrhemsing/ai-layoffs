export function evidenceTierOf(aiRelevance) {
  if (["ai_replacement_cited", "explicit_ai_cited"].includes(aiRelevance)) return "strong";
  if (aiRelevance === "speculative_or_unclear") return "weak";
  return "medium";
}
