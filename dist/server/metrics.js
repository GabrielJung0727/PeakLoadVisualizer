"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRequest = recordRequest;
exports.collectMetrics = collectMetrics;
const systeminformation_1 = __importDefault(require("systeminformation"));
const WINDOW_MS = 15000;
const samples = [];
function cleanupWindow() {
    const cutoff = Date.now() - WINDOW_MS;
    while (samples.length && samples[0].ts < cutoff) {
        samples.shift();
    }
}
function recordRequest(durationMs, statusCode) {
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
        if (sample.isError)
            errors += 1;
    }
    const rps = total / windowSec;
    const responseTimeMs = total ? totalDuration / total : 0;
    const errorRate = total ? (errors / total) * 100 : 0;
    return { rps, responseTimeMs, errorRate, timestamp: Date.now() };
}
async function getSystemStats() {
    const [load, mem] = await Promise.all([systeminformation_1.default.currentLoad(), systeminformation_1.default.mem()]);
    const cpu = Number(load.currentLoad.toFixed(1));
    const usedBytes = mem.active || mem.used || mem.total - mem.available;
    const memoryMb = Math.round(usedBytes / 1024 / 1024);
    return { cpu, memoryMb };
}
function buildWarning(snapshot) {
    const flags = [];
    if (snapshot.responseTimeMs > 300)
        flags.push('응답 지연 / Slow responses');
    if (snapshot.errorRate > 1.5)
        flags.push('오류율 상승 / Error rate high');
    if (snapshot.cpu > 85)
        flags.push('CPU 포화 / CPU saturation');
    return flags.length ? flags.join(' · ') : undefined;
}
async function collectMetrics(level) {
    const { rps, responseTimeMs, errorRate, timestamp } = aggregateRequests();
    const { cpu, memoryMb } = await getSystemStats();
    const warning = buildWarning({ responseTimeMs, errorRate, cpu });
    return {
        level,
        rps: Math.round(rps * 10) / 10,
        cpu,
        memoryMb,
        responseTimeMs: Math.round(responseTimeMs),
        errorRate: Math.round(errorRate * 10) / 10,
        timestamp,
        warning
    };
}
