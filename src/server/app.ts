import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { collectMetrics, MetricSnapshot, recordRequest } from './metrics';
import { loadManager } from './loadManager';
import { LoadLevel } from './types';
import {
  getRecentLogs,
  setStage as setAttackStage,
  startDdos,
  stopDdos,
  subscribeSim,
  triggerBruteforce,
  triggerPortScan,
  triggerSqlInjection
} from './attackSim';

const app = express();
const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
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
  if (snapshot.level === 'overload' || snapshot.errorRate >= 8 || snapshot.responseTimeMs >= 550) return 'Critical';
  if (snapshot.errorRate >= 3.5 || snapshot.responseTimeMs >= 400) return 'Unstable';
  if (snapshot.errorRate >= 1.5 || snapshot.responseTimeMs >= 320) return 'Minor Errors';
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
  const snapshot = await collectMetrics(currentLoad, loadManager.getProfile());
  const name = extractName(req);
  updateLeaderboard(name, snapshot);
  res.json(snapshot);
});

app.post('/api/load/:level', (req, res) => {
  const level = req.params.level as LoadLevel;
  const allowed: LoadLevel[] = ['low', 'normal', 'peak', 'overload'];

  if (!allowed.includes(level)) {
    return res.status(400).json({ error: 'Invalid load level', allowed });
  }

  currentLoad = level;
  loadManager.setLevel(level);

  res.json({ level: currentLoad, profile: loadManager.getProfile() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', level: currentLoad, timestamp: Date.now() });
});

// Attack simulation routes (virtual only)
app.post('/attack/ddos/start', (_req, res) => {
  startDdos();
  setAttackStage(currentLoad);
  res.json({ ok: true });
});
app.post('/attack/ddos/stop', (_req, res) => {
  stopDdos();
  setAttackStage(currentLoad);
  res.json({ ok: true });
});
app.post('/attack/bruteforce/run', (_req, res) => {
  triggerBruteforce();
  setAttackStage(currentLoad);
  res.json({ ok: true });
});
app.post('/attack/portscan/run', (_req, res) => {
  triggerPortScan();
  setAttackStage(currentLoad);
  res.json({ ok: true });
});
app.post('/attack/sqlinj/run', (_req, res) => {
  triggerSqlInjection();
  setAttackStage(currentLoad);
  res.json({ ok: true });
});
app.get('/logs/recent', (_req, res) => {
  res.json({ logs: getRecentLogs() });
});

app.get('/docs.html', (_req, res) => {
  res.sendFile(docsFile);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ kind: 'hello', ts: Date.now() }));
  const unsubscribe = subscribeSim((event) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  });
  socket.on('close', unsubscribe);
});

server.listen(port, () => {
  console.log(`Load demo server running on http://localhost:${port}`);
});
