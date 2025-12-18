import { randomUUID } from 'crypto';
import { LoadLevel } from './types';

type AttackType = 'ddos' | 'bruteforce' | 'portscan' | 'sqlinj';

type Metrics = {
  cpu: number;
  netIn: number;
  netOut: number;
  level: LoadLevel;
  timestamp: number;
};

export type LogEntry = {
  id: string;
  ts: number;
  type: AttackType | 'info';
  message: string;
  severity: 'info' | 'warn' | 'error';
};

type Subscriber = (event: { kind: 'metrics'; data: Metrics } | { kind: 'log'; entry: LogEntry }) => void;

const logs: LogEntry[] = [];
const subscribers = new Set<Subscriber>();

let ddos = false;
let bruteUntil = 0;
let portScanUntil = 0;
let sqlUntil = 0;
let portCursor = 1;
let stage: LoadLevel = 'low';

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function emitLog(entry: Omit<LogEntry, 'id' | 'ts'>) {
  const full: LogEntry = { id: randomUUID(), ts: Date.now(), ...entry };
  logs.push(full);
  if (logs.length > 200) logs.shift();
  subscribers.forEach((fn) => fn({ kind: 'log', entry: full }));
}

function emitMetrics(data: Metrics) {
  subscribers.forEach((fn) => fn({ kind: 'metrics', data }));
}

export function subscribeSim(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getRecentLogs() {
  return logs.slice(-200);
}

export function setStage(level: LoadLevel) {
  stage = level;
}

export function startDdos() {
  ddos = true;
  emitLog({ type: 'ddos', message: 'DDOS attack initiated', severity: 'error' });
}

export function stopDdos() {
  ddos = false;
  emitLog({ type: 'ddos', message: 'DDOS attack stopped', severity: 'info' });
}

export function triggerBruteforce() {
  bruteUntil = Date.now() + 10000;
  emitLog({ type: 'bruteforce', message: 'Brute force wave started', severity: 'warn' });
}

export function triggerPortScan() {
  portScanUntil = Date.now() + 10000;
  portCursor = 1;
  emitLog({ type: 'portscan', message: 'Port scan initiated (1-1024)', severity: 'warn' });
}

export function triggerSqlInjection() {
  sqlUntil = Date.now() + 8000;
  emitLog({ type: 'sqlinj', message: 'SQL injection attempts detected', severity: 'error' });
}

function sampleMetrics(): Metrics {
  const baseCpu = 10 + Math.random() * 10;
  const baseNet = 80 + Math.random() * 60;
  let cpu = baseCpu;
  let netIn = baseNet;
  let netOut = baseNet * 0.6;

  if (ddos) {
    cpu += 60 + Math.random() * 55; // more spike
    netIn += 1600 + Math.random() * 1400;
    netOut += 380 + Math.random() * 260;
  }
  if (bruteUntil > Date.now()) {
    cpu += 22 + Math.random() * 18;
    netIn += 220 + Math.random() * 180;
  }
  if (portScanUntil > Date.now()) {
    netIn += 260 + Math.random() * 180;
    netOut += 90 + Math.random() * 70;
  }
  if (sqlUntil > Date.now()) {
    cpu += 12 + Math.random() * 10;
    netOut += 120 + Math.random() * 80;
  }

  cpu = clamp(cpu, 0, 99);
  netIn = Math.round(netIn);
  netOut = Math.round(netOut);

  return { cpu, netIn, netOut, level: stage, timestamp: Date.now() };
}

function tickLogs() {
  const now = Date.now();
  if (ddos) {
    const bursts = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bursts; i += 1) {
      emitLog({ type: 'ddos', message: 'Inbound flood detected (SYN/UDP mix)', severity: 'error' });
    }
  }
  if (bruteUntil > now) {
    const bursts = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < bursts; i += 1) {
      const ip = `192.168.0.${Math.floor(Math.random() * 200 + 10)}`;
      emitLog({ type: 'bruteforce', message: `Brute force attempt from ${ip} → Denied`, severity: 'warn' });
    }
  }
  if (portScanUntil > now) {
    for (let i = 0; i < 24; i += 1) {
      if (portCursor > 1024) {
        portCursor = 1;
      }
      const port = portCursor++;
      emitLog({
        type: 'portscan',
        message: `Port scan on ${port}/tcp (${port % 2 === 0 ? 'Blocked' : 'Open? heuristic'})`,
        severity: port % 2 === 0 ? 'info' : 'warn'
      });
    }
  }
  if (sqlUntil > now) {
    const payloads = ["' OR 1=1 --", 'UNION SELECT user, pass', 'sleep(5)#', "admin'/*"];
    const payload = payloads[Math.floor(Math.random() * payloads.length)];
    const severity = Math.random() > 0.4 ? 'error' : 'warn';
    const risk = Math.round(Math.random() * 4 + 6);
    emitLog({ type: 'sqlinj', message: `SQLi payload="${payload}" risk=${risk}/10`, severity });
  }
}

function loop() {
  tickLogs();
  const metrics = sampleMetrics();
  emitMetrics(metrics);
}

setInterval(loop, 1000).unref();
