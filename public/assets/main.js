"use strict";
const translations = {
    ko: {
        navDashboard: '대시보드',
        navIdentity: '닉네임 설정',
        navLeaderboard: '리더보드',
        heroTitle: '동적 부하 처리 웹서비스 & Peak 성능 분석',
        heroLede: '요청량을 단계별로 올리며 RPS, CPU, 메모리, 응답 시간, 오류율을 한눈에 살피는 발표형 대시보드. 후배/수강생이 직접 버튼을 눌러 부하 변화를 체험할 수 있습니다.',
        heroNote: 'IIS 또는 Node.js(Express) 서버 + k6/AB/JMeter 연동 가능',
        highlightTitle: 'Peak 대비 상태',
        highlightSub: 'RPS · 응답 시간 · 오류율을 실시간으로 폴링합니다.',
        identityTitle: '닉네임 설정 (일시적)',
        identitySub: '현재 세션에서 사용할 닉네임을 설정하면 리더보드에 기록됩니다. IP나 계정 연동 없이, 로컬에만 임시 저장됩니다.',
        identityLegendTitle: '기록 방식',
        identityLegend1: '최근 15초 이동창으로 RPS/지연/오류율 계산',
        identityLegend2: 'CPU/메모리 실측(systeminformation) 반영',
        identityLegend3: '최고 RPS, 최저 평균 지연, 최소 오류율, 안정성 점수 저장',
        stepsTitle: '단계별 부하 실습',
        stepsSub: '버튼을 눌러 서버 부하 단계를 전환하면 `/api/load/:level`이 호출되고, `/api/metrics`가 갱신됩니다. 실제 발표에서는 k6/AB/JMeter 실행을 여기에 연결할 수 있습니다.',
        stepLow: 'Low: 캐시 워밍업, 정상 지표 확인',
        stepNormal: 'Normal: 평균 응답 시간과 CPU 안정성 확인',
        stepPeak: 'Peak: 지연/오류율 상승 시 경고 배너 확인',
        monitorTitle: '모니터링 포인트',
        monitor1: 'Performance Monitor: % Processor Time, Available MBytes',
        monitor2: '로드툴: k6/AB/JMeter 결과와 그래프 비교',
        monitor3: 'Task Manager 캡처로 실시간 리소스 공유',
        leaderboardLabel: '리더보드',
        leaderboardTitle: '실시간 성능 순위',
        leaderboardSub: '최고 RPS, 최저 평균 응답 시간, 오류율, 안정성 점수로 순위를 매깁니다.',
        warningPrefix: 'Peak 단계 경고: ',
        stagePrefix: '현재 단계:',
        metricsError: '메트릭을 불러올 수 없습니다. 서버 상태를 확인하세요.',
        leaderboardError: '리더보드를 불러올 수 없습니다.',
        leaderboardEmpty: '데이터 수집 대기 중...',
        namePlaceholder: '예: StudentA',
        nameSaved: (name) => `저장됨: ${name}`,
        nameTooShort: '2자 이상 입력하세요.',
        loadSwitchError: '부하 단계 전환 실패',
        tagLive: '실시간'
    },
    en: {
        navDashboard: 'Dashboard',
        navIdentity: 'Set Nickname',
        navLeaderboard: 'Leaderboard',
        heroTitle: 'Dynamic Load Service & Peak Performance Analysis',
        heroLede: 'Raise load step-by-step and visualize RPS, CPU, memory, response time, and error rate in one view. Students can trigger changes themselves.',
        heroNote: 'Works with IIS or Node.js (Express) + k6/AB/JMeter',
        highlightTitle: 'Peak Readiness',
        highlightSub: 'Polling RPS, latency, and error rate in real time.',
        identityTitle: 'Nickname (temp, local)',
        identitySub: 'Set a temporary nickname for this session; results on the leaderboard will use it. No IP/account is stored—kept in your browser only.',
        identityLegendTitle: 'How it records',
        identityLegend1: '15s sliding window for RPS/latency/error rate',
        identityLegend2: 'CPU/memory from systeminformation (OS metrics)',
        identityLegend3: 'Stores peak RPS, lowest avg latency, lowest error rate, stability score',
        stepsTitle: 'Load Lab Steps',
        stepsSub: 'Click a button to change load level; `/api/load/:level` and `/api/metrics` update together. Hook your k6/AB/JMeter runs here.',
        stepLow: 'Low: Warm cache, verify baseline',
        stepNormal: 'Normal: Watch avg latency and CPU stability',
        stepPeak: 'Peak: Observe latency/error warnings',
        monitorTitle: 'Monitoring Points',
        monitor1: 'Performance Monitor: % Processor Time, Available MBytes',
        monitor2: 'Load tools: compare k6/AB/JMeter results with graphs',
        monitor3: 'Share Task Manager for live resource view',
        leaderboardLabel: 'Leaderboard',
        leaderboardTitle: 'Live Performance Ranking',
        leaderboardSub: 'Ranked by peak RPS, lowest avg latency, error rate, and stability score.',
        warningPrefix: 'Peak warning: ',
        stagePrefix: 'Current stage:',
        metricsError: 'Unable to load metrics. Check server health.',
        leaderboardError: 'Unable to load leaderboard.',
        leaderboardEmpty: 'Waiting for data...',
        namePlaceholder: 'e.g., StudentA',
        nameSaved: (name) => `Saved: ${name}`,
        nameTooShort: 'Enter at least 2 characters.',
        loadSwitchError: 'Failed to change load level',
        tagLive: 'Live'
    }
};
const MAX_POINTS = 30;
const levelLabels = {
    ko: { low: 'Low', normal: 'Normal', peak: 'Peak' },
    en: { low: 'Low', normal: 'Normal', peak: 'Peak' }
};
const els = {
    warning: document.querySelector('#warning'),
    cards: {
        rps: document.querySelector('#card-rps'),
        latency: document.querySelector('#card-latency'),
        cpu: document.querySelector('#card-cpu'),
        memory: document.querySelector('#card-memory'),
        error: document.querySelector('#card-error'),
        stage: document.querySelector('#card-stage')
    },
    highlights: {
        rps: document.querySelector('#rps-highlight'),
        cpu: document.querySelector('#cpu-highlight'),
        memory: document.querySelector('#memory-highlight'),
        stageChip: document.querySelector('#stage-chip')
    },
    buttons: Array.from(document.querySelectorAll('[data-level]')),
    identity: {
        form: document.querySelector('#name-form'),
        input: document.querySelector('#name-input'),
        status: document.querySelector('#name-status')
    },
    langButtons: Array.from(document.querySelectorAll('.lang-btn')),
    leaderboardBody: document.querySelector('#leaderboard-body')
};
const state = {
    level: 'low',
    leaderboard: [],
    lang: localStorage.getItem('lang') === 'en' ? 'en' : 'ko',
    name: localStorage.getItem('nickname') || 'Guest'
};
const dict = () => translations[state.lang];
function setText(id, value) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = value;
}
function applyLanguage(lang) {
    var _a, _b;
    state.lang = lang;
    localStorage.setItem('lang', lang);
    const d = dict();
    setText('nav-dashboard', d.navDashboard);
    setText('nav-identity', d.navIdentity);
    setText('nav-leaderboard', d.navLeaderboard);
    setText('hero-title', d.heroTitle);
    setText('hero-lede', d.heroLede);
    setText('hero-note', d.heroNote);
    setText('highlight-title', d.highlightTitle);
    setText('highlight-sub', d.highlightSub);
    setText('identity-title', d.identityTitle);
    setText('identity-sub', d.identitySub);
    setText('identity-legend-title', d.identityLegendTitle);
    setText('identity-legend-1', d.identityLegend1);
    setText('identity-legend-2', d.identityLegend2);
    setText('identity-legend-3', d.identityLegend3);
    setText('steps-title', d.stepsTitle);
    setText('steps-sub', d.stepsSub);
    setText('step-low', d.stepLow);
    setText('step-normal', d.stepNormal);
    setText('step-peak', d.stepPeak);
    setText('monitor-title', d.monitorTitle);
    setText('monitor-1', d.monitor1);
    setText('monitor-2', d.monitor2);
    setText('monitor-3', d.monitor3);
    setText('leaderboard-label', d.leaderboardLabel);
    setText('leaderboard-title', d.leaderboardTitle);
    setText('leaderboard-sub', d.leaderboardSub);
    setText('tag-live', d.tagLive);
    setText('th-rank', lang === 'ko' ? '순위' : 'Rank');
    setText('th-user', lang === 'ko' ? '사용자' : 'User');
    setText('th-peak', lang === 'ko' ? '최고 RPS' : 'Peak RPS');
    setText('th-latency', lang === 'ko' ? '평균 지연' : 'Avg Latency');
    setText('th-error', lang === 'ko' ? '오류율' : 'Error Rate');
    setText('th-state', lang === 'ko' ? '서버 상태' : 'Server State');
    setText('th-stability', lang === 'ko' ? '안정성' : 'Stability');
    const nameInput = document.getElementById('name-input');
    if (nameInput)
        nameInput.placeholder = d.namePlaceholder;
    const nameBtn = document.getElementById('name-save-btn');
    if (nameBtn)
        nameBtn.textContent = lang === 'ko' ? '저장' : 'Save';
    els.buttons.forEach((btn) => {
        const level = btn.dataset.level;
        btn.textContent =
            level === 'low'
                ? lang === 'ko' ? 'Low 부하' : 'Low Load'
                : level === 'normal'
                    ? lang === 'ko' ? 'Normal 부하' : 'Normal Load'
                    : lang === 'ko'
                        ? 'Peak 부하'
                        : 'Peak Load';
    });
    els.langButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.lang === lang));
    const stageLabel = levelLabels[lang][(_b = (_a = state.lastSnapshot) === null || _a === void 0 ? void 0 : _a.level) !== null && _b !== void 0 ? _b : state.level];
    const stageChip = document.getElementById('stage-chip');
    if (stageChip)
        stageChip.textContent = `${d.stagePrefix} ${stageLabel}`;
    setText('card-stage', stageLabel);
    if (state.lastSnapshot) {
        updateCards(state.lastSnapshot);
    }
    renderLeaderboard(state.leaderboard);
}
function setWarning(message, opts) {
    var _a;
    if (!els.warning)
        return;
    if (!message) {
        els.warning.hidden = true;
        els.warning.textContent = '';
        return;
    }
    els.warning.hidden = false;
    const usePrefix = (_a = opts === null || opts === void 0 ? void 0 : opts.prefix) !== null && _a !== void 0 ? _a : true;
    els.warning.textContent = usePrefix ? `${dict().warningPrefix}${message}` : message;
}
function updateCards(snapshot) {
    els.cards.rps.textContent = `${snapshot.rps.toFixed(0)} req/s`;
    els.cards.latency.textContent = `${snapshot.responseTimeMs.toFixed(0)} ms`;
    els.cards.cpu.textContent = `${snapshot.cpu.toFixed(1)}%`;
    els.cards.memory.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
    els.cards.error.textContent = `${snapshot.errorRate.toFixed(1)}%`;
    const label = levelLabels[state.lang][snapshot.level];
    els.cards.stage.textContent = label;
    els.highlights.rps.textContent = `${snapshot.rps.toFixed(0)} req/s`;
    els.highlights.cpu.textContent = `${snapshot.cpu.toFixed(1)}%`;
    els.highlights.memory.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
    els.highlights.stageChip.textContent = `${dict().stagePrefix} ${label}`;
}
function limitPoints(chart) {
    if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((d) => d.data.shift());
    }
}
function pushData(chart, label, values) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset, idx) => {
        dataset.data.push(values[idx]);
    });
    limitPoints(chart);
    chart.update('none');
}
function setupCharts() {
    const rpsCtx = document.getElementById('rpsChart').getContext('2d');
    const resourceCtx = document.getElementById('resourceChart').getContext('2d');
    const rpsChart = new Chart(rpsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'RPS',
                    data: [],
                    borderColor: '#5dd5c4',
                    backgroundColor: 'rgba(93, 213, 196, 0.15)',
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: '응답 시간(ms)',
                    data: [],
                    borderColor: '#ff9f43',
                    backgroundColor: 'rgba(255, 159, 67, 0.15)',
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: '#e8ecf5' } } },
            scales: {
                x: { ticks: { color: '#9aa3b5' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#9aa3b5' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
    const resourceChart = new Chart(resourceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU %',
                    data: [],
                    borderColor: '#71a7ff',
                    backgroundColor: 'rgba(113, 167, 255, 0.15)',
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: '메모리(MB)',
                    data: [],
                    borderColor: '#f25f8b',
                    backgroundColor: 'rgba(242, 95, 139, 0.12)',
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: '#e8ecf5' } } },
            scales: {
                x: { ticks: { color: '#9aa3b5' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#9aa3b5' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
    return { rpsChart, resourceChart };
}
function setActiveButton(level) {
    els.buttons.forEach((btn) => {
        const isActive = btn.dataset.level === level;
        btn.classList.toggle('active', isActive);
    });
}
function bindLanguageSwitch() {
    els.langButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (lang && lang !== state.lang) {
                applyLanguage(lang);
            }
        });
    });
}
async function setLoadLevel(level) {
    try {
        const res = await fetch(`/api/load/${level}`, { method: 'POST' });
        if (!res.ok)
            throw new Error(await res.text());
        state.level = level;
        setActiveButton(level);
    }
    catch (err) {
        console.error(err);
        setWarning(dict().loadSwitchError, { prefix: false });
    }
}
function formatLabel(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { minute: '2-digit', second: '2-digit' });
}
async function refreshMetrics() {
    try {
        const res = await fetch(`/api/metrics?name=${encodeURIComponent(state.name || 'Guest')}`);
        if (!res.ok)
            throw new Error('metrics fetch failed');
        const snapshot = (await res.json());
        state.lastSnapshot = snapshot;
        updateCards(snapshot);
        setWarning(snapshot.warning);
        if (state.charts) {
            pushData(state.charts.rpsChart, formatLabel(snapshot.timestamp), [snapshot.rps, snapshot.responseTimeMs]);
            pushData(state.charts.resourceChart, formatLabel(snapshot.timestamp), [snapshot.cpu, snapshot.memoryMb]);
        }
    }
    catch (err) {
        console.error(err);
        setWarning(dict().metricsError, { prefix: false });
    }
}
function bindControls() {
    els.buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.level;
            if (target !== state.level) {
                void setLoadLevel(target);
            }
        });
    });
}
function startPolling() {
    void refreshMetrics();
    state.pollId = window.setInterval(refreshMetrics, 2000);
}
function setNameStatus(message, tone = 'muted') {
    if (!els.identity.status)
        return;
    els.identity.status.textContent = message;
    const color = tone === 'error' ? '#ff9f9f' : tone === 'ok' ? '#5dd5c4' : getComputedStyle(document.body).getPropertyValue('--muted');
    els.identity.status.style.color = color;
}
function renderLeaderboard(entries) {
    if (!els.leaderboardBody)
        return;
    if (!entries.length) {
        els.leaderboardBody.innerHTML = `<tr><td colspan="7" class="muted">${dict().leaderboardEmpty}</td></tr>`;
        return;
    }
    const rows = entries
        .map((entry, idx) => {
        const rank = idx + 1;
        const rps = `${entry.peakRps.toFixed(1)} req/s`;
        const latency = Number.isFinite(entry.bestLatency) ? `${entry.bestLatency.toFixed(0)} ms` : '--';
        const errors = Number.isFinite(entry.bestErrorRate) ? `${entry.bestErrorRate.toFixed(1)}%` : '--';
        const stability = `${Math.round(entry.stabilityScore)} pts`;
        return `<tr>
        <td>${rank}</td>
        <td>${entry.name}</td>
        <td>${rps}</td>
        <td>${latency}</td>
        <td>${errors}</td>
        <td>${entry.serverState}</td>
        <td>${stability}</td>
      </tr>`;
    })
        .join('');
    els.leaderboardBody.innerHTML = rows;
}
async function refreshLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok)
            throw new Error('leaderboard fetch failed');
        const data = (await res.json());
        state.leaderboard = data.entries;
        renderLeaderboard(state.leaderboard);
    }
    catch (err) {
        console.error(err);
        if (els.leaderboardBody) {
            els.leaderboardBody.innerHTML = `<tr><td colspan="7" class="muted">${dict().leaderboardError}</td></tr>`;
        }
    }
}
function bindIdentityForm() {
    if (!els.identity.form || !els.identity.input)
        return;
    els.identity.input.value = state.name;
    setNameStatus(dict().nameSaved(state.name), 'ok');
    els.identity.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = els.identity.input.value.trim();
        if (name.length < 2) {
            setNameStatus(dict().nameTooShort, 'error');
            return;
        }
        state.name = name.slice(0, 32);
        localStorage.setItem('nickname', state.name);
        setNameStatus(dict().nameSaved(state.name), 'ok');
    });
}
function startLeaderboardPolling() {
    void refreshLeaderboard();
    state.leaderboardPollId = window.setInterval(refreshLeaderboard, 6000);
}
function init() {
    applyLanguage(state.lang);
    state.charts = setupCharts();
    bindControls();
    bindLanguageSwitch();
    bindIdentityForm();
    startPolling();
    startLeaderboardPolling();
}
window.addEventListener('DOMContentLoaded', init);
