/**
 * Field mapping engine.
 * Suggests canonical field mappings for source columns.
 */
import type { CanonicalFieldMap, ColumnProfile } from "@/types";
import { CANONICAL_FIELDS, SOURCE_COLUMN_ALIASES } from "@/data/canonicalFields";

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[\s_-]+/g, " ");
}

function scoreMatch(sourceCol: string, canonicalName: string, profile: ColumnProfile): number {
  const norm = normalizeColumnName(sourceCol);
  const alias = SOURCE_COLUMN_ALIASES[norm];

  // Exact alias match
  if (alias === canonicalName) return 0.98;

  const canonicalField = CANONICAL_FIELDS.find((f) => f.name === canonicalName);
  if (!canonicalField) return 0;

  let score = 0;

  // Partial name match
  const canonWords = canonicalName.replace(/_/g, " ").split(" ");
  const srcWords = norm.split(" ");
  const overlap = canonWords.filter((w) => srcWords.some((s) => s.includes(w) || w.includes(s)));
  score += (overlap.length / canonWords.length) * 0.5;

  // Type compatibility
  if (canonicalField.expectedTypes.includes(profile.inferredType)) score += 0.2;

  // Role match
  if (canonicalField.detectedRole === profile.detectedRole && profile.detectedRole !== "unknown") {
    score += 0.25;
  }

  return Math.min(score, 0.97);
}

export function suggestMappings(
  datasetId: string,
  profiles: ColumnProfile[]
): CanonicalFieldMap[] {
  return profiles.map((profile) => {
    const norm = normalizeColumnName(profile.sourceColumnName);
    const alias = SOURCE_COLUMN_ALIASES[norm];

    if (alias) {
      return {
        datasetId,
        sourceColumnName: profile.sourceColumnName,
        canonicalFieldName: alias,
        mappingConfidence: 0.97,
        approvedByUser: false,
        transformationLogic: undefined,
      };
    }

    // Score all canonical fields and pick best
    let bestField = "";
    let bestScore = 0;
    for (const cf of CANONICAL_FIELDS) {
      const score = scoreMatch(profile.sourceColumnName, cf.name, profile);
      if (score > bestScore) {
        bestScore = score;
        bestField = cf.name;
      }
    }

    if (bestScore < 0.25) {
      return {
        datasetId,
        sourceColumnName: profile.sourceColumnName,
        canonicalFieldName: "unknown",
        mappingConfidence: 0,
        approvedByUser: false,
      };
    }

    return {
      datasetId,
      sourceColumnName: profile.sourceColumnName,
      canonicalFieldName: bestField,
      mappingConfidence: bestScore,
      approvedByUser: false,
    };
  });
}
