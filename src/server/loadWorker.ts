import { parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';

type WorkerConfig = {
  busyMs: number;
  idleMs: number;
};

let { busyMs, idleMs } = workerData as WorkerConfig;
let running = true;

function burnCpu(ms: number) {
  const end = performance.now() + ms;
  let acc = 1;
  while (performance.now() < end) {
    // deterministic CPU work (no randomness)
    acc = Math.sqrt(acc * 1.0001 + 12345);
    if (acc > 1e6) acc = acc % 1000;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loop() {
  while (running) {
    burnCpu(busyMs);
    if (idleMs > 0) {
      await sleep(idleMs);
    }
  }
  parentPort?.postMessage('stopped');
}

parentPort?.on('message', (msg: any) => {
  if (msg === 'stop') {
    running = false;
    return;
  }
  if (msg?.busyMs) {
    busyMs = msg.busyMs;
    idleMs = typeof msg.idleMs === 'number' ? msg.idleMs : idleMs;
  }
});

void loop();
