import express from 'express';
import multer from 'multer';
import { basicRedactText } from '@privylens/redaction-text';
import { redactImageBuffer } from '@privylens/redaction-image';
import { pipeline } from '@xenova/transformers';

/**
 * -----------------------------------------------------
 * Utility: File Upload Config
 * -----------------------------------------------------
 * Configures multer for handling file uploads with limits.
 */
const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB max file size
    files: 1,
  },
});

/**
 * -----------------------------------------------------
 * Utility: Normalize Entity Tag
 * -----------------------------------------------------
 * Converts BIO scheme tags (B-PER, I-LOC, etc.)
 * into human-readable labels for consistent masking.
 *
 * @param tag - The raw BIO entity tag (e.g. "B-PER", "I-LOC")
 * @returns The normalized label string
 */
function normalizeEntityTag(tag: string): string {
  const base = tag.replace(/^B-/, "").replace(/^I-/, "");
  switch (base) {
    case "PER":
      return "NAME";
    case "LOC":
      return "LOCATION";
    case "ORG":
      return "ORGANIZATION";
    case "MISC":
      return "MISCELLANEOUS";
    default:
      return base; // fallback for unknown tags
  }
}

/**
 * -----------------------------------------------------
 * Express Router
 * -----------------------------------------------------
 * Main router for redaction API routes.
 */
export const redactRouter: express.Router = express.Router();

/**
 * -----------------------------------------------------
 * NER Pipeline Loader
 * -----------------------------------------------------
 * Lazy-loads multiple NER models for enhanced entity detection.
 * Uses BERT, RoBERTa, and DialoGPT models for comprehensive coverage.
 *
 * @returns Object containing multiple NER model instances
 */
let ner: any;
async function getNER() {
  if (!ner) {
    ner = await pipeline("ner", "Xenova/bert-base-NER");
  }
  return ner;
}

/**
 * -----------------------------------------------------
 * Helper: Redact by Offsets
 * -----------------------------------------------------
 * Redacts spans from text based on start/end offsets
 * and replaces them with placeholders.
 *
 * @param text - The input string to redact
 * @param entities - Array of entities with start/end offsets
 * @returns Redacted string with placeholders
 */
function redactByOffsets(text: string, entities: any[]) {
  let result = "";
  let lastIndex = 0;

  const sorted = entities.sort((a: any, b: any) => a.start - b.start);

  for (const ent of sorted) {
    result += text.slice(lastIndex, ent.start);
    result += `[${normalizeEntityTag(ent.entity)}]`;
    lastIndex = ent.end;
  }

  result += text.slice(lastIndex);
  return result;
}

/**
 * -----------------------------------------------------
 * Helper: Find All Indexes of Word
 * -----------------------------------------------------
 * Returns all start and end offsets of a given word in text.
 *
 * @param sentence - Input sentence
 * @param word - Target word to find
 * @returns Array of objects with { start, end }
 */
function indexesOfWord(sentence: string, word: string): { start: number; end: number }[] {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedWord}\\b`, "gi"); // global + case-insensitive
  const results: { start: number; end: number }[] = [];
  let match;

  while ((match = regex.exec(sentence)) !== null) {
    results.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * -----------------------------------------------------
 * Helper: Aggregate Subwords
 * -----------------------------------------------------
 * Merges subword tokens (e.g., "Man" + "##ish") into full
 * words and assigns character offsets using regex search.
 *
 * @param text - The original input string
 * @param entities - Raw NER model output tokens
 * @returns Array of merged entities with offsets
 */
function aggregateSubwords(text: string, entities: any[]) {
  const merged: any[] = [];

  for (const ent of entities) {
    const label = ent.entity.replace(/^B-/, "").replace(/^I-/, "");

    if (ent.word.startsWith("##") && merged.length > 0) {
      // Append to previous entity
      const prev = merged[merged.length - 1];
      prev.word += ent.word.replace("##", "");
      prev.score = Math.max(prev.score, ent.score);
    } else {
      // Start a new entity
      merged.push({
        entity_group: label,
        word: ent.word.replace("##", ""),
        score: ent.score,
      });
    }
  }

  // Assign offsets for each merged entity
  const withOffsets: any[] = [];
  for (const ent of merged) {
    const occurrences = indexesOfWord(text, ent.word);
    for (const occ of occurrences) {
      withOffsets.push({
        ...ent,
        start: occ.start,
        end: occ.end,
      });
    }
  }

  return withOffsets;
}

/**
 * -----------------------------------------------------
 * Helper: Merge Consecutive Entities
 * -----------------------------------------------------
 * Merges consecutive entities of the same type that are
 * adjacent to each other (e.g., "Jurong West Street").
 *
 * @param entities - Array of entities with offsets
 * @returns Array of merged entities
 */
function mergeConsecutiveEntities(entities: any[]) {
  if (entities.length === 0) return entities;

  // Sort by start position
  const sorted = entities.sort((a: any, b: any) => a.start - b.start);
  const merged: any[] = [];

  for (const entity of sorted) {
    const lastMerged = merged[merged.length - 1];

    // Check if this entity can be merged with the previous one
    if (
      lastMerged &&
      lastMerged.entity_group === entity.entity_group &&
      // Check if they are adjacent (allowing for spaces between words)
      lastMerged.end >= entity.start - 2 // Allow up to 2 characters gap (space + potential punctuation)
    ) {
      // Merge the entities
      lastMerged.end = entity.end;
      lastMerged.word = lastMerged.word + " " + entity.word;
      lastMerged.score = Math.max(lastMerged.score, entity.score);
    } else {
      // Add as new entity
      merged.push({ ...entity });
    }
  }

  return merged;
}

/**
 * -----------------------------------------------------
 * Route: POST /text
 * -----------------------------------------------------
 * Redacts sensitive text by combining:
 * 1. NER-based redaction (names, orgs, locations)
 * 2. Regex-based structured redaction (emails, phones, etc.)
 *
 * @returns JSON object with masked text and span metadata
 */
redactRouter.post('/text', express.json(), async (req, res) => {
  try {
    const { text, policy } = req.body ?? {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid body: text required' });
    }

    // Run NER
    const nermodel = await getNER();
    const entities = await nermodel(text, { aggregation_strategy: "simple" });

    // Aggregate subwords + assign offsets
    const mergedEntities = aggregateSubwords(text, entities);

    // Merge consecutive entities of the same type
    const consecutiveMerged = mergeConsecutiveEntities(mergedEntities);

    // Filter for relevant entity groups
    const nerSpans = consecutiveMerged
      .filter((ent: any) => ["PER", "LOC", "ORG"].includes(ent.entity_group))
      .map((ent: any) => ({
        entity: ent.entity_group,
        value: ent.word,
        start: ent.start,
        end: ent.end,
      }));

    // Apply NER-based redaction
    const nerMasked = redactByOffsets(text, nerSpans);

    // Apply structured redaction
    const { masked: piiMasked, spans: piiSpans } = basicRedactText(nerMasked, policy ?? {});

    // Merge spans (NER + structured)
    const allSpans = [...nerSpans, ...piiSpans];

    return res.json({ masked: piiMasked, spans: allSpans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------------------------------
 * Route: POST /image
 * -----------------------------------------------------
 * Redacts sensitive information in uploaded images.
 * Uses Privylens image redactor.
 *
 * @returns PNG image buffer of redacted content
 */
redactRouter.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const out = await redactImageBuffer(req.file.buffer);
    res.setHeader('Content-Type', 'image/png');
    return res.send(out);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process image' });
  }
});