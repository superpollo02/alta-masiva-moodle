export interface ProtocolStep {
  id: string;
  phase: number;
  phaseTitle: string;
  title: string;
  description: string;
  details: string[];
  tips?: string[];
  warning?: string;
  imageHint?: string;
}

export interface TroubleshootingItem {
  id: string;
  problem: string;
  cause: string;
  solution: string[];
  severity: 'warning' | 'error' | 'info';
}

export interface CsvRow {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  course1: string;
  group1?: string;
}

export interface VideoTimestamp {
  id: string;
  phase: number;
  title: string;
  seconds: number;
  timeFormatted: string;
  description: string;
}
