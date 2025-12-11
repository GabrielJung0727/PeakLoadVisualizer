export type LoadLevel = 'low' | 'normal' | 'peak' | 'overload';

export type LoadProfileSnapshot = {
  level: LoadLevel;
  cpuWorkers: number;
  busyMs: number;
  idleMs: number;
  memoryPressureMb: number;
  ioBurst: boolean;
  notes?: string;
};
