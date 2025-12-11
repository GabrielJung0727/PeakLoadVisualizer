import fs from 'fs';
import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';
import { LoadLevel, LoadProfileSnapshot } from './types';

type LoadProfile = LoadProfileSnapshot & { ioIntervalMs: number };

const tmpFile = path.join(os.tmpdir(), 'win2016-load-io.bin');

const profiles: Record<LoadLevel, LoadProfile> = {
  low: {
    level: 'low',
    cpuWorkers: 0,
    busyMs: 80,
    idleMs: 420,
    memoryPressureMb: 0,
    ioBurst: false,
    ioIntervalMs: 3000,
    notes: 'Warmup stage · cache priming'
  },
  normal: {
    level: 'normal',
    cpuWorkers: 1,
    busyMs: 220,
    idleMs: 180,
    memoryPressureMb: 64,
    ioBurst: false,
    ioIntervalMs: 2200,
    notes: 'Steady traffic · Windows 2016 2GB baseline'
  },
  peak: {
    level: 'peak',
    cpuWorkers: Math.min(Math.max(os.cpus().length - 1, 1), 3),
    busyMs: 520,
    idleMs: 120,
    memoryPressureMb: 128,
    ioBurst: true,
    ioIntervalMs: 1600,
    notes: 'Peak push · CPU near saturation'
  },
  overload: {
    level: 'overload',
    cpuWorkers: Math.min(Math.max(os.cpus().length, 2), 4),
    busyMs: 900,
    idleMs: 80,
    memoryPressureMb: 256,
    ioBurst: true,
    ioIntervalMs: 900,
    notes: 'Intentional overload · triggers warnings'
  }
};

export class LoadManager {
  private workers: Worker[] = [];
  private memoryBlocks: Buffer[] = [];
  private ioTimer?: NodeJS.Timeout;
  private profile: LoadProfile = profiles.low;

  constructor() {
    this.applyProfile('low');
  }

  setLevel(level: LoadLevel) {
    this.applyProfile(level);
  }

  getProfile(): LoadProfileSnapshot {
    return { ...this.profile };
  }

  private applyProfile(level: LoadLevel) {
    this.stopWorkers();
    this.stopSimulations();
    this.profile = profiles[level];
    this.spinWorkers(this.profile);
    this.applyMemoryPressure(this.profile.memoryPressureMb);
    this.startIoSimulation(this.profile);
  }

  private spinWorkers(profile: LoadProfile) {
    const workerJs = path.join(__dirname, 'loadWorker.js');
    const workerTs = path.join(__dirname, 'loadWorker.ts');
    const workerPath = fs.existsSync(workerJs) ? workerJs : workerTs;
    for (let i = 0; i < profile.cpuWorkers; i += 1) {
      const worker = new Worker(workerPath, {
        workerData: { busyMs: profile.busyMs, idleMs: profile.idleMs },
        execArgv: workerPath.endsWith('.ts') ? ['-r', 'ts-node/register'] : []
      });
      this.workers.push(worker);
    }
  }

  private stopWorkers() {
    this.workers.forEach((worker) => {
      worker.postMessage('stop');
      worker.unref();
      void worker.terminate();
    });
    this.workers = [];
  }

  private applyMemoryPressure(memoryPressureMb: number) {
    this.memoryBlocks = [];
    if (memoryPressureMb <= 0) return;

    const chunkMb = 16;
    const fullChunks = Math.floor(memoryPressureMb / chunkMb);
    for (let i = 0; i < fullChunks; i += 1) {
      this.memoryBlocks.push(Buffer.alloc(chunkMb * 1024 * 1024, i % 255));
    }
    const remainder = memoryPressureMb % chunkMb;
    if (remainder > 0) {
      this.memoryBlocks.push(Buffer.alloc(remainder * 1024 * 1024, 1));
    }
  }

  private startIoSimulation(profile: LoadProfile) {
    if (!profile.ioBurst) return;
    const runIo = async () => {
      try {
        const buf = Buffer.alloc(64 * 1024, Date.now() % 255);
        await fs.promises.writeFile(tmpFile, buf);
        await fs.promises.readFile(tmpFile);
      } catch (err) {
        console.error('IO burst error', err);
      }
    };
    this.ioTimer = setInterval(runIo, profile.ioIntervalMs).unref();
  }

  private stopSimulations() {
    if (this.ioTimer) clearInterval(this.ioTimer);
    this.ioTimer = undefined;
  }
}

export const loadManager = new LoadManager();
