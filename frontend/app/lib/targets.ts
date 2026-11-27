import { apiFetch } from "./api";

// Full-time baseline: 100% corresponds to 43h over 5 working days per week.
export const FULL_WEEK_HOURS = 43;
export const WORKING_DAYS_PER_WEEK = 5;

export type WorkingHoursTarget = {
  id: number;
  effective_date: string; // YYYY-MM-DD
  percentage: number;
};

export function fetchWorkingHoursTargets(): Promise<WorkingHoursTarget[]> {
  return apiFetch<WorkingHoursTarget[]>("/working_hours/");
}

// Percentage of the latest change effective on or before `isoDate`
// (compared at UTC midnight), or null when no change applies yet.
export function effectiveTargetOnDate(
  targets: WorkingHoursTarget[],
  isoDate: Date,
): number | null {
  const t = isoDate.getTime();
  let best: { effective: number; percentage: number } | null = null;
  for (const target of targets) {
    const effective = new Date(`${target.effective_date}T00:00:00Z`).getTime();
    if (effective <= t && (best === null || effective > best.effective)) {
      best = { effective, percentage: target.percentage };
    }
  }
  return best === null ? null : best.percentage;
}

// Monday (UTC) of ISO week `week` of ISO year `year` — same Jan-4 anchor the
// rest of the app uses for ISO weeks.
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7; // Mon=1 .. Sun=7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayNum - 1) + (week - 1) * 7);
  return monday;
}

// Expected hours for an ISO week: the target effective on its Monday.
export function weekTargetHours(
  targets: WorkingHoursTarget[],
  year: number,
  week: number,
): number | null {
  const pct = effectiveTargetOnDate(targets, isoWeekMonday(year, week));
  return pct === null ? null : (FULL_WEEK_HOURS * pct) / 100;
}

// Expected hours for a calendar day (year + 1-based day-of-year).
// The percentage scales how many full working days (5 * percentage) make up
// the week, so a worked day is always compared against a full 8.6h day.
export function dayTargetHours(
  targets: WorkingHoursTarget[],
  year: number,
  dayOfYear: number,
): number | null {
  const date = new Date(Date.UTC(year, 0, dayOfYear - 1));
  const pct = effectiveTargetOnDate(targets, date);
  return pct === null ? null : FULL_WEEK_HOURS / WORKING_DAYS_PER_WEEK;
}
