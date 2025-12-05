import express from 'express';
import path from 'path';
import cors from 'cors';
import { collectMetrics, LoadLevel, MetricSnapshot, recordRequest } from './metrics';

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(process.cwd(), 'public');
const clientDir = path.join(process.cwd(), 'src/client');
const docsFile = path.join(clientDir, 'docs.html');

let currentLoad: LoadLevel = 'low';

interface LeaderboardEntry {
  name: string;
  peakRps: number;
  bestLatency: number;
  bestErrorRate: number;
  stabilityScore: number;
  serverState: string;
  level: LoadLevel;
  updatedAt: number;
}

const leaderboard = new Map<string, LeaderboardEntry>();

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const DEFAULT_NAME = 'Guest';

function ensureEntry(name: string): LeaderboardEntry {
  const key = name || DEFAULT_NAME;
  const existing = leaderboard.get(key);
  if (existing) return existing;
  const fresh: LeaderboardEntry = {
    name: key,
    peakRps: 0,
    bestLatency: Number.MAX_SAFE_INTEGER,
    bestErrorRate: Number.MAX_SAFE_INTEGER,
    stabilityScore: 100,
    serverState: 'Unknown',
    level: currentLoad,
    updatedAt: Date.now()
  };
  leaderboard.set(key, fresh);
  return fresh;
}

function computeServerState(snapshot: MetricSnapshot) {
  if (snapshot.errorRate >= 5) return 'Unstable';
  if (snapshot.errorRate >= 1.5 || snapshot.responseTimeMs >= 400) return 'Minor Errors';
  return 'Stable';
}

function computeStability(snapshot: MetricSnapshot) {
  const penalty = snapshot.errorRate * 10 + Math.max(snapshot.responseTimeMs - 120, 0) / 6 + Math.max(snapshot.cpu - 75, 0) / 2.5;
  return clamp(Math.round(100 - penalty), 0, 100);
}

function updateLeaderboard(name: string, snapshot: MetricSnapshot) {
  const entry = ensureEntry(name);
  entry.peakRps = Math.max(entry.peakRps, snapshot.rps);
  entry.bestLatency = Math.min(entry.bestLatency, snapshot.responseTimeMs);
  entry.bestErrorRate = Math.min(entry.bestErrorRate, snapshot.errorRate);
  entry.serverState = computeServerState(snapshot);
  entry.stabilityScore = Math.max(entry.stabilityScore, computeStability(snapshot));
  entry.level = snapshot.level;
  entry.updatedAt = snapshot.timestamp;
  leaderboard.set(entry.name, entry);
  return entry;
}

function extractName(req: express.Request) {
  const candidate = (req.query.name || req.headers['x-user-name'] || '').toString().trim();
  if (candidate.length >= 2) return candidate.slice(0, 32);
  return DEFAULT_NAME;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const skipPaths = ['/api/metrics', '/api/health'];
    if (skipPaths.some((prefix) => req.path.startsWith(prefix))) return;
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    recordRequest(durationMs, res.statusCode);
  });
  next();
});
app.use(express.static(publicDir));
app.use(express.static(clientDir));

app.get('/api/identity', (_req, res) => {
  res.json({ name: DEFAULT_NAME });
});

app.post('/api/identity', (req, res) => {
  try {
    const rawName = (req.body?.name ?? '').toString().trim();
    if (!rawName || rawName.length < 2) {
      return res
        .status(400)
        .json({ error: '닉네임은 최소 2자 이상이어야 합니다. (Name must be at least 2 characters.)' });
    }
    const name = rawName.slice(0, 32);
    const entry = ensureEntry(name);
    entry.updatedAt = Date.now();
    leaderboard.set(entry.name, entry);
    res.json({ ok: true, entry });
  } catch (err) {
    console.error('identity error', err);
    res.status(500).json({ error: '닉네임 저장 중 오류가 발생했습니다. (Failed to save nickname.)' });
  }
});

app.get('/api/leaderboard', (_req, res) => {
  const entries = Array.from(leaderboard.values()).sort((a, b) => {
    if (b.peakRps !== a.peakRps) return b.peakRps - a.peakRps;
    if (b.stabilityScore !== a.stabilityScore) return b.stabilityScore - a.stabilityScore;
    return a.bestLatency - b.bestLatency;
  });
  res.json({ entries: entries.slice(0, 50) });
});

app.get('/api/metrics', async (req, res) => {
  const snapshot = await collectMetrics(currentLoad);
  const name = extractName(req);
  updateLeaderboard(name, snapshot);
  res.json(snapshot);
});

app.post('/api/load/:level', (req, res) => {
  const level = req.params.level as LoadLevel;
  const allowed: LoadLevel[] = ['low', 'normal', 'peak'];

  if (!allowed.includes(level)) {
    return res.status(400).json({ error: 'Invalid load level', allowed });
  }

  currentLoad = level;

  res.json({ level: currentLoad });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', level: currentLoad, timestamp: Date.now() });
});

app.get('/docs.html', (_req, res) => {
  res.sendFile(docsFile);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Load demo server running on http://localhost:${port}`);
});
