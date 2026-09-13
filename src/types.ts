export type HabitId =
  | 'sleep'
  | 'light'
  | 'exercise'
  | 'deepWork'
  | 'recall'
  | 'hardThing'
  | 'rest';

export interface HabitDef {
  id: HabitId;
  number: number;
  title: string;
  detail: string;
  cue: string;
}

export interface DayScheduleItem {
  id: string;
  label: string;
  hint: string;
}

export interface IdentityTrigger {
  id: string;
  identity: string;
  trigger: string;
  createdAt: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  habits: Partial<Record<HabitId, boolean>>;
  hardThingNote: string;
  scheduleDone: Partial<Record<string, boolean>>;
  focusMinutes: number;
  notes: string;
}

export interface AppState {
  days: Record<string, DayLog>;
  triggers: IdentityTrigger[];
  startDate: string;
}