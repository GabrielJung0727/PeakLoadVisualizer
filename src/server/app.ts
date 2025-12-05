import express from 'express';
import path from 'path';
import cors from 'cors';
import { collectMetrics, LoadLevel, MetricSnapshot, recordRequest } from './metrics';

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(process.cwd(), 'public');
const clientDir = path.join(process.cwd(), 'src/client');

let currentLoad: LoadLevel = 'low';

interface LeaderboardEntry {
  ip: string;
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

function getClientIp(req: express.Request) {
  const forwarded = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const ip = forwarded || req.ip || '';
  return ip.replace(/^::ffff:/, '') || 'unknown';
}

function makeDefaultName(ip: string) {
  const tail = ip.split('.').pop() ?? 'xx';
  return `Student-${tail.padStart(2, '0')}`;
}

function ensureEntry(ip: string): LeaderboardEntry {
  const existing = leaderboard.get(ip);
  if (existing) return existing;
  const fresh: LeaderboardEntry = {
    ip,
    name: makeDefaultName(ip),
    peakRps: 0,
    bestLatency: Number.MAX_SAFE_INTEGER,
    bestErrorRate: Number.MAX_SAFE_INTEGER,
    stabilityScore: 100,
    serverState: 'Unknown',
    level: currentLoad,
    updatedAt: Date.now()
  };
  leaderboard.set(ip, fresh);
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

function updateLeaderboard(ip: string, snapshot: MetricSnapshot) {
  const entry = ensureEntry(ip);
  entry.peakRps = Math.max(entry.peakRps, snapshot.rps);
  entry.bestLatency = Math.min(entry.bestLatency, snapshot.responseTimeMs);
  entry.bestErrorRate = Math.min(entry.bestErrorRate, snapshot.errorRate);
  entry.serverState = computeServerState(snapshot);
  entry.stabilityScore = Math.max(entry.stabilityScore, computeStability(snapshot));
  entry.level = snapshot.level;
  entry.updatedAt = snapshot.timestamp;
  leaderboard.set(ip, entry);
  return entry;
}

app.use(cors());
app.use(express.json());
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

app.get('/api/identity', (req, res) => {
  const ip = getClientIp(req);
  const entry = ensureEntry(ip);
  res.json({ ip: entry.ip, name: entry.name });
});

app.post('/api/identity', (req, res) => {
  const ip = getClientIp(req);
  const rawName = (req.body?.name ?? '').toString().trim();
  if (!rawName || rawName.length < 2) {
    return res.status(400).json({ error: '닉네임은 최소 2자 이상이어야 합니다.' });
  }
  const name = rawName.slice(0, 32);
  const entry = ensureEntry(ip);
  entry.name = name;
  entry.updatedAt = Date.now();
  leaderboard.set(ip, entry);
  res.json({ ok: true, entry });
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
  updateLeaderboard(getClientIp(req), snapshot);
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

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Load demo server running on http://localhost:${port}`);
});
