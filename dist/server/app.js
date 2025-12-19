"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const metrics_1 = require("./metrics");
const loadManager_1 = require("./loadManager");
const attackSim_1 = require("./attackSim");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
const server = http_1.default.createServer(app);
const publicDir = path_1.default.join(process.cwd(), 'public');
const clientDir = path_1.default.join(process.cwd(), 'src/client');
const docsFile = path_1.default.join(clientDir, 'docs.html');
let currentLoad = 'low';
app.set('trust proxy', true);
const leaderboard = new Map();
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const DEFAULT_NAME = 'Guest';
function getClientIp(req) {
    var _a;
    const fwd = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',').map((s) => s.trim()).find(Boolean);
    const raw = fwd || req.socket.remoteAddress || '';
    return raw.replace(/^::ffff:/, '') || 'unknown';
}
function ensureEntry(name) {
    const key = name || DEFAULT_NAME;
    const existing = leaderboard.get(key);
    if (existing)
        return existing;
    const fresh = {
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
function computeServerState(snapshot) {
    if (snapshot.level === 'overload' || snapshot.errorRate >= 8 || snapshot.responseTimeMs >= 550)
        return 'Critical';
    if (snapshot.errorRate >= 3.5 || snapshot.responseTimeMs >= 400)
        return 'Unstable';
    if (snapshot.errorRate >= 1.5 || snapshot.responseTimeMs >= 320)
        return 'Minor Errors';
    return 'Stable';
}
function computeStability(snapshot) {
    const penalty = snapshot.errorRate * 10 + Math.max(snapshot.responseTimeMs - 120, 0) / 6 + Math.max(snapshot.cpu - 75, 0) / 2.5;
    return clamp(Math.round(100 - penalty), 0, 100);
}
function updateLeaderboard(name, snapshot) {
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
function extractName(req) {
    const candidate = (req.query.name || req.headers['x-user-name'] || '').toString().trim();
    if (candidate.length >= 2)
        return candidate.slice(0, 64);
    const ip = getClientIp(req);
    return ip ? `IP ${ip}` : DEFAULT_NAME;
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const skipPaths = ['/api/metrics', '/api/health', '/api/whoami'];
        if (skipPaths.some((prefix) => req.path.startsWith(prefix)))
            return;
        const durationMs = Number(process.hrtime.bigint() - start) / 1000000;
        (0, metrics_1.recordRequest)(durationMs, res.statusCode);
    });
    next();
});
app.use(express_1.default.static(publicDir));
app.use(express_1.default.static(clientDir));
app.get('/api/whoami', (req, res) => {
    const ip = getClientIp(req);
    res.json({ ip });
});
app.get('/api/identity', (_req, res) => {
    res.json({ name: DEFAULT_NAME });
});
app.post('/api/identity', (req, res) => {
    var _a, _b;
    try {
        const rawName = ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '').toString().trim();
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
    }
    catch (err) {
        console.error('identity error', err);
        res.status(500).json({ error: '닉네임 저장 중 오류가 발생했습니다. (Failed to save nickname.)' });
    }
});
app.get('/api/leaderboard', (_req, res) => {
    const entries = Array.from(leaderboard.values()).sort((a, b) => {
        if (b.peakRps !== a.peakRps)
            return b.peakRps - a.peakRps;
        if (b.stabilityScore !== a.stabilityScore)
            return b.stabilityScore - a.stabilityScore;
        return a.bestLatency - b.bestLatency;
    });
    res.json({ entries: entries.slice(0, 50) });
});
app.get('/api/metrics', async (req, res) => {
    const snapshot = await (0, metrics_1.collectMetrics)(currentLoad, loadManager_1.loadManager.getProfile());
    const name = extractName(req);
    updateLeaderboard(name, snapshot);
    res.json(snapshot);
});
app.post('/api/load/:level', (req, res) => {
    const level = req.params.level;
    const allowed = ['low', 'normal', 'peak', 'overload'];
    if (!allowed.includes(level)) {
        return res.status(400).json({ error: 'Invalid load level', allowed });
    }
    currentLoad = level;
    loadManager_1.loadManager.setLevel(level);
    res.json({ level: currentLoad, profile: loadManager_1.loadManager.getProfile() });
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', level: currentLoad, timestamp: Date.now() });
});
// Attack simulation routes (virtual only)
app.post('/attack/ddos/start', (_req, res) => {
    (0, attackSim_1.startDdos)();
    (0, attackSim_1.setStage)(currentLoad);
    res.json({ ok: true });
});
app.post('/attack/ddos/stop', (_req, res) => {
    (0, attackSim_1.stopDdos)();
    (0, attackSim_1.setStage)(currentLoad);
    res.json({ ok: true });
});
app.post('/attack/bruteforce/run', (_req, res) => {
    (0, attackSim_1.triggerBruteforce)();
    (0, attackSim_1.setStage)(currentLoad);
    res.json({ ok: true });
});
app.post('/attack/portscan/run', (_req, res) => {
    (0, attackSim_1.triggerPortScan)();
    (0, attackSim_1.setStage)(currentLoad);
    res.json({ ok: true });
});
app.post('/attack/sqlinj/run', (_req, res) => {
    (0, attackSim_1.triggerSqlInjection)();
    (0, attackSim_1.setStage)(currentLoad);
    res.json({ ok: true });
});
app.get('/logs/recent', (_req, res) => {
    res.json({ logs: (0, attackSim_1.getRecentLogs)() });
});
app.get('/docs.html', (_req, res) => {
    res.sendFile(docsFile);
});
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(clientDir, 'index.html'));
});
// WebSocket
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ kind: 'hello', ts: Date.now() }));
    const unsubscribe = (0, attackSim_1.subscribeSim)((event) => {
        if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify(event));
        }
    });
    socket.on('close', unsubscribe);
});
server.listen(port, () => {
    console.log(`Load demo server running on http://localhost:${port}`);
});
