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
let lastSnapshot = (0, metrics_1.generateMetrics)(currentLoad);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(publicDir));
app.use(express_1.default.static(clientDir));
app.get('/api/metrics', (_req, res) => {
    lastSnapshot = (0, metrics_1.generateMetrics)(currentLoad, lastSnapshot);
    res.json(lastSnapshot);
});
app.post('/api/load/:level', (req, res) => {
    const level = req.params.level;
    const allowed = ['low', 'normal', 'peak'];
    if (!allowed.includes(level)) {
        return res.status(400).json({ error: 'Invalid load level', allowed });
    }
    currentLoad = level;
    lastSnapshot = (0, metrics_1.generateMetrics)(currentLoad, lastSnapshot);
    res.json({ level: currentLoad, snapshot: lastSnapshot });
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
