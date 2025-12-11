import si from 'systeminformation';
import { LoadLevel, LoadProfileSnapshot } from './types';

export interface MetricSnapshot {
  level: LoadLevel;
  rps: number;
  cpu: number;
  memoryMb: number;
  memoryTotalMb?: number;
  memoryFreeMb?: number;
  responseTimeMs: number;
  errorRate: number;
  diskReadMBps?: number;
  diskWriteMBps?: number;
  timestamp: number;
  warning?: string;
  memoryHeadroomMb?: number;
  memoryCapacityMb?: number;
  profile?: LoadProfileSnapshot;
}

type Sample = { ts: number; durationMs: number; isError: boolean };

const WINDOW_MS = 15000;
const samples: Sample[] = [];
let lastDiskSample:
  | {
      ts: number;
      readBytes: number;
      writeBytes: number;
    }
  | undefined;

function cleanupWindow() {
  const cutoff = Date.now() - WINDOW_MS;
  while (samples.length && samples[0].ts < cutoff) {
    samples.shift();
  }
}

export function recordRequest(durationMs: number, statusCode: number) {
  samples.push({ ts: Date.now(), durationMs, isError: statusCode >= 500 });
  cleanupWindow();
}

function aggregateRequests() {
  cleanupWindow();
  const windowSec = WINDOW_MS / 1000;
  const total = samples.length;
  let totalDuration = 0;
  let errors = 0;

  for (const sample of samples) {
    totalDuration += sample.durationMs;
    if (sample.isError) errors += 1;
  }

  const rps = total / windowSec;
  const responseTimeMs = total ? totalDuration / total : 0;
  const errorRate = total ? (errors / total) * 100 : 0;

  return { rps, responseTimeMs, errorRate, timestamp: Date.now() };
}

async function getDiskDelta() {
  const io = await si.disksIO();
  const readBytesTotal = io?.rIO ?? 0;
  const writeBytesTotal = io?.wIO ?? 0;
  const now = Date.now();
  if (!lastDiskSample) {
    lastDiskSample = { ts: now, readBytes: readBytesTotal, writeBytes: writeBytesTotal };
    return { readMBps: 0, writeMBps: 0 };
  }
  const elapsedSec = Math.max((now - lastDiskSample.ts) / 1000, 0.001);
  const readMBps = Math.max((readBytesTotal - lastDiskSample.readBytes) / 1024 / 1024 / elapsedSec, 0);
  const writeMBps = Math.max((writeBytesTotal - lastDiskSample.writeBytes) / 1024 / 1024 / elapsedSec, 0);
  lastDiskSample = { ts: now, readBytes: readBytesTotal, writeBytes: writeBytesTotal };
  return { readMBps, writeMBps };
}

async function getSystemStats() {
  const [load, mem, disk] = await Promise.all([si.currentLoad(), si.mem(), getDiskDelta()]);
  const cpu = Number(load.currentLoad.toFixed(1));
  const usedBytes = mem.active || mem.used || (mem.total && mem.available ? mem.total - mem.available : 0);
  const memoryMb = Math.round(usedBytes / 1024 / 1024);
  const memoryTotalMb = Math.round(mem.total / 1024 / 1024);
  const memoryFreeMb = Math.round((mem.available ?? mem.free ?? mem.total - usedBytes) / 1024 / 1024);
  return {
    cpu,
    memoryMb,
    memoryTotalMb,
    memoryFreeMb,
    diskReadMBps: Number(disk.readMBps.toFixed(2)),
    diskWriteMBps: Number(disk.writeMBps.toFixed(2))
  };
}

function buildWarning(snapshot: { responseTimeMs: number; errorRate: number; cpu: number }) {
  const flags: string[] = [];
  if (snapshot.responseTimeMs > 300) flags.push('응답 지연 / Slow responses');
  if (snapshot.errorRate > 1.5) flags.push('오류율 상승 / Error rate high');
  if (snapshot.cpu > 85) flags.push('CPU 포화 / CPU saturation');
  return flags.length ? flags.join(' · ') : undefined;
}

export async function collectMetrics(level: LoadLevel, profile?: LoadProfileSnapshot): Promise<MetricSnapshot> {
  const { rps, responseTimeMs, errorRate, timestamp } = aggregateRequests();
  const { cpu, memoryMb, memoryTotalMb, memoryFreeMb, diskReadMBps, diskWriteMBps } = await getSystemStats();

  const warning = buildWarning({ responseTimeMs, errorRate, cpu });
  const memoryCapacityMb = memoryTotalMb || Number(process.env.SERVER_MEMORY_MB) || 0;
  const headroom = memoryCapacityMb ? Math.max(memoryCapacityMb - memoryMb, 0) : undefined;

  return {
    level,
    rps: Math.round(rps * 10) / 10,
    cpu,
    memoryMb,
    responseTimeMs: Math.round(responseTimeMs),
    errorRate: Math.round(errorRate * 10) / 10,
    timestamp,
    warning,
    memoryHeadroomMb: headroom,
    memoryCapacityMb: memoryCapacityMb || memoryTotalMb,
    memoryTotalMb,
    memoryFreeMb,
    diskReadMBps,
    diskWriteMBps,
    profile
  };
}
