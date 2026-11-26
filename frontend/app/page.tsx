"use client";
import { CalendarWeekTable } from "./overview";
import { Detail } from "./detail";
import { useEffect, useState } from "react";

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
  const [year, setYear] = useState<number>(2026);
  const [calendarWeek, setCalendarWeek] = useState<number>(() =>
    calendarWeekOf(new Date()),
  );

  useEffect(() => {
    console.log(year);
  }, [year]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="flex flex-col h-full min-h-screen">
        <header className="w-full px-8 py-6 flex items-center bg-gray-300">
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            TimeTracker
          </h1>
        </header>
        <main className="flex flex-row gap-8 px-8">
          <section className="w-full max-w-2xl">
            <CalendarWeekTable
              year={year}
              calendar_week={calendarWeek}
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
      </div>
    </div>
  );
}
