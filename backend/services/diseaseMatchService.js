/**
 * Disease matching service.
 *
 * Bridges the AI provider (which answers with a species name such as
 * "Solanum lycopersicum" and a disease suggestion such as "Phytophthora") and
 * the MongoDB knowledge base (organised by crop name such as "Tomato").
 *
 * Only the TOP-1 suggestion is allowed to name the result. A lower-ranked
 * alternative must never rename the diagnosis, because the stored confidence
 * belongs to the top-1 suggestion: pairing a rank-2 name with a rank-1 score
 * would invent a number nobody measured.
 *
 * Matching order for that top-1 suggestion:
 *   1. crop + disease name (case/whitespace insensitive)
 *   2. crop + partial disease name ("leaf blight" vs "leaf blight (isariopsis…)")
 *   3. crop + pathogenType -- Plant.id answers with the causal organism
 *      ("Phytophthora", "Begomovirus", "Septoria") and every catalogue record
 *      stores the same organism in `pathogenType`, so this is a real
 *      taxonomic match rather than a guess
 *   4. normalised `mlLabels` match (the PlantVillage style label stored on the
 *      record, so a renamed disease can still be found)
 *   5. disease name alone -- only when it is unique, so "Black rot" can never
 *      silently resolve to the wrong crop
 *   6. no match -> the prediction is still saved, but the UI shows a
 *      "no remedy record yet" notice. A missing record never crashes a scan.
 */

const Disease = require('../models/Disease');

/** Short generic words ("fungi") are not specific enough to pick a record. */
const MIN_TARGET_LENGTH = 4;

/** "Early Blight" / "early blight" / "Early_blight" -> "early blight" */
function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Same normalisation but without spaces, for comparing "Tomato___Early_blight". */
function normaliseLabel(value) {
  return normalise(value).replace(/\s+/g, '');
}

/**
 * Finds the Disease document that corresponds to the top-1 Plant.id suggestion.
 * @param {{ plant: string, disease: string, topPredictions?: Array }} prediction
 * @returns {Promise<import('mongoose').Document|null>}
 */
async function findDiseaseForPrediction(prediction) {
  const { plant, disease } = prediction;
  const target = normalise(disease);
  if (target.length < MIN_TARGET_LENGTH) return null;

  // 1 + 2 + 3. Compare within the detected crop first.
  if (plant) {
    const candidates = await Disease.find({ plantName: plant }).exec();

    const exact = candidates.find((item) => normalise(item.diseaseName) === target);
    if (exact) return exact;

    const partial = candidates.find((item) => {
      const candidate = normalise(item.diseaseName);
      return candidate.includes(target) || target.includes(candidate);
    });
    if (partial) return partial;

    // 3. Causal organism: "Phytophthora" -> the record whose pathogenType
    //    reads "Oomycete (phytophthora) pathogen".
    const byPathogen = candidates.filter(
      (item) => item.pathogenType && normalise(item.pathogenType).includes(target)
    );
    if (byPathogen.length === 1) return byPathogen[0];
  }

  // 4. Label mapping: "Tomato___Early blight" normalises to the same string as
  //    the stored label "Tomato___Early_blight". Built from the top-1
  //    suggestion only, for the same reason as above.
  const labelCandidates = [`${plant}___${disease}`].filter((value) => value && !value.startsWith('undefined'));
  const wanted = labelCandidates.map(normaliseLabel).filter(Boolean);
  if (wanted.length) {
    const byLabel = await Disease.find({ mlLabels: { $in: labelCandidates } }).exec();
    const match = byLabel.find((item) =>
      (item.mlLabels || []).some((label) => wanted.includes(normaliseLabel(label)))
    );
    if (match) return match;
  }

  const GENERIC_WORDS = ['fungi', 'fungus', 'bacteria', 'bacterium', 'virus', 'pest', 'disease', 'unknown'];
  if (GENERIC_WORDS.includes(target)) return null;

  // 3b. Same organism match across catalogue:
  const globalPathogen = await Disease.find({
    pathogenType: new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  }).exec();
  if (globalPathogen.length >= 1) return globalPathogen[0];

  // 5. Disease name without the crop:
  const duplicates = await Disease.find({
    diseaseName: new RegExp(`^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).exec();
  if (duplicates.length >= 1) return duplicates[0];

  return null;
}

/**
 * Picks the remedy record for a prediction.
 * Top-1 suggestion only, adhering to the honest confidence contract.
 *
 * @param {{ plant: string, disease: string, topPredictions?: Array }} prediction
 */
async function findBestDiseaseMatch(prediction) {
  return findDiseaseForPrediction(prediction);
}

/** True when the AI provider says the leaf looks healthy. */
function isHealthyPrediction(prediction) {
  if (typeof prediction.isHealthy === 'boolean') return prediction.isHealthy;
  return /healthy/i.test(prediction.disease) || /healthy/i.test(prediction.class_name || '');
}

/** Human readable message shown when no remedy record exists. */
const NO_RECORD_MESSAGE =
  'No remedy record is stored in the database for this detection yet. ' +
  'Please contact an administrator to add the treatment details for this disease.';

module.exports = {
  findDiseaseForPrediction,
  findBestDiseaseMatch,
  isHealthyPrediction,
  normalise,
  NO_RECORD_MESSAGE,
};
