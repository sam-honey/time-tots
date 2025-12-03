export interface TimeState {
  hours: number;
  minutes: number;
  totalMinutes: number; // 0 to 1439 (24 hours * 60)
}

export enum GameMode {
  EXPLORE = 'EXPLORE',
  QUIZ = 'QUIZ'
}

export interface QuizQuestion {
  questionText: string;
  targetHour: number;
  targetMinute: number;
  hint: string;
}

export interface DragState {
  isDragging: boolean;
  handType: 'hour' | 'minute' | null;
}