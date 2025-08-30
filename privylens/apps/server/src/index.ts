import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { redactRouter } from './routes/redact.js';
import { llmRouter } from './routes/llm.js';

const app = express();

// Increase payload size limits for image data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/redact', redactRouter);
app.use('/api/llm', llmRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});


