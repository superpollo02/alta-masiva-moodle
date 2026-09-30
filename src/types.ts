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

export type MoodleRole = 'student' | 'editingteacher' | 'teacher' | 'coursecreator';

export interface CsvRow {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  course1: string;
  role1?: string;
  group1?: string;
  course2?: string;
  role2?: string;
  group2?: string;
}

export interface VideoTimestamp {
  id: string;
  phase: number;
  title: string;
  seconds: number;
  timeFormatted: string;
  description: string;
}
