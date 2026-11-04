import { z } from 'zod';

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export const pinRegex = /^\d{4,6}$/;

export const intensityEnum = z.enum(['spotting', 'light', 'medium', 'heavy']);
export const libidoEnum = z.enum(['low', 'normal', 'high']).nullable();

export const symptomLogSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date format'),
  cramps: z.number().min(0).max(3).optional().default(0),
  bloating: z.boolean().optional().default(false),
  headache: z.boolean().optional().default(false),
  breastTenderness: z.boolean().optional().default(false),
  fatigue: z.number().min(0).max(5).optional().default(0),
  acne: z.boolean().optional().default(false),
  libido: z.enum(['low', 'normal', 'high']).nullable().optional().default(null),
  mood: z.array(z.string()).max(16).optional().default([]),
  sleepQuality: z.number().min(1).max(5).nullable().optional().default(null),
  waterIntake: z.number().min(0).max(20).nullable().optional().default(null),
  exercise: z.string().max(64).optional().default(''),
  sexualActivity: z.boolean().optional().default(false),
  contraception: z.string().optional().default(''),
  notes: z.string().optional().nullable(),
  periodStart: z.boolean().optional().default(false),
  periodEnd: z.boolean().optional().default(false),
});

export const entrySchema = z.object({
  id: z.string().optional(),
  startDate: z.string().regex(dateRegex, 'Invalid start date'),
  endDate: z.string().regex(dateRegex).nullable().optional(),
  intensity: intensityEnum.default('medium'),
  notes: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  avgCycleLength: z.number().min(15).max(60),
  lutealLength: z.number().min(8).max(16),
  dailyReminderOn: z.boolean().default(true),
  dailyReminderTime: z.string().regex(timeRegex).default('20:00'),
  periodAlertOn: z.boolean().default(true),
  fertileWindowOn: z.boolean().default(true),
  appLockEnabled: z.boolean().default(false),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  name: z.string().optional(),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

export type SymptomLogInput = z.infer<typeof symptomLogSchema>;
export type EntryInput = z.infer<typeof entrySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
