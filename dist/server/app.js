"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const metrics_1 = require("./metrics");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
const publicDir = path_1.default.join(process.cwd(), 'public');
const clientDir = path_1.default.join(process.cwd(), 'src/client');
let currentLoad = 'low';
const leaderboard = new Map();
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
function getClientIp(req) {
    var _a, _b;
    const forwarded = (_b = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim();
    const ip = forwarded || req.ip || '';
    return ip.replace(/^::ffff:/, '') || 'unknown';
}
function makeDefaultName(ip) {
    var _a;
    const tail = (_a = ip.split('.').pop()) !== null && _a !== void 0 ? _a : 'xx';
    return `Student-${tail.padStart(2, '0')}`;
}
function ensureEntry(ip) {
    const existing = leaderboard.get(ip);
    if (existing)
        return existing;
    const fresh = {
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
function computeServerState(snapshot) {
    if (snapshot.errorRate >= 5)
        return 'Unstable';
    if (snapshot.errorRate >= 1.5 || snapshot.responseTimeMs >= 400)
        return 'Minor Errors';
    return 'Stable';
}
function computeStability(snapshot) {
    const penalty = snapshot.errorRate * 10 + Math.max(snapshot.responseTimeMs - 120, 0) / 6 + Math.max(snapshot.cpu - 75, 0) / 2.5;
    return clamp(Math.round(100 - penalty), 0, 100);
}
function updateLeaderboard(ip, snapshot) {
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
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const skipPaths = ['/api/metrics', '/api/health'];
        if (skipPaths.some((prefix) => req.path.startsWith(prefix)))
            return;
        const durationMs = Number(process.hrtime.bigint() - start) / 1000000;
        (0, metrics_1.recordRequest)(durationMs, res.statusCode);
    });
    next();
});
app.use(express_1.default.static(publicDir));
app.use(express_1.default.static(clientDir));
app.get('/api/identity', (req, res) => {
    const ip = getClientIp(req);
    const entry = ensureEntry(ip);
    res.json({ ip: entry.ip, name: entry.name });
});
app.post('/api/identity', (req, res) => {
    var _a, _b;
    const ip = getClientIp(req);
    try {
        const rawName = ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '').toString().trim();
        if (!rawName || rawName.length < 2) {
            return res
                .status(400)
                .json({ error: '닉네임은 최소 2자 이상이어야 합니다. (Name must be at least 2 characters.)' });
        }
        const name = rawName.slice(0, 32);
        const entry = ensureEntry(ip);
        entry.name = name;
        entry.updatedAt = Date.now();
        leaderboard.set(ip, entry);
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
    const snapshot = await (0, metrics_1.collectMetrics)(currentLoad);
    updateLeaderboard(getClientIp(req), snapshot);
    res.json(snapshot);
});
app.post('/api/load/:level', (req, res) => {
    const level = req.params.level;
    const allowed = ['low', 'normal', 'peak'];
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
    res.sendFile(path_1.default.join(clientDir, 'index.html'));
});
app.listen(port, () => {
    console.log(`Load demo server running on http://localhost:${port}`);
});
