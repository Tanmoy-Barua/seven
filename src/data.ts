import type { DayScheduleItem, HabitDef } from './types';

export const HABITS: HabitDef[] = [
  {
    id: 'sleep',
    number: 1,
    title: 'Sleep 7–9 hours',
    detail: 'Go to bed and wake up at the same time every day.',
    cue: 'Same bedtime, same wake time.',
  },
  {
    id: 'light',
    number: 2,
    title: 'Morning sun, night dim',
    detail: 'Get sunlight in the morning. Keep lights low at night.',
    cue: 'Outside within an hour of waking.',
  },
  {
    id: 'exercise',
    number: 3,
    title: 'Move most days',
    detail: 'Some running or walking, some lifting.',
    cue: 'Walk, run, or lift — just show up.',
  },
  {
    id: 'deepWork',
    number: 4,
    title: 'Two hours, phone away',
    detail: 'Do your hardest work for 2 hours with your phone in another room.',
    cue: 'One task. Phone in another room.',
  },
  {
    id: 'recall',
    number: 5,
    title: 'Close the book',
    detail: "Don't just read — close the book and try to say it from memory.",
    cue: 'Learn, then retrieve.',
  },
  {
    id: 'hardThing',
    number: 6,
    title: 'One small hard thing',
    detail: 'Cold shower, tough workout, a scary phone call.',
    cue: 'Do the thing you want to postpone.',
  },
  {
    id: 'rest',
    number: 7,
    title: 'Rest for real',
    detail: 'A few minutes daily. A few hours weekly. One full day monthly. No work, no scrolling.',
    cue: 'No work. No scrolling.',
  },
];

export const DAY_SCHEDULE: DayScheduleItem[] = [
  {
    id: 'morning',
    label: 'Wake → outside → water → short walk',
    hint: 'Start the light and the body first.',
  },
  {
    id: 'deep',
    label: '2 hours of hard work, one task only',
    hint: 'Phone in another room.',
  },
  {
    id: 'break',
    label: 'Break: walk, no phone',
    hint: 'Let your mind settle without a feed.',
  },
  {
    id: 'gym',
    label: 'Gym or second work block',
    hint: 'Move, or go deep again.',
  },
  {
    id: 'afternoon',
    label: 'Afternoon: easy stuff',
    hint: 'Emails, errands, driving.',
  },
  {
    id: 'night',
    label: 'Night: lights low, phone away, same bedtime',
    hint: 'Protect tomorrow morning.',
  },
];

export const IGNORE_LIST = [
  'Supplements as a substitute for the basics',
  'Expensive gadgets that track instead of do',
  'Waking at 5 AM to look impressive',
];

export const MILESTONES = [
  { days: 14, label: '2 weeks', result: 'You feel better.' },
  { days: 90, label: '3 months', result: 'People notice.' },
  { days: 365, label: '1 year', result: 'You look like you have superpowers. You don’t. You just did the same 7 things every day.' },
];
