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

export interface VideoTimestamp {
  id: string;
  phase: number;
  title: string;
  seconds: number;
  timeFormatted: string;
  description: string;
}
