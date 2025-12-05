import express from 'express';
import path from 'path';
import cors from 'cors';
import { generateMetrics, LoadLevel, MetricSnapshot } from './metrics';

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(process.cwd(), 'public');
const clientDir = path.join(process.cwd(), 'src/client');

let currentLoad: LoadLevel = 'low';
let lastSnapshot: MetricSnapshot = generateMetrics(currentLoad);

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));
app.use(express.static(clientDir));

app.get('/api/metrics', (_req, res) => {
  lastSnapshot = generateMetrics(currentLoad, lastSnapshot);
  res.json(lastSnapshot);
});

app.post('/api/load/:level', (req, res) => {
  const level = req.params.level as LoadLevel;
  const allowed: LoadLevel[] = ['low', 'normal', 'peak'];

  if (!allowed.includes(level)) {
    return res.status(400).json({ error: 'Invalid load level', allowed });
  }

  currentLoad = level;
  lastSnapshot = generateMetrics(currentLoad, lastSnapshot);

  res.json({ level: currentLoad, snapshot: lastSnapshot });
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
