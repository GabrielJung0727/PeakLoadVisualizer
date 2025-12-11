type LoadLevel = 'low' | 'normal' | 'peak' | 'overload';
type Lang = 'ko' | 'en';

type MetricSnapshot = {
  level: LoadLevel;
  rps: number;
  cpu: number;
  memoryMb: number;
  memoryTotalMb?: number;
  memoryFreeMb?: number;
  responseTimeMs: number;
  errorRate: number;
  timestamp: number;
  warning?: string;
  memoryHeadroomMb?: number;
  memoryCapacityMb?: number;
  profile?: {
    level: LoadLevel;
    cpuWorkers: number;
    busyMs: number;
    idleMs: number;
    memoryPressureMb: number;
    ioBurst: boolean;
    notes?: string;
  };
  diskReadMBps?: number;
  diskWriteMBps?: number;
};

type LeaderboardEntry = {
  name: string;
  peakRps: number;
  bestLatency: number;
  bestErrorRate: number;
  stabilityScore: number;
  serverState: string;
  level: LoadLevel;
  updatedAt: number;
};

type Translations = {
  navDashboard: string;
  navIdentity: string;
  navLeaderboard: string;
  heroTitle: string;
  heroLede: string;
  heroNote: string;
  highlightTitle: string;
  highlightSub: string;
  identityTitle: string;
  identitySub: string;
  identityLegendTitle: string;
  identityLegend1: string;
  identityLegend2: string;
  identityLegend3: string;
  stepsTitle: string;
  stepsSub: string;
  stepLow: string;
  stepNormal: string;
  stepPeak: string;
  monitorTitle: string;
  monitor1: string;
  monitor2: string;
  monitor3: string;
  leaderboardLabel: string;
  leaderboardTitle: string;
  leaderboardSub: string;
  specTitle: string;
  specSub: string;
  specRam: string;
  specDisk: string;
  specIo: string;
  profileTitle: string;
  stepOverload: string;
  overloadButton: string;
  ioOn: string;
  ioOff: string;
  warningPrefix: string;
  stagePrefix: string;
  metricsError: string;
  leaderboardError: string;
  leaderboardEmpty: string;
  namePlaceholder: string;
  nameSaved: (name: string) => string;
  nameTooShort: string;
  loadSwitchError: string;
  tagLive: string;
};

const translations: Record<Lang, Translations> = {
  ko: {
    navDashboard: '대시보드',
    navIdentity: '닉네임 설정',
    navLeaderboard: '리더보드',
    heroTitle: '동적 부하 처리 웹서비스 & Peak 성능 분석',
    heroLede:
      '요청량을 단계별로 올리며 RPS, CPU, 메모리, 응답 시간, 오류율을 한눈에 살피는 발표형 대시보드. 후배/수강생이 직접 버튼을 눌러 부하 변화를 체험할 수 있습니다.',
    heroNote: 'IIS 또는 Node.js(Express) 서버 + k6/AB/JMeter 연동 가능',
    highlightTitle: 'Peak 대비 상태',
    highlightSub: 'RPS · 응답 시간 · 오류율을 실시간으로 폴링합니다.',
    identityTitle: '닉네임 설정 (일시적)',
    identitySub:
      '현재 세션에서 사용할 닉네임을 설정하면 리더보드에 기록됩니다. IP나 계정 연동 없이, 로컬에만 임시 저장됩니다.',
    identityLegendTitle: '기록 방식',
    identityLegend1: '최근 15초 이동창으로 RPS/지연/오류율 계산',
    identityLegend2: 'CPU/메모리 실측(systeminformation) 반영',
    identityLegend3: '최고 RPS, 최저 평균 지연, 최소 오류율, 안정성 점수 저장',
    stepsTitle: '단계별 부하 실습',
    stepsSub:
      '버튼을 눌러 서버 부하 단계를 전환하면 `/api/load/:level`이 호출되고, `/api/metrics`가 갱신됩니다. 실제 발표에서는 k6/AB/JMeter 실행을 여기에 연결할 수 있습니다.',
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
    specTitle: 'Windows Server 2016 · 실시간 계측',
    specSub: 'Task Manager/PerfMon과 동일한 실시간 CPU·메모리·디스크 값을 그대로 표시합니다.',
    specRam: '실시간 RAM 사용/여유를 계산합니다.',
    specDisk: '실시간 디스크 IO(R/W MB/s)를 표시합니다.',
    specIo: 'IIS/Express 공용 · temp 파일 쓰기로 IO를 발생시킵니다.',
    profileTitle: '실시간 시스템 상태',
    stepOverload: 'Overload: 의도적 포화(오류율/지연 급증)',
    overloadButton: 'Overload 과부하',
    ioOn: '켜짐',
    ioOff: '꺼짐',
    warningPrefix: 'Peak 단계 경고: ',
    stagePrefix: '현재 단계:',
    metricsError: '메트릭을 불러올 수 없습니다. 서버 상태를 확인하세요.',
    leaderboardError: '리더보드를 불러올 수 없습니다.',
    leaderboardEmpty: '데이터 수집 대기 중...',
    namePlaceholder: '예: StudentA',
    nameSaved: (name: string) => `저장됨: ${name}`,
    nameTooShort: '2자 이상 입력하세요.',
    loadSwitchError: '부하 단계 전환 실패',
    tagLive: '실시간'
  },
  en: {
    navDashboard: 'Dashboard',
    navIdentity: 'Set Nickname',
    navLeaderboard: 'Leaderboard',
    heroTitle: 'Dynamic Load Service & Peak Performance Analysis',
    heroLede:
      'Raise load step-by-step and visualize RPS, CPU, memory, response time, and error rate in one view. Students can trigger changes themselves.',
    heroNote: 'Works with IIS or Node.js (Express) + k6/AB/JMeter',
    highlightTitle: 'Peak Readiness',
    highlightSub: 'Polling RPS, latency, and error rate in real time.',
    identityTitle: 'Nickname (temp, local)',
    identitySub:
      'Set a temporary nickname for this session; results on the leaderboard will use it. No IP/account is stored—kept in your browser only.',
    identityLegendTitle: 'How it records',
    identityLegend1: '15s sliding window for RPS/latency/error rate',
    identityLegend2: 'CPU/memory from systeminformation (OS metrics)',
    identityLegend3: 'Stores peak RPS, lowest avg latency, lowest error rate, stability score',
    stepsTitle: 'Load Lab Steps',
    stepsSub:
      'Click a button to change load level; `/api/load/:level` and `/api/metrics` update together. Hook your k6/AB/JMeter runs here.',
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
    specTitle: 'Windows Server 2016 · Live readings',
    specSub: 'Shows the exact CPU / memory / disk IO you see in Task Manager or PerfMon, live.',
    specRam: 'Displays live RAM use/headroom (no synthetic numbers).',
    specDisk: 'Shows live disk IO (R/W MB/s).',
    specIo: 'Works on IIS or Express; temp writes generate IO deterministically.',
    profileTitle: 'Live system state',
    stepOverload: 'Overload: intentional saturation (latency/error spike)',
    overloadButton: 'Overload',
    ioOn: 'on',
    ioOff: 'off',
    warningPrefix: 'Peak warning: ',
    stagePrefix: 'Current stage:',
    metricsError: 'Unable to load metrics. Check server health.',
    leaderboardError: 'Unable to load leaderboard.',
    leaderboardEmpty: 'Waiting for data...',
    namePlaceholder: 'e.g., StudentA',
    nameSaved: (name: string) => `Saved: ${name}`,
    nameTooShort: 'Enter at least 2 characters.',
    loadSwitchError: 'Failed to change load level',
    tagLive: 'Live'
  }
};

const helpTexts: Record<string, string> = {
  windows: 'Windows Server 2016: 프로젝트 서버 OS이자 부하 테스트가 진행되는 환경 (VMware 위에 구동).',
  vmware: 'VMware: Windows Server 2016을 가상 머신으로 실행하는 가상화 플랫폼.',
  ts: 'TypeScript (TS): JavaScript 기반, 정적 타입 지원 언어로 클라이언트·서버 개발에 사용.',
  webserver: 'Web Server (IIS/Node.js): 클라이언트 요청을 받아 처리하는 서버 런타임.',
  rps: 'RPS (Requests Per Second): 1초 동안 처리한 요청 수, 성능 핵심 지표.',
  latency: 'Latency: 요청부터 응답 도착까지 걸린 시간.',
  cpu: 'CPU Usage: 서버 연산 자원 사용률.',
  memory: 'Memory Usage: 서비스가 소비하는 RAM 용량.',
  errorRate: 'Error Rate: 전체 요청 대비 실패 비율.',
  loadtest: 'Load Test: 인위적 부하로 성능/안정성을 검증하는 테스트.',
  peak: 'Peak Load/Performance: 서버가 감당할 수 있는 최대 부하 한계.',
  overload: 'Overload: 의도적으로 자원을 포화시켜 오류율/지연을 체험하는 단계.',
  dashboard: 'Dashboard: RPS/CPU/메모리 등 지표를 실시간 시각화하는 화면.',
  leaderboard: 'Leaderboard: 부하 테스트 결과(피크 RPS, 지연, 오류율, 안정성)를 비교·순위화.',
  perfmon: 'Performance Monitor: Windows 자원 추적 도구(Processor Time, Memory 등).',
  taskmgr: 'Task Manager: CPU/메모리 변화를 UI로 확인하는 도구.',
  scalability: 'Scalability: 더 많은 부하를 처리하도록 확장 가능한 능력.',
  stability: 'Stability: 최대 부하 상황에서도 서비스가 정상 작동하는 능력.',
  webclient: 'Web Client: 실습자가 접속해 부하를 조작하는 브라우저 환경.'
};

declare const Chart: any;

type ChartSet = {
  rpsChart: any;
  resourceChart: any;
};

const MAX_POINTS = 30;
const levelLabels: Record<Lang, Record<LoadLevel, string>> = {
  ko: { low: 'Low', normal: 'Normal', peak: 'Peak', overload: 'Overload' },
  en: { low: 'Low', normal: 'Normal', peak: 'Peak', overload: 'Overload' }
};

const els = {
  warning: document.querySelector<HTMLElement>('#warning'),
  spec: {
    title: document.querySelector<HTMLElement>('#spec-title'),
    sub: document.querySelector<HTMLElement>('#spec-sub'),
    ram: document.querySelector<HTMLElement>('#spec-ram'),
    disk: document.querySelector<HTMLElement>('#spec-disk'),
    io: document.querySelector<HTMLElement>('#spec-io')
  },
  profile: {
    cpu: document.querySelector<HTMLElement>('#profile-cpu'),
    mem: document.querySelector<HTMLElement>('#profile-mem'),
    rps: document.querySelector<HTMLElement>('#profile-rps'),
    latency: document.querySelector<HTMLElement>('#profile-latency'),
    error: document.querySelector<HTMLElement>('#profile-error'),
    note: document.querySelector<HTMLElement>('#profile-note')
  },
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
  buttons: Array.from(document.querySelectorAll<HTMLButtonElement>('[data-level]')),
  identity: {
    form: document.querySelector<HTMLFormElement>('#name-form'),
    input: document.querySelector<HTMLInputElement>('#name-input'),
    status: document.querySelector<HTMLElement>('#name-status')
  },
  langButtons: Array.from(document.querySelectorAll<HTMLButtonElement>('.lang-btn')),
  leaderboardBody: document.querySelector<HTMLTableSectionElement>('#leaderboard-body')
};

const state: {
  level: LoadLevel;
  charts?: ChartSet;
  pollId?: number;
  leaderboardPollId?: number;
  name: string;
  leaderboard: LeaderboardEntry[];
  lang: Lang;
  lastSnapshot?: MetricSnapshot;
} = {
  level: 'low',
  leaderboard: [],
  lang: (localStorage.getItem('lang') as Lang) === 'en' ? 'en' : 'ko',
  name: localStorage.getItem('nickname') || 'Guest'
};

const dict = () => translations[state.lang];

function setText(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setupHelpTips() {
  const wraps = Array.from(document.querySelectorAll<HTMLElement>('.help-wrap'));
  wraps.forEach((wrap) => {
    const btn = wrap.querySelector<HTMLButtonElement>('.help');
    const tooltip = wrap.querySelector<HTMLElement>('.help-tooltip');
    const key = btn?.dataset.helpKey || '';
    if (!btn || !tooltip) return;
    tooltip.textContent = helpTexts[key] || '설명 없음 / No description';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      wraps.forEach((w) => w.classList.remove('open'));
      wrap.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    wraps.forEach((wrap) => wrap.classList.remove('open'));
  });
}

function applyLanguage(lang: Lang) {
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
  setText('spec-title', d.specTitle);
  setText('spec-sub', d.specSub);
  setText('spec-ram', d.specRam);
  setText('spec-disk', d.specDisk);
  setText('spec-io', d.specIo);
  setText('profile-title', d.profileTitle);
  setText('step-overload', d.stepOverload);
  setText('tag-live', d.tagLive);
  setText('th-rank', lang === 'ko' ? '순위' : 'Rank');
  setText('th-user', lang === 'ko' ? '사용자' : 'User');
  setText('th-peak', lang === 'ko' ? '최고 RPS' : 'Peak RPS');
  setText('th-latency', lang === 'ko' ? '평균 지연' : 'Avg Latency');
  setText('th-error', lang === 'ko' ? '오류율' : 'Error Rate');
  setText('th-state', lang === 'ko' ? '서버 상태' : 'Server State');
  setText('th-stability', lang === 'ko' ? '안정성' : 'Stability');

  const nameInput = document.getElementById('name-input') as HTMLInputElement | null;
  if (nameInput) nameInput.placeholder = d.namePlaceholder;
  const nameBtn = document.getElementById('name-save-btn');
  if (nameBtn) nameBtn.textContent = lang === 'ko' ? '저장' : 'Save';

  els.buttons.forEach((btn) => {
    const level = btn.dataset.level as LoadLevel;
    switch (level) {
      case 'low':
        btn.textContent = lang === 'ko' ? 'Low 부하' : 'Low Load';
        break;
      case 'normal':
        btn.textContent = lang === 'ko' ? 'Normal 부하' : 'Normal Load';
        break;
      case 'peak':
        btn.textContent = lang === 'ko' ? 'Peak 부하' : 'Peak Load';
        break;
      case 'overload':
        btn.textContent = lang === 'ko' ? d.overloadButton : d.overloadButton;
        break;
      default:
        btn.textContent = level;
    }
  });

  els.langButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.lang === lang));

  const stageLabel = levelLabels[lang][state.lastSnapshot?.level ?? state.level];
  const stageChip = document.getElementById('stage-chip');
  if (stageChip) stageChip.textContent = `${d.stagePrefix} ${stageLabel}`;
  setText('card-stage', stageLabel);

  if (state.lastSnapshot) {
    updateCards(state.lastSnapshot);
    renderProfileInfo(state.lastSnapshot);
  }
  renderLeaderboard(state.leaderboard);
}

function setWarning(message?: string, opts?: { prefix?: boolean }) {
  if (!els.warning) return;
  if (!message) {
    els.warning.hidden = true;
    els.warning.textContent = '';
    return;
  }
  els.warning.hidden = false;
  const usePrefix = opts?.prefix ?? true;
  els.warning.textContent = usePrefix ? `${dict().warningPrefix}${message}` : message;
}

function renderProfileInfo(snapshot: MetricSnapshot) {
  const d = dict();
  const total = snapshot.memoryTotalMb ?? snapshot.memoryCapacityMb;
  const free = snapshot.memoryFreeMb;
  const headroom = typeof snapshot.memoryHeadroomMb === 'number' && total ? Math.max(snapshot.memoryHeadroomMb, 0) : undefined;
  const diskRead = snapshot.diskReadMBps ?? 0;
  const diskWrite = snapshot.diskWriteMBps ?? 0;

  if (els.profile.cpu) {
    els.profile.cpu.textContent =
      state.lang === 'ko'
        ? `CPU 현재: ${snapshot.cpu.toFixed(1)}% · 단계: ${snapshot.level}`
        : `CPU now: ${snapshot.cpu.toFixed(1)}% · stage: ${snapshot.level}`;
  }
  if (els.profile.mem) {
    const usedLabel =
      total && free
        ? `${snapshot.memoryMb}MB / ${total}MB (free ${free}MB)`
        : `${snapshot.memoryMb}MB`;
    els.profile.mem.textContent =
      state.lang === 'ko' ? `메모리 사용: ${usedLabel}` : `Memory use: ${usedLabel}`;
  }
  if (els.profile.rps) {
    els.profile.rps.textContent = `${state.lang === 'ko' ? '실시간 RPS' : 'Live RPS'}: ${snapshot.rps.toFixed(1)} req/s`;
  }
  if (els.profile.latency) {
    els.profile.latency.textContent =
      state.lang === 'ko'
        ? `평균 지연(15초): ${snapshot.responseTimeMs.toFixed(0)} ms`
        : `Avg latency (15s): ${snapshot.responseTimeMs.toFixed(0)} ms`;
  }
  if (els.profile.error) {
    els.profile.error.textContent =
      state.lang === 'ko'
        ? `오류율(15초): ${snapshot.errorRate.toFixed(1)}%`
        : `Error rate (15s): ${snapshot.errorRate.toFixed(1)}%`;
  }
  if (els.profile.note) {
    const diskLabel =
      state.lang === 'ko'
        ? `디스크 IO: R ${diskRead.toFixed(2)} MB/s · W ${diskWrite.toFixed(2)} MB/s`
        : `Disk IO: R ${diskRead.toFixed(2)} MB/s · W ${diskWrite.toFixed(2)} MB/s`;
    const headroomLabel =
      headroom && total
        ? state.lang === 'ko'
          ? `RAM 여유 ${headroom.toFixed(0)}MB / 총 ${total}MB`
          : `RAM headroom ${headroom.toFixed(0)}MB / total ${total}MB`
        : '';
    const profileNote = snapshot.profile?.notes || '';
    const parts = [diskLabel, headroomLabel, profileNote].filter(Boolean);
    els.profile.note.textContent = parts.join(' · ');
  }
  if (els.spec.ram && headroom && total) {
    els.spec.ram.textContent =
      state.lang === 'ko'
        ? `RAM 실사용 ${snapshot.memoryMb}MB / ${total}MB, 여유 ${headroom.toFixed(0)}MB`
        : `RAM usage ${snapshot.memoryMb}MB / ${total}MB, headroom ${headroom.toFixed(0)}MB`;
  }
}

function updateCards(snapshot: MetricSnapshot) {
  els.cards.rps!.textContent = `${snapshot.rps.toFixed(0)} req/s`;
  els.cards.latency!.textContent = `${snapshot.responseTimeMs.toFixed(0)} ms`;
  els.cards.cpu!.textContent = `${snapshot.cpu.toFixed(1)}%`;
  els.cards.memory!.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
  els.cards.error!.textContent = `${snapshot.errorRate.toFixed(1)}%`;
  const label = levelLabels[state.lang][snapshot.level];
  els.cards.stage!.textContent = label;

  els.highlights.rps!.textContent = `${snapshot.rps.toFixed(0)} req/s`;
  els.highlights.cpu!.textContent = `${snapshot.cpu.toFixed(1)}%`;
  els.highlights.memory!.textContent = `${snapshot.memoryMb.toFixed(0)} MB`;
  els.highlights.stageChip!.textContent = `${dict().stagePrefix} ${label}`;
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

function bindLanguageSwitch() {
  els.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang as Lang;
      if (lang && lang !== state.lang) {
        applyLanguage(lang);
      }
    });
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
    setWarning(dict().loadSwitchError, { prefix: false });
  }
}

function formatLabel(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', { minute: '2-digit', second: '2-digit' });
}

async function refreshMetrics() {
  try {
    const res = await fetch(`/api/metrics?name=${encodeURIComponent(state.name || 'Guest')}`);
    if (!res.ok) throw new Error('metrics fetch failed');
    const snapshot = (await res.json()) as MetricSnapshot;
    state.lastSnapshot = snapshot;

    updateCards(snapshot);
    renderProfileInfo(snapshot);
    setWarning(snapshot.warning);

    if (state.charts) {
      pushData(state.charts.rpsChart, formatLabel(snapshot.timestamp), [snapshot.rps, snapshot.responseTimeMs]);
      pushData(state.charts.resourceChart, formatLabel(snapshot.timestamp), [snapshot.cpu, snapshot.memoryMb]);
    }
  } catch (err) {
    console.error(err);
    setWarning(dict().metricsError, { prefix: false });
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

function setNameStatus(message: string, tone: 'muted' | 'error' | 'ok' = 'muted') {
  if (!els.identity.status) return;
  els.identity.status.textContent = message;
  const color =
    tone === 'error' ? '#ff9f9f' : tone === 'ok' ? '#5dd5c4' : getComputedStyle(document.body).getPropertyValue('--muted');
  els.identity.status.style.color = color;
}

function renderLeaderboard(entries: LeaderboardEntry[]) {
  if (!els.leaderboardBody) return;
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
    if (!res.ok) throw new Error('leaderboard fetch failed');
    const data = (await res.json()) as { entries: LeaderboardEntry[] };
    state.leaderboard = data.entries;
    renderLeaderboard(state.leaderboard);
  } catch (err) {
    console.error(err);
    if (els.leaderboardBody) {
      els.leaderboardBody.innerHTML = `<tr><td colspan="7" class="muted">${dict().leaderboardError}</td></tr>`;
    }
  }
}

function bindIdentityForm() {
  if (!els.identity.form || !els.identity.input) return;
  els.identity.input.value = state.name;
  setNameStatus(dict().nameSaved(state.name), 'ok');
  els.identity.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.identity.input!.value.trim();
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
  setupHelpTips();
  state.charts = setupCharts();
  bindControls();
  bindLanguageSwitch();
  bindIdentityForm();
  startPolling();
  startLeaderboardPolling();
}

window.addEventListener('DOMContentLoaded', init);
