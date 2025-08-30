import express from 'express';
import multer from 'multer';
import { basicRedactText } from '@privylens/redaction-text';
import { redactImageBuffer } from '@privylens/redaction-image';
import { pipeline } from '@xenova/transformers';

/**
 * -----------------------------------------------------
 * Utility: File Upload Config
 * -----------------------------------------------------
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
 * Converts BIO scheme tags (B-PER, I-LOC, etc.) 
 * into human-readable labels (NAME, LOCATION, etc.)
 * -----------------------------------------------------
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
      return base; // fallback
  }
}

/**
 * -----------------------------------------------------
 * Express Router
 * -----------------------------------------------------
 */
export const redactRouter: express.Router = express.Router();

/**
 * -----------------------------------------------------
 * NER Pipeline Loader
 * Lazy-loads Xenova’s bert-base-NER model.
 * Ensures model is loaded only once at runtime.
 * -----------------------------------------------------
 */
let ner: any;
async function getNER() {
  if (!ner) {
    ner = await pipeline("token-classification", "Xenova/bert-base-NER");
  }
  return ner;
}

/**
 * -----------------------------------------------------
 * Helper: Redact by Offsets
 * Replaces spans in text with [ENTITY] placeholders 
 * based on start/end positions.
 * -----------------------------------------------------
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
 * Returns all start/end offsets of a given word in text.
 * -----------------------------------------------------
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
 * Helper: Assign Offsets
 * Sequentially assigns character offsets to NER results 
 * when start/end are not provided by the model.
 * -----------------------------------------------------
 */
function assignOffsets(text: string, entities: any[]) {
  let searchIndex = 0;
  return entities.map((ent: any) => {
    const start = text.indexOf(ent.word, searchIndex);
    const end = start + ent.word.length;
    searchIndex = end;
    return {
      entity: ent.entity,
      value: ent.word,
      start,
      end,
    };
  });
}

/**
 * -----------------------------------------------------
 * Route: POST /text
 * Applies both NER-based redaction (names, orgs, locations) 
 * and structured redaction (emails, phones, etc.).
 * Returns masked text and span metadata.
 * -----------------------------------------------------
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

    // Assign offsets for relevant entities
    const nerSpans = assignOffsets(
      text,
      entities.filter((ent: any) => ["B-PER", "B-LOC", "B-ORG"].includes(ent.entity))
    );

    // Apply NER-based redaction
    const nerMasked = redactByOffsets(text, nerSpans);

    // Apply structured PII redaction on top
    const { masked: piiMasked, spans: piiSpans } = basicRedactText(nerMasked, policy ?? {});

    // Merge spans
    const allSpans = [...piiSpans, ...nerSpans];

    return res.json({ masked: piiMasked, spans: allSpans });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * -----------------------------------------------------
 * Route: POST /image
 * Redacts sensitive content in uploaded images.
 * Uses Privylens image redactor.
 * -----------------------------------------------------
 */
redactRouter.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const out = await redactImageBuffer(req.file.buffer);
    res.setHeader('Content-Type', 'image/png');
    return res.send(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
});