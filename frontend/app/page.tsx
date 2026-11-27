"use client";
import { CalendarWeekTable } from "./overview";
import { Detail } from "./detail";
import { useState } from "react";

// ISO-8601 calendar week of a date — the same value the backend's
// PostgreSQL EXTRACT(WEEK FROM ...) produces.
function calendarWeekOf(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7; // ISO weeks start on Monday; Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function Home() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [calendarWeek, setCalendarWeek] = useState<number>(() =>
    calendarWeekOf(new Date()),
  );

  return (
    <main className="flex flex-row gap-8 px-8">
      <section className="w-full max-w-2xl">
        <CalendarWeekTable
          year={year}
          onYearChange={setYear}
          onCalendarWeekChange={setCalendarWeek}
        />
      </section>
      <section className="w-full max-w-2xl">
        <Detail
          year={year}
          calendarWeek={calendarWeek}
          onChange={setYear}
          onCalendarWeekChange={setCalendarWeek}
        />
      </section>
    </main>
  );
}
