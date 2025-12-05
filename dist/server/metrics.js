"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetrics = generateMetrics;
const PROFILES = {
    low: {
        baseRps: 25,
        rpsVariance: 0.25,
        baseCpu: 14,
        cpuVariance: 0.3,
        baseMemory: 620,
        memoryVariance: 0.12,
        baseLatency: 48,
        latencyVariance: 0.35,
        latencyWarn: 120,
        baseErrorRate: 0.2,
        errorVariance: 1.2,
        errorWarn: 1.5
    },
    normal: {
        baseRps: 220,
        rpsVariance: 0.3,
        baseCpu: 46,
        cpuVariance: 0.18,
        baseMemory: 980,
        memoryVariance: 0.16,
        baseLatency: 110,
        latencyVariance: 0.25,
        latencyWarn: 250,
        baseErrorRate: 0.6,
        errorVariance: 1.8,
        errorWarn: 3
    },
    peak: {
        baseRps: 720,
        rpsVariance: 0.35,
        baseCpu: 86,
        cpuVariance: 0.12,
        baseMemory: 1420,
        memoryVariance: 0.17,
        baseLatency: 320,
        latencyVariance: 0.25,
        latencyWarn: 400,
        baseErrorRate: 2.2,
        errorVariance: 2.5,
        errorWarn: 6
    }
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const jitter = (value, variance) => {
    const delta = value * variance * (Math.random() - 0.5) * 2;
    return value + delta;
};
function generateMetrics(level, previous) {
    const profile = PROFILES[level];
    const now = Date.now();
    const rps = clamp(jitter(profile.baseRps, profile.rpsVariance), 0, profile.baseRps * 2.2);
    const cpu = clamp(jitter(profile.baseCpu, profile.cpuVariance), 1, 100);
    const memoryMb = clamp(jitter(profile.baseMemory, profile.memoryVariance), 400, 3200);
    const responseTimeMs = clamp(jitter(profile.baseLatency, profile.latencyVariance), 20, 1200);
    const errorRate = clamp(jitter(profile.baseErrorRate, profile.errorVariance), 0, 50);
    const warningFlags = [];
    if (responseTimeMs > profile.latencyWarn) {
        warningFlags.push('응답 지연 우려');
    }
    if (errorRate > profile.errorWarn) {
        warningFlags.push('오류율 상승');
    }
    if (level === 'peak' && cpu > 90) {
        warningFlags.push('CPU 포화 경고');
    }
    const warning = warningFlags.length ? warningFlags.join(' · ') : undefined;
    return {
        level,
        rps: Math.round(rps),
        cpu: Math.round(cpu * 10) / 10,
        memoryMb: Math.round(memoryMb),
        responseTimeMs: Math.round(responseTimeMs),
        errorRate: Math.round(errorRate * 10) / 10,
        timestamp: now,
        warning
    };
}
