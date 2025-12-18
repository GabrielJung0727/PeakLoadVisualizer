export {};

type MetricsEvent = {
  kind: 'metrics';
  data: { cpu: number; netIn: number; netOut: number; level: string; timestamp: number };
};
type LogEvent = {
  kind: 'log';
  entry: { id: string; ts: number; type: string; message: string; severity: 'info' | 'warn' | 'error' };
};

type WsEvent = MetricsEvent | LogEvent | { kind: 'hello'; ts: number };

const logsEl = document.getElementById('logs');
const stageTag = document.getElementById('stage-tag');
const tagsWrap = document.getElementById('tags');
const viz = document.getElementById('viz');
const serverNode = document.querySelector('.server');
const statusTag = document.createElement('span');
statusTag.className = 'tag';
statusTag.textContent = 'Connecting...';
tagsWrap?.appendChild(statusTag);

let cpuChart: any;
let netChart: any;
let ws: WebSocket | null = null;
let lastLogTs = 0;
let pollTimer: number | null = null;
let logPollTimer: number | null = null;
const activeActions = new Set<string>();

function addLog(entry: LogEvent['entry']) {
  if (!logsEl) return;
  if (entry.ts <= lastLogTs) return;
  lastLogTs = entry.ts;
  const div = document.createElement('div');
  div.className = `log ${entry.severity}`;
  const time = new Date(entry.ts).toLocaleTimeString();
  div.textContent = `[${time}] [${entry.type}] ${entry.message}`;
  logsEl.prepend(div);
  while (logsEl.children.length > 50) {
    logsEl.removeChild(logsEl.lastChild as Node);
  }
}

function updateTags(warnings: string[]) {
  if (!tagsWrap) return;
  tagsWrap.innerHTML = '';
  tagsWrap.appendChild(statusTag);
  if (!warnings.length) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'Stable';
    tagsWrap.appendChild(tag);
    return;
  }
  warnings.forEach((w) => {
    const tag = document.createElement('span');
    tag.className = 'tag alert';
    tag.textContent = w;
    tagsWrap.appendChild(tag);
  });
}

function pushVizArrow(type: string, severity: 'info' | 'warn' | 'error') {
  if (!viz) return;
  const count = severity === 'error' ? 10 : severity === 'warn' ? 6 : 3;
  for (let i = 0; i < count; i += 1) {
    const arrow = document.createElement('div');
    const typeClass =
      type === 'ddos' ? 'ddos' : type === 'bruteforce' ? 'bruteforce' : type === 'portscan' ? 'portscan' : type === 'sqlinj' ? 'sqlinj' : '';
    arrow.className = `arrow ${typeClass} ${severity === 'warn' ? 'warn' : severity === 'error' ? 'alert' : 'ok'}`;
    const angle = Math.random() * Math.PI * 2;
    const radius = 260 + Math.random() * 220;
    const sx = Math.cos(angle) * radius;
    const sy = Math.sin(angle) * radius;
    arrow.style.setProperty('--sx', `${sx}px`);
    arrow.style.setProperty('--sy', `${sy}px`);
    arrow.style.animationDelay = `${Math.random() * 0.4}s`;
    viz.appendChild(arrow);
    setTimeout(() => arrow.remove(), 2600);
  }

  if (severity !== 'info' && serverNode) {
    serverNode.classList.add('pulse');
    const wave = document.createElement('div');
    wave.className = 'shockwave';
    viz.appendChild(wave);
    setTimeout(() => wave.remove(), 900);
    setTimeout(() => serverNode.classList.remove('pulse'), 400);
  }
}

function setupCharts() {
  // @ts-ignore
  const ChartLib = (window as any).Chart;
  const cpuCtx = (document.getElementById('cpuChart') as HTMLCanvasElement).getContext('2d')!;
  const netCtx = (document.getElementById('netChart') as HTMLCanvasElement).getContext('2d')!;
  cpuChart = new ChartLib(cpuCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'CPU %', data: [], borderColor: '#ff6384', backgroundColor: 'rgba(255,99,132,0.15)', tension: 0.35, fill: true }
      ]
    },
    options: { animation: false, plugins: { legend: { labels: { color: '#e8ecf5' } } }, scales: { x: { ticks: { color: '#9aa3b5' } }, y: { ticks: { color: '#9aa3b5' } } } }
  });
  netChart = new ChartLib(netCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Inbound (KB/s)', data: [], borderColor: '#5dd5c4', backgroundColor: 'rgba(93,213,196,0.15)', tension: 0.35, fill: true },
        { label: 'Outbound (KB/s)', data: [], borderColor: '#71a7ff', backgroundColor: 'rgba(113,167,255,0.15)', tension: 0.35, fill: true }
      ]
    },
    options: { animation: false, plugins: { legend: { labels: { color: '#e8ecf5' } } }, scales: { x: { ticks: { color: '#9aa3b5' } }, y: { ticks: { color: '#9aa3b5' } } } }
  });
}

function pushPoint(chart: any, label: string, values: number[]) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((d: any, idx: number) => d.data.push(values[idx]));
  if (chart.data.labels.length > 40) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((d: any) => d.data.shift());
  }
  chart.update('none');
}

function handleMetrics(evt: MetricsEvent) {
  const { cpu, netIn, netOut, level, timestamp } = evt.data;
  const tsLabel = new Date(timestamp).toLocaleTimeString();
  if (cpuChart && netChart) {
    pushPoint(cpuChart, tsLabel, [cpu]);
    pushPoint(netChart, tsLabel, [netIn / 10, netOut / 10]); // scale to KB/s
  }
  if (stageTag) stageTag.textContent = `Stage: ${level}`;
  const warns: string[] = [];
  if (cpu > 85) warns.push('CPU High');
  if (netIn > 800) warns.push('Inbound Flood');
  updateTags(warns);
}

function handleEvent(evt: WsEvent) {
  if (evt.kind === 'log') {
    addLog(evt.entry);
    pushVizArrow(evt.entry.type, evt.entry.severity);
  } else if (evt.kind === 'metrics') {
    handleMetrics(evt);
  }
}

function connectWs() {
  const url = (location.origin.replace(/^http/, 'ws') + '/ws').replace('///', '//');
  ws = new WebSocket(url);
  statusTag.textContent = 'Connecting...';
  statusTag.className = 'tag warn';
  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data as string) as WsEvent;
      handleEvent(data);
      statusTag.textContent = 'Live (WS)';
      statusTag.className = 'tag';
    } catch (err) {
      console.error(err);
    }
  };
  ws.onclose = () => {
    statusTag.textContent = 'Reconnecting...';
    statusTag.className = 'tag warn';
    setTimeout(connectWs, 2000);
  };
}

function bindControls() {
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (!action) return;
      try {
        await fetch(`/attack/${action.replace('-', '/')}`, { method: 'POST' });
        if (action === 'ddos-start') {
          activeActions.add('ddos');
        } else if (action === 'ddos-stop') {
          activeActions.delete('ddos');
        } else {
          activeActions.add(action);
          setTimeout(() => activeActions.delete(action), 7000);
        }
        updateButtonStates();
      } catch (err) {
        console.error(err);
      }
    });
  });
}

async function loadRecentLogs() {
  try {
    const res = await fetch('/logs/recent');
    if (!res.ok) return;
    const data = (await res.json()) as { logs: LogEvent['entry'][] };
    data.logs.forEach((entry) => addLog(entry));
  } catch (err) {
    console.error(err);
  }
}

async function pollMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) return;
    const data = await res.json();
    handleMetrics({ kind: 'metrics', data });
  } catch (err) {
    console.error(err);
  }
}

async function pollLogs() {
  try {
    const res = await fetch('/logs/recent');
    if (!res.ok) return;
    const data = (await res.json()) as { logs: LogEvent['entry'][] };
    data.logs.forEach((entry) => addLog(entry));
  } catch (err) {
    console.error(err);
  }
}

function init() {
  setupCharts();
  bindControls();
  connectWs();
  void loadRecentLogs();
  pollTimer = window.setInterval(pollMetrics, 2000);
  logPollTimer = window.setInterval(pollLogs, 2000);
}

function updateButtonStates() {
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
    const action = btn.dataset.action || '';
    const isActive =
      (action === 'ddos-start' && activeActions.has('ddos')) ||
      (action === 'ddos-stop' && !activeActions.has('ddos') && activeActions.size > 0) ||
      activeActions.has(action);
    btn.classList.toggle('active', isActive);
  });
}

document.addEventListener('DOMContentLoaded', init);
