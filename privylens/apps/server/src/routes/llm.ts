import express from 'express';
import { ensureMasked } from '../utils/policy';

export const llmRouter = express.Router();

llmRouter.post('/proxy', express.json(), async (req, res) => {
  const { masked } = req.body ?? {};
  if (typeof masked !== 'string') {
    return res.status(400).json({ error: 'Invalid body: masked required' });
  }
  if (!ensureMasked(masked)) {
    return res.status(400).json({ error: 'Payload must be masked according to policy' });
  }
  // TODO: Actually call LLM provider with masked input and stream response
  return res.json({ output: masked });
});


