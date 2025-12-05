type LoadLevel = 'low' | 'normal' | 'peak';

type MetricSnapshot = {
  level: LoadLevel;
  rps: number;
  cpu: number;
  memoryMb: number;
  responseTimeMs: number;
  errorRate: number;
  timestamp: number;
  warning?: string;
};

declare const Chart: any;

type ChartSet = {
  rpsChart: any;
  resourceChart: any;
};

const MAX_POINTS = 30;
const levelLabels: Record<LoadLevel, string> = { low: 'Low', normal: 'Normal', peak: 'Peak' };

const els = {
  warning: document.querySelector<HTMLElement>('#warning'),
  cards: {
    rps: document.querySelector<HTMLElement>('#card-rps'),
    latency: document.querySelector<HTMLElement>('#card-latency'),
    cpu: document.querySelector<HTMLElement>('#card-cpu'),
    memory: document.querySelector<HTMLElement>('#card-memory'),
    error: document.querySelector<HTMLElement>('#card-error'),
    stage: document.querySelector<HTMLElement>('#card-stage')
  },
  highlights: {
    rps: document.querySelector<HTMLElement>('#rps-highlight'),
    cpu: document.querySelector<HTMLElement>('#cpu-highlight'),
    memory: document.querySelector<HTMLElement>('#memory-highlight'),
    stageChip: document.querySelector<HTMLElement>('#stage-chip')
  },
  buttons: Array.from(document.querySelectorAll<HTMLButtonElement>('[data-level]'))
};

const state: {
  level: LoadLevel;
  charts?: ChartSet;
  pollId?: number;
} = {
  level: 'low'
};

function setWarning(message?: string) {
  if (!els.warning) return;
  if (!message) {
    els.warning.hidden = true;
    els.warning.textContent = '';
    return;
  }
  els.warning.hidden = false;
  els.warning.textContent = `Peak 단계 경고: ${message}`;
}

function updateCards(snapshot: MetricSnapshot) {
  els.cards.rps!.textContent = `${snapshot.rps.toFixed(0)} req/s`;
  els.cards.latency!.textContent = `${snapshot.responseTimeMs.toFixed(0)} ms`;
  els.cards.cpu!.textContent = `${snapshot.cpu.toFixed(1)}%`;
  els.cards.memory!.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
  els.cards.error!.textContent = `${snapshot.errorRate.toFixed(1)}%`;
  els.cards.stage!.textContent = levelLabels[snapshot.level];

  els.highlights.rps!.textContent = `${snapshot.rps.toFixed(0)} req/s`;
  els.highlights.cpu!.textContent = `${snapshot.cpu.toFixed(1)}%`;
  els.highlights.memory!.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
  els.highlights.stageChip!.textContent = `현재 단계: ${levelLabels[snapshot.level]}`;
}

function limitPoints(chart: any) {
  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((d: any) => d.data.shift());
  }
}

function pushData(chart: any, label: string, values: number[]) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset: any, idx: number) => {
    dataset.data.push(values[idx]);
  });
  limitPoints(chart);
  chart.update('none');
}

function setupCharts(): ChartSet {
  const rpsCtx = (document.getElementById('rpsChart') as HTMLCanvasElement).getContext('2d')!;
  const resourceCtx = (document.getElementById('resourceChart') as HTMLCanvasElement).getContext('2d')!;

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

function setActiveButton(level: LoadLevel) {
  els.buttons.forEach((btn) => {
    const isActive = btn.dataset.level === level;
    btn.classList.toggle('active', isActive);
  });
}

async function setLoadLevel(level: LoadLevel) {
  try {
    const res = await fetch(`/api/load/${level}`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    state.level = level;
    setActiveButton(level);
  } catch (err) {
    console.error(err);
    setWarning('부하 단계 전환 실패');
  }
}

function formatLabel(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', { minute: '2-digit', second: '2-digit' });
}

async function refreshMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) throw new Error('metrics fetch failed');
    const snapshot = (await res.json()) as MetricSnapshot;

    updateCards(snapshot);
    setWarning(snapshot.warning);

    if (state.charts) {
      pushData(state.charts.rpsChart, formatLabel(snapshot.timestamp), [snapshot.rps, snapshot.responseTimeMs]);
      pushData(state.charts.resourceChart, formatLabel(snapshot.timestamp), [snapshot.cpu, snapshot.memoryMb]);
    }
  } catch (err) {
    console.error(err);
    setWarning('메트릭을 불러올 수 없습니다. 서버 상태를 확인하세요.');
  }
}

function bindControls() {
  els.buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.level as LoadLevel;
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

function init() {
  state.charts = setupCharts();
  bindControls();
  startPolling();
}

window.addEventListener('DOMContentLoaded', init);
