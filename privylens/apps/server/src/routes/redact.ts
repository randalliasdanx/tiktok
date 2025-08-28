import express from 'express';
import multer from 'multer';
import { basicRedactText } from '@privylens/redaction-text';
import { redactImageBuffer } from '@privylens/redaction-image';

const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 1,
  },
});

export const redactRouter = express.Router();

redactRouter.post('/text', express.json(), (req, res) => {
  const { text, policy } = req.body ?? {};
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid body: text required' });
  }
  const { masked, spans } = basicRedactText(text, policy ?? {});
  // TODO: Hook redaction logs to Supabase (no originals)
  return res.json({ masked, spans });
});

redactRouter.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const out = await redactImageBuffer(req.file.buffer);
    res.setHeader('Content-Type', 'image/png');
    // TODO: Store redacted image in Supabase storage (no originals)
    return res.send(out);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to process image' });
  }
});


