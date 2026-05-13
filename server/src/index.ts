import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { createParishEngine } from './parishEngine.js';

// Ensure the key loads regardless of where the process is started from.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((req, _res, next) => {
  // Basic request log; keep small/no PII
  if (req.path !== '/api/health') {
    // eslint-disable-next-line no-console
    console.log(`[api] ${req.method} ${req.path}`);
  }
  next();
});

app.post('/api/discover', async (req, res) => {
  const schema = z.object({ location: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  try {
    const engine = createParishEngine(GEMINI_API_KEY);
    const leads = await engine.discoverLeads(parsed.data.location);
    res.json({ leads });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message || 'Server error' });
  }
});

app.post('/api/research', async (req, res) => {
  const schema = z.object({
    orgName: z.string().min(1),
    websiteUrl: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  try {
    const engine = createParishEngine(GEMINI_API_KEY);
    const result = await engine.researchLead(parsed.data.orgName, parsed.data.websiteUrl);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message || 'Server error' });
  }
});

app.post('/api/draft', async (req, res) => {
  const schema = z.object({
    orgName: z.string().min(1),
    need: z.string().min(1),
    evidence: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  try {
    const engine = createParishEngine(GEMINI_API_KEY);
    const draft = await engine.generateDraft(parsed.data.orgName, parsed.data.need, parsed.data.evidence);
    res.json(draft);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message || 'Server error' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
});

